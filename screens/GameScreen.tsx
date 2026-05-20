/**
 * HALAMAN GAME (Orkestrator Permainan)
 * ------------------------------------
 * Layar ini TIDAK menggambar ular langsung — itu tugas `GameBoard`.
 * Peran GameScreen:
 *   - HUD (skor, jumlah online, peringatan Firestore)
 *   - Menghubungkan custom hooks: multiplayer + makanan shared
 *   - Menyimpan skor ke Firestore saat game over
 *
 * Pola React penting:
 *   - `useRef` untuk nilai yang tidak perlu re-render (lastScore)
 *   - Callback ke child (`onGameOver`, `onStateSync`)
 *   - Komposisi: Screen = logic + layout, Board = canvas game
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { GameBoard } from '../components/game/GameBoard';
import { GAME } from '../constants/game';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { useSharedFoods } from '../hooks/useSharedFoods';
import type { GameState } from '../game/types';
import { saveGameResult } from '../services/firestoreService';
import { getOrCreatePlayerId } from '../services/playerStorage';

type Props = {
  displayName: string;
  onBack: () => void;
  onLeaderboard: () => void;
};

export function GameScreen({ displayName, onBack, onLeaderboard }: Props) {
  const [hudScore, setHudScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const lastScore = useRef(0);
  const lastLength = useRef(0);

  /** Ukuran dunia dikirim GameBoard lewat onWorldReady — dipakai hook makanan */
  const [world, setWorld] = useState<{
    worldWidth: number;
    worldHeight: number;
    viewportWidth: number;
    viewportHeight: number;
  } | null>(null);

  const {
    remotePlayers,
    onlineCount,
    syncFromGameState,
    notifyDeath,
  } = useMultiplayer({ displayName, enabled: true });

  const { foods: sharedFoods, consumeFood, foodHint, usingFallback } =
    useSharedFoods(world, true);

  /** Dipanggil GameBoard ketika ular mati (tabrakan tubuh sendiri / pemain lain) */
  const handleGameOver = useCallback(
    async (score: number, length: number) => {
      setGameOver(true);
      notifyDeath();
      lastScore.current = score;
      lastLength.current = length;
      setSaving(true);
      try {
        const playerId = await getOrCreatePlayerId();
        await saveGameResult(playerId, displayName, score, length);
        setSaved(true);
      } catch {
        setSaved(false);
      } finally {
        setSaving(false);
      }
    },
    [displayName, notifyDeath],
  );

  const handleScoreTick = useCallback((score: number) => {
    setHudScore(score);
  }, []);

  /** Setiap frame, posisi ular dikirim ke Firestore (throttle di hook) */
  const handleStateSync = useCallback(
    (state: GameState) => {
      syncFromGameState(state);
    },
    [syncFromGameState],
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.hud}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>← Menu</Text>
        </Pressable>
        <View style={styles.hudCenter}>
          <Text style={styles.player}>{displayName}</Text>
          <Text style={styles.online}>Online: {onlineCount}</Text>
          {foodHint && usingFallback ? (
            <Text style={styles.foodWarn} numberOfLines={3}>
              {foodHint}
            </Text>
          ) : null}
        </View>
        <Text style={styles.score}>Skor {hudScore}</Text>
      </View>

      <GameBoard
        onGameOver={handleGameOver}
        onScoreChange={handleScoreTick}
        remotePlayers={remotePlayers}
        onStateSync={handleStateSync}
        sharedFoods={sharedFoods}
        onConsumeFood={consumeFood}
        onWorldReady={setWorld}
      />

      {gameOver && (
        <View style={styles.footer}>
          {saving ? (
            <ActivityIndicator color={GAME.colors.snakeBody} />
          ) : (
            <Text style={styles.saveMsg}>
              {saved
                ? `Skor ${lastScore.current} tersimpan ke Firestore`
                : 'Gagal simpan — cek koneksi & Firestore Rules'}
            </Text>
          )}
          <View style={styles.footerBtns}>
            <Pressable style={styles.btn} onPress={onBack}>
              <Text style={styles.btnText}>Menu</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnAlt]} onPress={onLeaderboard}>
              <Text style={styles.btnText}>Leaderboard</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GAME.colors.background,
  },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 8,
  },
  back: {
    color: GAME.colors.hud,
    fontSize: 15,
  },
  hudCenter: {
    alignItems: 'center',
  },
  player: {
    color: GAME.colors.snakeOutline,
    fontWeight: '600',
  },
  online: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  foodWarn: {
    color: '#ffb347',
    fontSize: 9,
    marginTop: 2,
    maxWidth: 160,
  },
  score: {
    color: GAME.colors.hud,
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    padding: 16,
    paddingBottom: 28,
    backgroundColor: '#12122a',
    gap: 12,
  },
  saveMsg: {
    color: GAME.colors.hud,
    textAlign: 'center',
    fontSize: 13,
  },
  footerBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    backgroundColor: GAME.colors.snakeBody,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnAlt: {
    backgroundColor: GAME.colors.snakeHead,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
