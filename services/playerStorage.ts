/**
 * PENYIMPANAN LOKAL (AsyncStorage)
 * --------------------------------
 * Data yang TIDAK perlu cloud tapi harus persist di HP:
 *   - playerId  → identitas unik untuk multiplayer & leaderboard
 *   - displayName → nama tampilan di menu
 *
 * AsyncStorage = key-value seperti localStorage di web, async.
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  playerId: '@slither/playerId',
  displayName: '@slither/displayName',
} as const;

function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export async function getOrCreatePlayerId(): Promise<string> {
  const existing = await AsyncStorage.getItem(KEYS.playerId);
  if (existing) return existing;
  const id = generatePlayerId();
  await AsyncStorage.setItem(KEYS.playerId, id);
  return id;
}

export async function getDisplayName(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.displayName)) ?? '';
}

export async function saveDisplayName(name: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.displayName, name.trim());
}
