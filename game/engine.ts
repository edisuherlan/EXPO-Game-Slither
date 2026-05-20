/**
 * GAME ENGINE (Logika Inti — Tanpa React)
 * ---------------------------------------
 * File ini berisi "physics" ular: gerak, makan, skor, tabrakan tubuh sendiri.
 * Dipanggil tiap frame oleh `useGameLoop` → fungsi `tick`.
 *
 * Pisahan engine vs UI adalah pola umum game dev:
 *   - engine.ts = murni fungsi + state
 *   - GameBoard.tsx = render + input + Firebase
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
import { GAME } from '../constants/game';
import { checkBodyCollision, updateSnakeSegments } from './snakeBody';
import type { Food, GameInput, GameState, Vec2 } from './types';

function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Normalisasi sudut ke rentang -π … π (radian) */
function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

/** Interpolasi sudut terpendek — ular belok halus ke arah sentuh */
function lerpAngle(current: number, target: number, t: number): number {
  let diff = normalizeAngle(target - current);
  if (diff > Math.PI) diff -= Math.PI * 2;
  return normalizeAngle(current + diff * t);
}

/** Jumlah makanan mengikuti luas dunia (bukan cuma area spawn). */
export function computeFoodCount(
  viewportWidth: number,
  viewportHeight: number,
): number {
  const scale = GAME.worldScale;
  const base = Math.max(viewportWidth, viewportHeight) / 280;
  return Math.round(GAME.foodPerViewport * scale * scale * Math.max(base, 1));
}

function randomId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Makanan lokal jika Firestore belum siap — supaya layar tidak kosong. */
export function createLocalFallbackFoods(
  worldWidth: number,
  worldHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): Food[] {
  const count = Math.min(computeFoodCount(viewportWidth, viewportHeight), 60);
  const cx = worldWidth / 2;
  const cy = worldHeight / 2;
  const foods: Food[] = [];
  const avoid: Vec2[] = [{ x: cx, y: cy }];

  for (let i = 0; i < count; i++) {
    const pad = GAME.foodRadius + 8;
    const spreadW = viewportWidth * 2.5;
    const spreadH = viewportHeight * 2.5;
    let placed = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      const pos = {
        x: Math.max(
          pad,
          Math.min(
            worldWidth - pad,
            cx + (Math.random() * 2 - 1) * spreadW,
          ),
        ),
        y: Math.max(
          pad,
          Math.min(
            worldHeight - pad,
            cy + (Math.random() * 2 - 1) * spreadH,
          ),
        ),
      };
      if (
        !avoid.some(
          (s) => distance(s, pos) < GAME.headRadius + GAME.foodRadius + 12,
        )
      ) {
        foods.push({ id: randomId(), ...pos });
        avoid.push(pos);
        placed = true;
        break;
      }
    }
    if (!placed) {
      foods.push({
        id: randomId(),
        x: cx + (Math.random() - 0.5) * spreadW,
        y: cy + (Math.random() - 0.5) * spreadH,
      });
    }
  }
  return foods;
}

/** Ular awal: segmen berjajar horizontal dari tengah dunia */
function createInitialSnake(worldWidth: number, worldHeight: number): Vec2[] {
  const cx = worldWidth / 2;
  const cy = worldHeight / 2;
  const points: Vec2[] = [];
  for (let i = 0; i < GAME.initialLength; i++) {
    points.push({
      x: cx - i * GAME.segmentSpacing,
      y: cy,
    });
  }
  return points;
}

export function createGameState(
  viewportWidth: number,
  viewportHeight: number,
): GameState {
  const worldWidth = viewportWidth * GAME.worldScale;
  const worldHeight = viewportHeight * GAME.worldScale;
  const snake = createInitialSnake(worldWidth, worldHeight);

  return {
    status: 'playing',
    snake,
    angle: 0,
    targetAngle: 0,
    foods: [],
    score: 0,
    length: GAME.initialLength,
    speed: GAME.baseSpeed,
    viewportWidth,
    viewportHeight,
    worldWidth,
    worldHeight,
  };
}

/** Deteksi tabrakan kepala dengan titik makanan (radius gabungan + toleransi) */
export function findFoodAtHead(head: Vec2, foods: Food[]): Food | null {
  const eatRadius = GAME.headRadius + GAME.foodRadius + 6;
  return (
    foods.find((f) => distance(head, f) < eatRadius) ?? null
  );
}

/** Bonus setelah makan: panjang, skor, kecepatan naik sedikit */
export function applyEatBonus(state: GameState): GameState {
  const newLength = state.length + GAME.growPerFood;
  const newScore = state.score + GAME.scorePerFood;
  const newSpeed = Math.min(
    GAME.baseSpeed + newScore * 0.15,
    GAME.baseSpeed * 2.2,
  );
  return {
    ...state,
    length: newLength,
    score: newScore,
    speed: newSpeed,
  };
}

/**
 * SATU FRAME physics:
 * 1. Hitung sudut baru (lerp ke target)
 * 2. Geser kepala dengan cos/sin × speed × dt
 * 3. Update rantai segmen tubuh
 * 4. Cek tabrakan tubuh sendiri
 */
export function tick(
  state: GameState,
  input: GameInput,
  dt: number,
): GameState {
  if (state.status !== 'playing') return state;

  const target = input.steering ? input.targetAngle : state.targetAngle;
  const turnRate = input.steering
    ? GAME.turnSpeedWhileSteering
    : GAME.turnSpeed;
  const angle = lerpAngle(
    state.angle,
    target,
    Math.min(1, turnRate * dt),
  );

  const head = state.snake[0];
  const newHead: Vec2 = {
    x: head.x + Math.cos(angle) * state.speed * dt,
    y: head.y + Math.sin(angle) * state.speed * dt,
  };

  let next: GameState = {
    ...state,
    angle,
    targetAngle: target,
  };

  const snake = updateSnakeSegments(newHead, state.snake, next.length);

  next = { ...next, snake };

  if (checkBodyCollision(snake)) {
    return { ...next, status: 'dead' };
  }

  return next;
}
