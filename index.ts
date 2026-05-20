/**
 * ENTRY POINT APLIKASI EXPO
 * -------------------------
 * File ini adalah titik masuk pertama saat app dijalankan.
 * `registerRootComponent` mendaftarkan komponen `App` ke React Native
 * sehingga bisa ditampilkan baik di Expo Go maupun APK native.
 *
 * Alur belajar: index.ts → App.tsx → screens/*
 *
 * ─────────────────────────────────────────
 * Dibuat oleh Edi Suherlan · https://github.com/edisuherlan
 */
import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);
