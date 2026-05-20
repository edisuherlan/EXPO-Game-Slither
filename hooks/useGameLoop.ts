/**
 * CUSTOM HOOK: useGameLoop
 * ------------------------
 * Menjalankan game loop dengan `requestAnimationFrame` (~60 FPS).
 *
 * Mengapa hook terpisah?
 *   - Memisahkan "waktu & physics" dari "UI React"
 *   - Mahasiswa bisa memahami pola: update ref → callback → render
 *
 * Penting: `onUpdate` harus RETURN state terbaru. Loop menyimpan hasil
 * ke `stateRef` — jika tidak, skor/panjang ular bisa "reset" tiap frame.
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
import { useEffect, useRef, type MutableRefObject } from 'react';

import { tick } from '../game/engine';
import type { GameInput, GameState } from '../game/types';

type UseGameLoopOptions = {
  state: GameState;
  onUpdate: (next: GameState) => GameState;
  inputRef: MutableRefObject<GameInput>;
  running: boolean;
};

export function useGameLoop({
  state,
  onUpdate,
  inputRef,
  running,
}: UseGameLoopOptions): void {
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!running || state.status !== 'playing') return;

    let frameId = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const current = stateRef.current;
      if (current.status !== 'playing') return;

      const next = tick(current, inputRef.current, dt);
      const processed = onUpdate(next);
      stateRef.current = processed;

      if (processed.status === 'playing') {
        frameId = requestAnimationFrame(loop);
      }
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [running, state.status, onUpdate, inputRef]);
}
