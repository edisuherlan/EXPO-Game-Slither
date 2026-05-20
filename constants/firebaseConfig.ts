/**
 * KONFIGURASI FIREBASE (Web SDK)
 * ------------------------------
 * Nilai ini dari Firebase Console → Project settings → Your apps.
 * Harus sama dengan google-services.json (Android native).
 *
 * Catatan keamanan untuk mahasiswa:
 *   apiKey di mobile/web BUKAN rahasia mutlak — dilindungi Firestore Rules.
 *   Jangan simpan service account / private key di app.
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyBaphJAet6oap_KeXHpd5o0vzTJTKleW6A',
  authDomain: 'gameslither-28be8.firebaseapp.com',
  projectId: 'gameslither-28be8',
  storageBucket: 'gameslither-28be8.firebasestorage.app',
  messagingSenderId: '919609837214',
  appId: '1:919609837214:android:c19b91fd61459303b69d8f',
};
