/**
 * SNAKE BODY (Rantai Segmen Ular)
 * -------------------------------
 * Slither.io tidak menyimpan "grid" — setiap segmen mengikuti segmen di depannya
 * dengan jarak tetap (GAME.segmentSpacing).
 *
 * checkBodyCollision: tabrakan kepala ke tubuh sendiri dengan aturan longgar
 * (skip segmen dekat kepala) agar ular pendek tidak langsung mati.
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
import { GAME } from '../constants/game';
import type { Vec2 } from './types';

function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Setelah kepala pindah, setiap segmen i mengejar segmen i-1.
 * `segmentCount` dari state.length — bertambah saat makan.
 */
export function updateSnakeSegments(
  newHead: Vec2,
  prevSegments: Vec2[],
  segmentCount: number,
): Vec2[] {
  if (segmentCount <= 0) return [newHead];

  const segments: Vec2[] = [newHead];

  for (let i = 1; i < segmentCount; i++) {
    const prevSeg = prevSegments[i] ?? prevSegments[prevSegments.length - 1] ?? newHead;
    segments.push({ ...prevSeg });
  }

  const spacing = GAME.segmentSpacing;
  for (let i = 1; i < segments.length; i++) {
    const leader = segments[i - 1];
    const curr = segments[i];
    const dx = curr.x - leader.x;
    const dy = curr.y - leader.y;
    const dist = distance(leader, curr);
    if (dist < 0.001) {
      segments[i] = { x: leader.x - spacing, y: leader.y };
      continue;
    }
    const ratio = Math.min(spacing / dist, 1);
    segments[i] = {
      x: leader.x + dx * ratio,
      y: leader.y + dy * ratio,
    };
  }

  return segments;
}

export function checkBodyCollision(segments: Vec2[]): boolean {
  if (segments.length < 12) return false;
  const head = segments[0];
  const hitDist = GAME.headRadius * 0.4;
  const skipUntil = Math.max(8, Math.floor(segments.length * 0.4));
  for (let i = skipUntil; i < segments.length; i++) {
    if (distance(head, segments[i]) < hitDist) return true;
  }
  return false;
}
