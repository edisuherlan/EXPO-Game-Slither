/**
 * KONSTANTA MULTIPLAYER
 * ---------------------
 * Satu ruang global = semua mahasiswa latihan di dunia yang sama.
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
/** Satu ruang bersama — semua pemain di dunia yang sama */
export const MULTIPLAYER_ROOM_ID = 'global';

/** Interval kirim posisi ke Firestore (ms) — lebih kecil = lebih smooth, lebih boros */
export const SYNC_INTERVAL_MS = 200;

/** Jika updatedAt lebih lama dari ini, pemain dianggap offline */
export const PLAYER_STALE_MS = 8000;

/** Batas segmen dikirim ke Firestore (hemat bandwidth) */
export const MAX_SYNC_SEGMENTS = 18;
