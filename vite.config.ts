import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({ include: ['src'] }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Work1ChatWidget',
      formats: ['es', 'iife'],
      fileName: (format) => `work1-chat-widget.${format}.js`,
    },
  },
});
