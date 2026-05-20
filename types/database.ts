/**
 * TIPE DOKUMEN FIRESTORE
 * ----------------------
 * Mendeskripsikan field di setiap koleksi — membantu autocomplete TypeScript
 * saat memanggil setDoc / membaca snapshot.data().
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
import type { Timestamp } from 'firebase/firestore';

export type PlayerDoc = {
  displayName: string;
  createdAt: Timestamp;
  lastPlayedAt?: Timestamp;
};

/** Satu baris riwayat permainan di koleksi scores */
export type ScoreDoc = {
  playerId: string;
  displayName: string;
  score: number;
  length: number;
  playedAt: Timestamp;
};

/** Satu pemain = satu dokumen (id = playerId), field bestScore */
export type LeaderboardEntryDoc = {
  playerId: string;
  displayName: string;
  bestScore: number;
  updatedAt: Timestamp;
};

export type GameSessionDoc = {
  status: 'waiting' | 'active' | 'finished';
  playerIds: string[];
  startedAt?: Timestamp;
  endedAt?: Timestamp;
};
