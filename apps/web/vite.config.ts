import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Syncs perfectly with your backend's CORS setting
    host: true  // Allows testing connections over local network paths
  }
});