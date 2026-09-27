import { defineConfig } from 'vite';

export default defineConfig({
  // host: true exposes the dev server on the local network so phones on the same Wi-Fi can open it
  server: { port: 5173, host: true },
});
