/**
 * ROOT NAVIGATOR (navigasi manual tanpa React Navigation)
 * ------------------------------------------------------
 * Proyek ini sengaja memakai state `screen` sederhana agar mahasiswa
 * fokus pada logika game & Firebase, bukan library routing.
 *
 * Tiga "halaman" utama:
 *   - home        → HomeScreen (menu & nama pemain)
 *   - game        → GameScreen (permainan + HUD)
 *   - leaderboard → LeaderboardScreen (skor terbaik dari Firestore)
 *
 * Props `displayName` dioper ke GameScreen setelah user menekan Main.
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { GAME } from './constants/game';
import { GameScreen } from './screens/GameScreen';
import { HomeScreen } from './screens/HomeScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';

/** Daftar nama layar yang boleh ditampilkan */
type Screen = 'home' | 'game' | 'leaderboard';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [displayName, setDisplayName] = useState('Pemain');

  const goHome = useCallback(() => setScreen('home'), []);
  const goLeaderboard = useCallback(() => setScreen('leaderboard'), []);

  /** Simpan nama lalu pindah ke layar game */
  const startGame = useCallback((name: string) => {
    setDisplayName(name);
    setScreen('game');
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {/* Conditional rendering: hanya satu screen aktif */}
      {screen === 'home' && (
        <HomeScreen onPlay={startGame} onLeaderboard={goLeaderboard} />
      )}
      {screen === 'game' && (
        <GameScreen
          displayName={displayName}
          onBack={goHome}
          onLeaderboard={goLeaderboard}
        />
      )}
      {screen === 'leaderboard' && (
        <LeaderboardScreen onBack={goHome} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GAME.colors.background,
  },
});
