/**
 * CUSTOM HOOK: useMultiplayer
 * ---------------------------
 * Menghubungkan pemain lokal ke ruang Firestore `games/global/live`.
 *
 * Alur:
 *   mount  → join room + subscribe pemain lain
 *   frame  → syncFromGameState (throttle 200ms)
 *   mati   → notifyDeath (alive: false)
 *   unmount → hapus dokumen live (leave room)
 *
 * Real-time: `onSnapshot` — UI otomatis update saat data remote berubah.
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
import { useEffect, useRef, useState } from 'react';

import { SYNC_INTERVAL_MS } from '../constants/multiplayer';
import type { GameState } from '../game/types';
import {
  joinMultiplayerRoom,
  leaveMultiplayerRoom,
  setPlayerDead,
  subscribeLivePlayers,
  syncPlayerState,
} from '../services/multiplayerService';
import { getOrCreatePlayerId } from '../services/playerStorage';
import type { RemotePlayer } from '../types/multiplayer';

type UseMultiplayerOptions = {
  displayName: string;
  enabled: boolean;
};

export function useMultiplayer({
  displayName,
  enabled,
}: UseMultiplayerOptions) {
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayer[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const playerIdRef = useRef<string | null>(null);
  const lastSyncRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let unsubPlayers: (() => void) | undefined;
    let active = true;

    (async () => {
      const playerId = await getOrCreatePlayerId();
      if (!active) return;
      playerIdRef.current = playerId;
      await joinMultiplayerRoom(playerId, displayName);
      unsubPlayers = subscribeLivePlayers(playerId, (players) => {
        setRemotePlayers(players);
        setOnlineCount(players.length + 1);
      });
    })();

    return () => {
      active = false;
      unsubPlayers?.();
      const id = playerIdRef.current;
      if (id) leaveMultiplayerRoom(id);
    };
  }, [displayName, enabled]);

  const syncFromGameState = (state: GameState) => {
    const playerId = playerIdRef.current;
    if (!enabled || !playerId || state.status !== 'playing') return;

    const now = Date.now();
    if (now - lastSyncRef.current < SYNC_INTERVAL_MS) return;
    lastSyncRef.current = now;

    syncPlayerState(playerId, displayName, state).catch(() => {
      // gangguan jaringan — frame berikutnya akan coba lagi
    });
  };

  const notifyDeath = () => {
    const playerId = playerIdRef.current;
    if (!playerId) return;
    setPlayerDead(playerId).catch(() => undefined);
  };

  return {
    remotePlayers,
    onlineCount,
    syncFromGameState,
    notifyDeath,
  };
}
