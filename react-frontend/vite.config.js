import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permet d'exposer le serveur en dehors du conteneur
    port: 3000, // Port interne du conteneur
    strictPort: true,
  },
})