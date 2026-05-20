/**
 * FIRESTORE: SKOR & LEADERBOARD
 * -----------------------------
 * Dua koleksi terpisah:
 *   - scores      → riwayat setiap permainan (addDoc = banyak dokumen)
 *   - leaderboard → satu dokumen per playerId, hanya bestScore tertinggi
 *
 * Operasi Firebase yang dipakai:
 *   addDoc, setDoc (merge), getDoc, getDocs, query, orderBy, limit
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';

import { COLLECTIONS } from '../constants/firestoreCollections';
import { db } from '../lib/firebase';
import type { LeaderboardEntryDoc, ScoreDoc } from '../types/database';

export type LeaderboardRow = {
  id: string;
  displayName: string;
  bestScore: number;
  updatedAt: Timestamp | null;
};

export async function saveGameResult(
  playerId: string,
  displayName: string,
  score: number,
  length: number,
): Promise<void> {
  const scorePayload: Omit<ScoreDoc, 'playedAt'> & { playedAt: ReturnType<typeof serverTimestamp> } = {
    playerId,
    displayName,
    score,
    length,
    playedAt: serverTimestamp(),
  };

  await addDoc(collection(db, COLLECTIONS.scores), scorePayload);

  const entryRef = doc(db, COLLECTIONS.leaderboard, playerId);
  const existing = await getDoc(entryRef);
  const currentBest = existing.data()?.bestScore as number | undefined;

  if (!existing.exists() || score > (currentBest ?? 0)) {
    await setDoc(
      entryRef,
      {
        playerId,
        displayName,
        bestScore: score,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } else {
    await setDoc(entryRef, { displayName }, { merge: true });
  }
}

export async function fetchLeaderboard(top = 10): Promise<LeaderboardRow[]> {
  const q = query(
    collection(db, COLLECTIONS.leaderboard),
    orderBy('bestScore', 'desc'),
    limit(top),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as LeaderboardEntryDoc;
    return {
      id: d.id,
      displayName: data.displayName,
      bestScore: data.bestScore,
      updatedAt: data.updatedAt ?? null,
    };
  });
}
