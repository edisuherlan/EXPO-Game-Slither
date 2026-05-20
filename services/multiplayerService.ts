/**
 * FIRESTORE MULTIPLAYER (Live Players)
 * ------------------------------------
 * Path: games/global/live/{playerId}
 *
 * Setiap pemain menulis posisi ular sendiri; pemain lain subscribe koleksi
 * `live` dan menggambar ular remote di GameBoard.
 *
 * Optimasi: hanya kirim MAX_SYNC_SEGMENTS titik + throttle di hook.
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';

import {
  MAX_SYNC_SEGMENTS,
  MULTIPLAYER_ROOM_ID,
  PLAYER_STALE_MS,
} from '../constants/multiplayer';
import type { GameState } from '../game/types';
import { db } from '../lib/firebase';
import type { LivePlayerPayload, RemotePlayer } from '../types/multiplayer';

const LIVE = 'live';

const PLAYER_COLORS = [
  '#e94560',
  '#4ecdc4',
  '#ffe66d',
  '#a855f7',
  '#ff9f43',
  '#53d769',
  '#5dade2',
  '#f472b6',
];

function liveCollection() {
  return collection(db, 'games', MULTIPLAYER_ROOM_ID, LIVE);
}

function liveDoc(playerId: string) {
  return doc(db, 'games', MULTIPLAYER_ROOM_ID, LIVE, playerId);
}

/** Warna konsisten per playerId (hash sederhana) */
export function getPlayerColor(playerId: string): string {
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) {
    hash = (hash + playerId.charCodeAt(i)) % PLAYER_COLORS.length;
  }
  return PLAYER_COLORS[hash];
}

function compressSegments(
  segments: { x: number; y: number }[],
): { x: number; y: number }[] {
  if (segments.length <= MAX_SYNC_SEGMENTS) {
    return segments.map((s) => ({ x: s.x, y: s.y }));
  }
  const step = Math.ceil(segments.length / MAX_SYNC_SEGMENTS);
  return segments
    .filter((_, i) => i % step === 0)
    .map((s) => ({ x: s.x, y: s.y }));
}

export async function joinMultiplayerRoom(
  playerId: string,
  displayName: string,
): Promise<void> {
  await setDoc(liveDoc(playerId), {
    displayName,
    score: 0,
    length: 10,
    angle: 0,
    segments: [],
    alive: true,
    color: getPlayerColor(playerId),
    updatedAt: serverTimestamp(),
  });
}

export async function leaveMultiplayerRoom(playerId: string): Promise<void> {
  try {
    await deleteDoc(liveDoc(playerId));
  } catch {
    // offline / sudah terhapus
  }
}

export async function setPlayerDead(playerId: string): Promise<void> {
  try {
    await setDoc(
      liveDoc(playerId),
      { alive: false, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch {
    // abaikan
  }
}

export async function syncPlayerState(
  playerId: string,
  displayName: string,
  state: GameState,
): Promise<void> {
  if (state.status !== 'playing') return;

  const payload: LivePlayerPayload & {
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    displayName,
    score: state.score,
    length: state.length,
    angle: state.angle,
    segments: compressSegments(state.snake),
    alive: true,
    color: getPlayerColor(playerId),
    updatedAt: serverTimestamp(),
  };

  await setDoc(liveDoc(playerId), payload, { merge: true });
}

function toRemotePlayer(id: string, data: Record<string, unknown>): RemotePlayer | null {
  const updatedAt = data.updatedAt as Timestamp | undefined;
  const updatedAtMs = updatedAt?.toMillis?.() ?? 0;
  if (Date.now() - updatedAtMs > PLAYER_STALE_MS) return null;

  const segments = (data.segments as { x: number; y: number }[]) ?? [];
  if (segments.length === 0) return null;

  return {
    id,
    displayName: (data.displayName as string) ?? 'Pemain',
    score: (data.score as number) ?? 0,
    length: (data.length as number) ?? 0,
    angle: (data.angle as number) ?? 0,
    segments,
    alive: data.alive !== false,
    color: (data.color as string) ?? '#888',
    updatedAtMs,
  };
}

/** Listener real-time — return function untuk unsubscribe */
export function subscribeLivePlayers(
  localPlayerId: string,
  onPlayers: (players: RemotePlayer[]) => void,
): () => void {
  return onSnapshot(liveCollection(), (snap) => {
    const players: RemotePlayer[] = [];
    snap.forEach((d) => {
      if (d.id === localPlayerId) return;
      const remote = toRemotePlayer(d.id, d.data());
      if (remote) players.push(remote);
    });
    onPlayers(players);
  });
}
