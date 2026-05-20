/**
 * NAMA KOLEKSI FIRESTORE
 * ----------------------
 * Centralized string constants — hindari typo path koleksi.
 * Cocokkan dengan file firestore.rules di root project.
 *
 * Project Firebase: gameslither-28be8
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
export const COLLECTIONS = {
  players: 'players',
  scores: 'scores',
  leaderboard: 'leaderboard',
  games: 'games',
  /** Makanan shared (koleksi root — mudah di-rules) */
  slitherFoods: 'slither_foods',
  slitherRoom: 'slither_room',
} as const;

export type FirestoreCollectionName =
  (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
