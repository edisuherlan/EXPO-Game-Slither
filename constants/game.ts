/**
 * KONSTANTA GAME (Balance & Visual)
 * ---------------------------------
 * Semua angka gameplay di satu file agar mudah diubah untuk eksperimen lab:
 *   - Percepat ular? ubah baseSpeed
 *   - Dunia lebih luas? ubah worldScale
 *   - Lebih banyak makanan? ubah foodPerViewport
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
export const GAME = {
  initialLength: 10,
  segmentSpacing: 14,
  headRadius: 14,
  foodRadius: 8,
  /** Makanan per "layar" — dikalikan worldScale² untuk dunia luas */
  foodPerViewport: 3,
  baseSpeed: 140,
  turnSpeed: 14,
  turnSpeedWhileSteering: 22,
  growPerFood: 4,
  scorePerFood: 10,
  /** Dunia = viewport × worldScale (kamera ikut kepala) */
  worldScale: 5,
  worldPadding: 0,
  colors: {
    background: '#1a1a2e',
    grid: '#16213e',
    food: '#e94560',
    snakeHead: '#0f3460',
    snakeBody: '#53d769',
    snakeOutline: '#2ecc71',
    hud: '#eaeaea',
    danger: '#ff6b6b',
  },
} as const;
