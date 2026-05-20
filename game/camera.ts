/**
 * KAMERA (World → Screen)
 * -----------------------
 * Dunia lebih besar dari layar HP. Kamera selalu memusatkan kepala ular
 * di tengah viewport sehingga pemain merasa "berjalan" di peta luas.
 *
 * Rumus layar: screenX = worldX - camera.x
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
import type { GameState, Vec2 } from './types';

export function getCamera(state: GameState): Vec2 {
  const head = state.snake[0];
  return {
    x: head.x - state.viewportWidth / 2,
    y: head.y - state.viewportHeight / 2,
  };
}

export function worldToScreen(world: Vec2, camera: Vec2): Vec2 {
  return {
    x: world.x - camera.x,
    y: world.y - camera.y,
  };
}
