/**
 * TIPE DATA MULTIPLAYER
 * ---------------------
 * RemotePlayer = data ular pemain lain setelah di-parse dari Firestore.
 * LivePlayerPayload = bentuk data yang KITA tulis ke dokumen live.
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
import type { Vec2 } from '../game/types';

export type RemotePlayer = {
  id: string;
  displayName: string;
  score: number;
  length: number;
  angle: number;
  segments: Vec2[];
  alive: boolean;
  color: string;
  updatedAtMs: number;
};

export type LivePlayerPayload = {
  displayName: string;
  score: number;
  length: number;
  angle: number;
  segments: Vec2[];
  alive: boolean;
  color: string;
};
