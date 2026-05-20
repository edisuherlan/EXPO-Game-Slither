/**
 * HALAMAN LEADERBOARD
 * -------------------
 * Menampilkan skor terbaik dari koleksi Firestore `leaderboard`.
 *
 * Konsep yang dipelajari:
 *   - `FlatList` untuk daftar panjang (efisien vs map biasa)
 *   - Fetch async + state loading/error
 *   - Query Firestore: orderBy + limit (lihat firestoreService.ts)
 *
 * Satu dokumen leaderboard = satu pemain (ID = playerId),
 * field `bestScore` di-update hanya jika skor baru lebih tinggi.
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { GAME } from '../constants/game';
import {
  fetchLeaderboard,
  type LeaderboardRow,
} from '../services/firestoreService';

type Props = {
  onBack: () => void;
};

export function LeaderboardScreen({ onBack }: Props) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeaderboard(15);
      setRows(data);
    } catch {
      setError('Tidak bisa memuat leaderboard. Pastikan Firestore aktif & Rules sudah Publish.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>← Kembali</Text>
        </Pressable>
        <Text style={styles.title}>Leaderboard</Text>
        <Pressable onPress={load} hitSlop={12}>
          <Text style={styles.refresh}>↻</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator
          style={styles.loader}
          size="large"
          color={GAME.colors.snakeBody}
        />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : rows.length === 0 ? (
        <Text style={styles.empty}>Belum ada skor. Main dulu!</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <View style={styles.rowBody}>
                <Text style={styles.name}>{item.displayName}</Text>
              </View>
              <Text style={styles.points}>{item.bestScore}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GAME.colors.background,
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  back: {
    color: GAME.colors.hud,
    fontSize: 15,
  },
  title: {
    color: GAME.colors.snakeBody,
    fontSize: 22,
    fontWeight: '800',
  },
  refresh: {
    color: GAME.colors.snakeOutline,
    fontSize: 22,
  },
  loader: {
    marginTop: 40,
  },
  error: {
    color: GAME.colors.danger,
    textAlign: 'center',
    padding: 24,
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252545',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  rank: {
    color: GAME.colors.snakeOutline,
    fontWeight: '800',
    width: 36,
    fontSize: 16,
  },
  rowBody: {
    flex: 1,
  },
  name: {
    color: GAME.colors.hud,
    fontSize: 16,
    fontWeight: '600',
  },
  points: {
    color: GAME.colors.food,
    fontWeight: '800',
    fontSize: 18,
  },
});
