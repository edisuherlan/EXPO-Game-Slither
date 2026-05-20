/**
 * TABRAKAN MULTIPLAYER
 * --------------------
 * Kepala ular kita tidak boleh menabrak tubuh pemain lain (segmen index ≥ 2).
 * Mirip aturan Slither.io: tabrakan ke kepala lawan tidak dihitung di sini.
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
import { GAME } from '../constants/game';
import type { Vec2 } from './types';
import type { RemotePlayer } from '../types/multiplayer';

function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function checkRemoteBodyCollision(
  head: Vec2,
  remotePlayers: RemotePlayer[],
): boolean {
  const hitDist = GAME.headRadius * 0.85;

  for (const remote of remotePlayers) {
    if (!remote.alive || remote.segments.length < 2) continue;

    for (let i = 2; i < remote.segments.length; i++) {
      if (distance(head, remote.segments[i]) < hitDist) return true;
    }
  }

  return false;
}
