/**
 * HALAMAN HOME (Menu Utama)
 * -------------------------
 * Tujuan pembelajaran:
 * 1. Form input React Native (`TextInput`, `Pressable`)
 * 2. `useEffect` untuk load data saat mount
 * 3. AsyncStorage — menyimpan nama & ID pemain di perangkat
 *
 * Alur:
 *   mount → baca playerId + nama tersimpan → tampilkan form
 *   tombol Main → simpan nama → callback `onPlay` ke App.tsx
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GAME } from '../constants/game';
import {
  getDisplayName,
  getOrCreatePlayerId,
  saveDisplayName,
} from '../services/playerStorage';

type Props = {
  /** Dipanggil App.tsx saat user siap bermain */
  onPlay: (displayName: string) => void;
  onLeaderboard: () => void;
};

export function HomeScreen({ onPlay, onLeaderboard }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  /** Saat layar pertama kali tampil, muat data lokal pemain */
  useEffect(() => {
    (async () => {
      await getOrCreatePlayerId();
      const saved = await getDisplayName();
      setName(saved || 'Pemain');
      setLoading(false);
    })();
  }, []);

  const handlePlay = useCallback(async () => {
    const trimmed = name.trim() || 'Pemain';
    await saveDisplayName(trimmed);
    onPlay(trimmed);
  }, [name, onPlay]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={GAME.colors.snakeBody} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Slither</Text>
      <Text style={styles.subtitle}>
        Multiplayer — makanan & ular satu dunia (shared Firestore)
      </Text>

      <Text style={styles.label}>Nama pemain</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Nama kamu"
        placeholderTextColor="#888"
        maxLength={20}
      />

      <Pressable style={styles.primaryBtn} onPress={handlePlay}>
        <Text style={styles.primaryBtnText}>Main</Text>
      </Pressable>

      <Pressable style={styles.secondaryBtn} onPress={onLeaderboard}>
        <Text style={styles.secondaryBtnText}>Leaderboard</Text>
      </Pressable>

      <Text style={styles.hint}>
        Titik merah sama untuk semua pemain — siapa cepat dia dapat. Tes dengan 2+ HP.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GAME.colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    backgroundColor: GAME.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: GAME.colors.snakeBody,
    textAlign: 'center',
  },
  subtitle: {
    color: GAME.colors.hud,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
    opacity: 0.85,
  },
  label: {
    color: GAME.colors.hud,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#252545',
    color: GAME.colors.hud,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: GAME.colors.snakeBody,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GAME.colors.snakeOutline,
  },
  secondaryBtnText: {
    color: GAME.colors.snakeOutline,
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    color: '#888',
    textAlign: 'center',
    marginTop: 28,
    fontSize: 13,
  },
});
