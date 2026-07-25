import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project Pages URL: https://<user>.github.io/pipelines/
// Change to '/' if the repo is <user>.github.io
export default defineConfig({
  plugins: [react()],
  base: '/pipelines/',
})
