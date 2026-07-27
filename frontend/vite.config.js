import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 全てのネットワークインターフェース（公開アドレス・LANアドレス等）からのアクセスを許可
    port: 5173,
    strictPort: true,
  }
})
