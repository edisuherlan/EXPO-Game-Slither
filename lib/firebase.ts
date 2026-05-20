/**
 * INISIALISASI FIREBASE
 * ---------------------
 * Satu instance app + Firestore `db` dipakai semua service.
 *
 * experimentalForceLongPolling: membantu koneksi Firestore di beberapa
 * jaringan/ emulator Android yang bermasalah dengan WebChannel default.
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  Firestore,
  getFirestore,
  initializeFirestore,
} from 'firebase/firestore';

import { firebaseConfig } from '../constants/firebaseConfig';

const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth: Auth = getAuth(app);

let db: Firestore;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch {
  db = getFirestore(app);
}

export { app, auth, db };
