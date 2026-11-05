import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [react(), tailwindcss()], server:{proxy:{'/api/booking':'http://127.0.0.1:3221','/api/platform/company':'http://127.0.0.1:3223'}} });
