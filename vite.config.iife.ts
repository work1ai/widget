import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Work1ChatWidget',
      formats: ['iife'],
      fileName: () => 'work1-chat-widget.iife.js',
    },
    emptyOutDir: false,
  },
});
