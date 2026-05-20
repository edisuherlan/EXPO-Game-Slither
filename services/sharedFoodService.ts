/**
 * FIRESTORE: MAKANAN SHARED (Slither.io style)
 * --------------------------------------------
 * Koleksi `slither_foods` — setiap dokumen = satu titik makanan {x, y, roomId}.
 * Semua HP subscribe → daftar sama → siapa cepat deleteDoc dapat skor.
 *
 * ensureSharedFoodPool: seed batch jika dokumen terlalu sedikit
 * tryConsumeSharedFood: hapus saat dimakan
 * respawnSharedFood: tambah satu titik baru (dekat pemakan atau acak)
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

import { COLLECTIONS } from '../constants/firestoreCollections';
import { GAME } from '../constants/game';
import { computeFoodCount } from '../game/engine';
import type { Food } from '../game/types';
import { db } from '../lib/firebase';
import { MULTIPLAYER_ROOM_ID } from '../constants/multiplayer';

function foodsCollection() {
  return collection(db, COLLECTIONS.slitherFoods);
}

function metaDoc() {
  return doc(db, COLLECTIONS.slitherRoom, MULTIPLAYER_ROOM_ID);
}

function foodDoc(foodId: string) {
  return doc(db, COLLECTIONS.slitherFoods, foodId);
}

function distance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function randomFoodPosition(
  worldWidth: number,
  worldHeight: number,
  avoid: { x: number; y: number }[] = [],
  near?: { x: number; y: number },
  spreadW?: number,
  spreadH?: number,
): { x: number; y: number } {
  const pad = GAME.foodRadius + 8;
  const maxX = worldWidth - pad;
  const maxY = worldHeight - pad;
  const cx = near?.x ?? worldWidth / 2;
  const cy = near?.y ?? worldHeight / 2;
  const halfW = spreadW ?? worldWidth;
  const halfH = spreadH ?? worldHeight;

  for (let attempt = 0; attempt < 60; attempt++) {
    const pos = {
      x: Math.max(
        pad,
        Math.min(maxX, cx + (Math.random() * 2 - 1) * halfW),
      ),
      y: Math.max(
        pad,
        Math.min(maxY, cy + (Math.random() * 2 - 1) * halfH),
      ),
    };
    const tooClose = avoid.some(
      (s) => distance(s, pos) < GAME.headRadius + GAME.foodRadius + 10,
    );
    if (!tooClose) return pos;
  }

  return {
    x: pad + Math.random() * (maxX - pad),
    y: pad + Math.random() * (maxY - pad),
  };
}

const BATCH_CHUNK = 100;
const MAX_SEED_PER_RUN = 80;

function isPermissionError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes('permission') || m.includes('insufficient');
}

function foodsQuery() {
  return query(foodsCollection(), limit(500));
}

export async function ensureSharedFoodPool(
  worldWidth: number,
  worldHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const targetCount = Math.min(
      computeFoodCount(viewportWidth, viewportHeight),
      MAX_SEED_PER_RUN * 2,
    );
    const minCount = Math.max(20, Math.floor(targetCount * 0.5));

    const snap = await getDocs(foodsQuery());
    const current = snap.docs;

    if (current.length >= minCount) {
      await setDoc(
        metaDoc(),
        { foodsSeeded: true, worldWidth, worldHeight, targetCount, roomId: MULTIPLAYER_ROOM_ID },
        { merge: true },
      );
      return { ok: true };
    }

    const avoid: { x: number; y: number }[] = current.map((d) => {
      const data = d.data();
      return { x: data.x as number, y: data.y as number };
    });

    const center = { x: worldWidth / 2, y: worldHeight / 2 };
    const nearSpreadW = viewportWidth * 2;
    const nearSpreadH = viewportHeight * 2;
    const toAdd = Math.min(targetCount - current.length, MAX_SEED_PER_RUN);

    let added = 0;
    while (added < toAdd) {
      const chunkSize = Math.min(BATCH_CHUNK, toAdd - added);
      const batch = writeBatch(db);

      for (let i = 0; i < chunkSize; i++) {
        const idx = added + i;
        const placeNearSpawn = idx < toAdd * 0.45;
        const pos = placeNearSpawn
          ? randomFoodPosition(
              worldWidth,
              worldHeight,
              avoid,
              center,
              nearSpreadW,
              nearSpreadH,
            )
          : randomFoodPosition(worldWidth, worldHeight, avoid);
        avoid.push(pos);
        batch.set(doc(foodsCollection()), {
          x: pos.x,
          y: pos.y,
          roomId: MULTIPLAYER_ROOM_ID,
        });
      }

      await batch.commit();
      added += chunkSize;
    }

    await setDoc(
      metaDoc(),
      { foodsSeeded: true, worldWidth, worldHeight, targetCount, roomId: MULTIPLAYER_ROOM_ID },
      { merge: true },
    );
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return { ok: false, error: message };
  }
}

export function formatFoodFirestoreError(message: string): string {
  if (isPermissionError(message)) {
    return 'Publish Rules: slither_foods & slither_room (lihat firestore.rules)';
  }
  return 'Makanan shared belum tersedia — main dengan makanan lokal';
}

export function subscribeSharedFoods(
  onFoods: (foods: Food[]) => void,
  onError?: (message: string) => void,
): () => void {
  return onSnapshot(
    foodsQuery(),
    (snap) => {
      const foods: Food[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          x: data.x as number,
          y: data.y as number,
        };
      });
      onFoods(foods);
    },
    (err) => {
      onError?.(formatFoodFirestoreError(err.message));
    },
  );
}

export async function tryConsumeSharedFood(foodId: string): Promise<boolean> {
  try {
    await deleteDoc(foodDoc(foodId));
    return true;
  } catch {
    return false;
  }
}

export async function respawnSharedFood(
  worldWidth: number,
  worldHeight: number,
  near?: { x: number; y: number },
): Promise<void> {
  const pos = near
    ? randomFoodPosition(
        worldWidth,
        worldHeight,
        [],
        near,
        worldWidth * 0.4,
        worldHeight * 0.4,
      )
    : randomFoodPosition(worldWidth, worldHeight);
  await addDoc(foodsCollection(), {
    x: pos.x,
    y: pos.y,
    roomId: MULTIPLAYER_ROOM_ID,
  });
}
