/**
 * CUSTOM HOOK: useSharedFoods
 * ---------------------------
 * Mengelola makanan yang SAMA untuk semua pemain (koleksi `slither_foods`).
 *
 * Dua mode:
 *   1. Firestore aktif → subscribe real-time, seed jika kurang
 *   2. Fallback lokal → jika rules/koneksi gagal, makanan dibuat di HP saja
 *
 * Saat makan: `consumeFood` hapus dokumen + respawn satu titik baru.
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Food } from '../game/types';
import { createLocalFallbackFoods } from '../game/engine';
import {
  ensureSharedFoodPool,
  formatFoodFirestoreError,
  respawnSharedFood,
  subscribeSharedFoods,
  tryConsumeSharedFood,
} from '../services/sharedFoodService';

type WorldSize = {
  worldWidth: number;
  worldHeight: number;
  viewportWidth: number;
  viewportHeight: number;
};

export function useSharedFoods(world: WorldSize | null, enabled: boolean) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [fallbackFoods, setFallbackFoods] = useState<Food[]>([]);
  const [foodHint, setFoodHint] = useState<string | null>(null);
  const worldRef = useRef(world);
  worldRef.current = world;

  useEffect(() => {
    if (!enabled || !world) return;

    let unsub = () => {};
    let active = true;

    setFallbackFoods(
      createLocalFallbackFoods(
        world.worldWidth,
        world.worldHeight,
        world.viewportWidth,
        world.viewportHeight,
      ),
    );
    setFoodHint(null);

    unsub = subscribeSharedFoods(
      (next) => {
        if (!active) return;
        setFoods(next);
        if (next.length > 0) {
          setFallbackFoods([]);
          setFoodHint(null);
        }
      },
      (msg) => {
        if (!active) return;
        setFoodHint(msg);
      },
    );

    ensureSharedFoodPool(
      world.worldWidth,
      world.worldHeight,
      world.viewportWidth,
      world.viewportHeight,
    ).then((result) => {
      if (!active || result.ok) return;
      setFoodHint(formatFoodFirestoreError(result.error ?? ''));
    });

    return () => {
      active = false;
      unsub();
    };
  }, [
    enabled,
    world?.worldWidth,
    world?.worldHeight,
    world?.viewportWidth,
    world?.viewportHeight,
  ]);

  const displayFoods = foods.length > 0 ? foods : fallbackFoods;

  const consumeFood = useCallback(
    async (foodId: string, headPos?: { x: number; y: number }): Promise<boolean> => {
      if (foods.length === 0) {
        setFallbackFoods((prev) => prev.filter((f) => f.id !== foodId));
        return true;
      }

      const deleted = await tryConsumeSharedFood(foodId);
      if (deleted && worldRef.current) {
        await respawnSharedFood(
          worldRef.current.worldWidth,
          worldRef.current.worldHeight,
          headPos,
        ).catch(() => undefined);
      }
      return true;
    },
    [foods.length],
  );

  return {
    foods: displayFoods,
    consumeFood,
    foodHint,
    usingFallback: foods.length === 0,
  };
}
