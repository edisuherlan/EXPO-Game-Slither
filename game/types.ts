/**
 * TIPE DATA GAME
 * --------------
 * TypeScript types menjelaskan "bentuk" state tanpa kode runtime.
 * Mahasiswa: pelajari perbedaan type vs interface (di sini pakai type).
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */

export type Vec2 = { x: number; y: number };

/** Makanan = posisi + id unik (Firestore doc id atau local-xxx) */
export type Food = Vec2 & { id: string };

export type GameStatus = 'playing' | 'dead';

/** State lengkap satu sesi permainan — disimpan di React state + ref */
export type GameState = {
  status: GameStatus;
  snake: Vec2[];
  angle: number;
  targetAngle: number;
  foods: Food[];
  score: number;
  length: number;
  speed: number;
  viewportWidth: number;
  viewportHeight: number;
  worldWidth: number;
  worldHeight: number;
};

/** Input dari sentuhan — dibaca engine tiap frame */
export type GameInput = {
  targetAngle: number;
  steering: boolean;
};
