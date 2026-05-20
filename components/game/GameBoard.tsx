/**
 * KOMPONEN GAME BOARD (Area Permainan)
 * ------------------------------------
 * Ini adalah "canvas" game berbasis View React Native (bukan Skia/Canvas API).
 * Setiap segmen ular & makanan = `View` absolut dengan posisi world → screen.
 *
 * Arsitektur frame:
 *   useGameLoop → tick(engine) → handleUpdate (makan, tabrakan) → setState → render
 *
 * Konsep kunci untuk mahasiswa:
 *   1. Koordinat dunia vs layar (kamera mengikuti kepala)
 *   2. requestAnimationFrame lewat hook useGameLoop
 *   3. PanResponder untuk steering (arah sentuh relatif kepala)
 *   4. Optimistic eat: skor naik dulu, hapus makanan Firestore belakangan
 *   5. pointerEvents="none" pada entity agar sentuhan tembus ke touchLayer
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { GAME } from '../../constants/game';
import { getCamera } from '../../game/camera';
import {
  applyEatBonus,
  createGameState,
  findFoodAtHead,
} from '../../game/engine';
import { checkRemoteBodyCollision } from '../../game/multiplayerCollision';
import { updateSnakeSegments } from '../../game/snakeBody';
import type { Food, GameInput, GameState } from '../../game/types';
import { useGameLoop } from '../../hooks/useGameLoop';
import type { RemotePlayer } from '../../types/multiplayer';

type WorldInfo = {
  worldWidth: number;
  worldHeight: number;
  viewportWidth: number;
  viewportHeight: number;
};

type Props = {
  onGameOver: (score: number, length: number) => void;
  onScoreChange?: (score: number) => void;
  remotePlayers?: RemotePlayer[];
  onStateSync?: (state: GameState) => void;
  sharedFoods?: Food[];
  onConsumeFood?: (
    foodId: string,
    headPos: { x: number; y: number },
  ) => Promise<boolean>;
  onWorldReady?: (world: WorldInfo) => void;
};

export function GameBoard({
  onGameOver,
  onScoreChange,
  remotePlayers = [],
  onStateSync,
  sharedFoods = [],
  onConsumeFood,
  onWorldReady,
}: Props) {
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [gameState, setGameState] = useState<GameState | null>(null);

  /** Input steering: disimpan di ref agar game loop baca tanpa re-render tiap sentuh */
  const inputRef = useRef<GameInput>({ targetAngle: 0, steering: false });
  const gameStateRef = useRef<GameState | null>(null);
  const reportedDeath = useRef(false);
  const layoutReady = useRef(false);

  /** Ref untuk data dari parent yang berubah tiap frame (hindari stale closure) */
  const remotePlayersRef = useRef(remotePlayers);
  remotePlayersRef.current = remotePlayers;
  const sharedFoodsRef = useRef(sharedFoods);
  sharedFoodsRef.current = sharedFoods;
  const consumingFoodIds = useRef(new Set<string>());

  /**
   * onLayout: dipanggil saat ukuran area game diketahui.
   * Dunia dibuat 5× lebih besar dari layar (lihat GAME.worldScale).
   */
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width < 50 || height < 50) return;
    if (layoutReady.current && gameStateRef.current?.status === 'playing') {
      return;
    }
    layoutReady.current = true;
    setBoardSize({ width, height });
    const initial = createGameState(width, height);
    gameStateRef.current = initial;
    setGameState(initial);
    reportedDeath.current = false;
    onWorldReady?.({
      worldWidth: initial.worldWidth,
      worldHeight: initial.worldHeight,
      viewportWidth: width,
      viewportHeight: height,
    });
  }, [onWorldReady]);

  /**
   * Dipanggil setiap frame oleh useGameLoop SETELAH physics tick.
   * Wajib mengembalikan state final — loop menyimpan return value ke stateRef.
   */
  const handleUpdate = useCallback(
    (next: GameState): GameState => {
      const prev = gameStateRef.current;
      let state: GameState = {
        ...next,
        score: prev?.score ?? next.score,
        length: prev?.length ?? next.length,
        speed: prev?.speed ?? next.speed,
        foods: sharedFoodsRef.current,
      };

      if (state.status === 'playing') {
        const foods = sharedFoodsRef.current;
        const head = state.snake[0];
        const hit =
          findFoodAtHead(head, foods) ||
          (prev ? findFoodAtHead(prev.snake[0], foods) : null);

        if (hit && !consumingFoodIds.current.has(hit.id)) {
          consumingFoodIds.current.add(hit.id);

          state = applyEatBonus(state);
          state = {
            ...state,
            snake: updateSnakeSegments(
              state.snake[0],
              state.snake,
              state.length,
            ),
            foods,
          };

          onConsumeFood?.(hit.id, state.snake[0]).finally(() => {
            consumingFoodIds.current.delete(hit.id);
          });
        }
      }

      if (
        state.status === 'playing' &&
        checkRemoteBodyCollision(state.snake[0], remotePlayersRef.current)
      ) {
        state = { ...state, status: 'dead' };
      }

      gameStateRef.current = state;
      setGameState(state);
      onScoreChange?.(state.score);
      onStateSync?.(state);

      if (state.status === 'dead' && !reportedDeath.current) {
        reportedDeath.current = true;
        onGameOver(state.score, state.length);
      }

      return state;
    },
    [onGameOver, onScoreChange, onStateSync, onConsumeFood],
  );

  useGameLoop({
    state: gameState ?? createGameState(300, 400),
    onUpdate: handleUpdate,
    inputRef,
    running: gameState?.status === 'playing',
  });

  /** Ubah posisi jari menjadi sudut arah (relatif kepala di layar) */
  const updateAngle = useCallback((touchX: number, touchY: number) => {
    const state = gameStateRef.current;
    if (!state || state.status !== 'playing') return;
    const camera = getCamera(state);
    const head = state.snake[0];
    const headScreenX = head.x - camera.x;
    const headScreenY = head.y - camera.y;
    inputRef.current.steering = true;
    inputRef.current.targetAngle = Math.atan2(
      touchY - headScreenY,
      touchX - headScreenX,
    );
  }, []);

  const stopSteering = useCallback(() => {
    inputRef.current.steering = false;
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (evt) =>
          updateAngle(evt.nativeEvent.locationX, evt.nativeEvent.locationY),
        onPanResponderMove: (evt) =>
          updateAngle(evt.nativeEvent.locationX, evt.nativeEvent.locationY),
        onPanResponderRelease: stopSteering,
        onPanResponderTerminate: stopSteering,
      }),
    [updateAngle, stopSteering],
  );

  if (!gameState) {
    return <View style={styles.board} onLayout={onLayout} />;
  }

  const camera = getCamera(gameState);
  const snakeSegments = gameState.snake;
  const margin = 80;

  /** Culling: hanya gambar makanan dekat viewport (hemat performa) */
  const visibleFoods = sharedFoods.filter((food) => {
    const sx = food.x - camera.x;
    const sy = food.y - camera.y;
    return (
      sx >= -margin &&
      sy >= -margin &&
      sx <= gameState.viewportWidth + margin &&
      sy <= gameState.viewportHeight + margin
    );
  });

  return (
    <View style={styles.board} onLayout={onLayout}>
      {/* Grid dekoratif — bergerak sedikit mengikuti kamera */}
      <View
        style={[
          styles.gridOverlay,
          {
            transform: [
              { translateX: -(camera.x % 40) },
              { translateY: -(camera.y % 40) },
            ],
          },
        ]}
        pointerEvents="none"
      >
        {Array.from({ length: 8 }).map((_, row) => (
          <View key={`r-${row}`} style={styles.gridRow}>
            {Array.from({ length: 6 }).map((__, col) => (
              <View key={`c-${col}`} style={styles.gridCell} />
            ))}
          </View>
        ))}
      </View>

      {visibleFoods.map((food) => (
        <View
          key={food.id}
          pointerEvents="none"
          style={[
            styles.food,
            {
              left: food.x - camera.x - GAME.foodRadius,
              top: food.y - camera.y - GAME.foodRadius,
              width: GAME.foodRadius * 2,
              height: GAME.foodRadius * 2,
              borderRadius: GAME.foodRadius,
            },
          ]}
        />
      ))}

      {remotePlayers.map((remote) =>
        remote.segments.map((seg, i) => {
          const r = i === 0 ? GAME.headRadius - 1 : GAME.headRadius - 3;
          return (
            <View
              key={`${remote.id}-seg-${i}`}
              pointerEvents="none"
              style={[
                styles.segment,
                {
                  left: seg.x - camera.x - r,
                  top: seg.y - camera.y - r,
                  width: r * 2,
                  height: r * 2,
                  borderRadius: r,
                  backgroundColor: i === 0 ? '#333' : remote.color,
                  borderColor: remote.color,
                  opacity: remote.alive ? 0.85 - i / (remote.segments.length + 6) : 0.35,
                  zIndex: 50 - i,
                },
              ]}
            />
          );
        }),
      )}

      {remotePlayers.map((remote) => (
        <Text
          key={`${remote.id}-name`}
          pointerEvents="none"
          style={[
            styles.remoteName,
            {
              left: remote.segments[0].x - camera.x - 40,
              top: remote.segments[0].y - camera.y - 36,
            },
          ]}
        >
          {remote.displayName}
        </Text>
      ))}

      {snakeSegments.map((seg, i) => {
        const r = i === 0 ? GAME.headRadius : GAME.headRadius - 2;
        const isHead = i === 0;
        return (
          <View
            key={`seg-${i}`}
            pointerEvents="none"
            style={[
              styles.segment,
              {
                left: seg.x - camera.x - r,
                top: seg.y - camera.y - r,
                width: r * 2,
                height: r * 2,
                borderRadius: r,
                backgroundColor: isHead
                  ? GAME.colors.snakeHead
                  : GAME.colors.snakeBody,
                borderColor: GAME.colors.snakeOutline,
                opacity: 1 - i / (snakeSegments.length + 4),
                zIndex: 200 + snakeSegments.length - i,
              },
            ]}
          />
        );
      })}

      {gameState.status === 'dead' && (
        <View style={styles.deadOverlay} pointerEvents="none">
          <Text style={styles.deadTitle}>Game Over</Text>
          <Text style={styles.deadScore}>Skor: {gameState.score}</Text>
        </View>
      )}

      {/* Lapisan sentuh di atas semua — satu-satunya yang menerima touch */}
      {gameState.status === 'playing' && (
        <View
          style={styles.touchLayer}
          {...panResponder.panHandlers}
          collapsable={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    flex: 1,
    backgroundColor: GAME.colors.background,
    overflow: 'hidden',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GAME.colors.grid,
  },
  food: {
    position: 'absolute',
    backgroundColor: GAME.colors.food,
  },
  segment: {
    position: 'absolute',
    borderWidth: 2,
  },
  touchLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  deadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deadTitle: {
    color: GAME.colors.danger,
    fontSize: 32,
    fontWeight: '800',
  },
  deadScore: {
    color: GAME.colors.hud,
    fontSize: 20,
    marginTop: 8,
  },
  remoteName: {
    position: 'absolute',
    width: 80,
    textAlign: 'center',
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    zIndex: 60,
  },
});
