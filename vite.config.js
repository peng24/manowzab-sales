import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/manowzab-sales/', // <--- เพิ่มบรรทัดนี้สำคัญมาก!
})