import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({ include: ['src'] }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'work1-chat-widget.es.js',
    },
    rollupOptions: {
      external: [
        'lit',
        /^lit\//,
        'marked',
        'dompurify',
      ],
    },
    emptyOutDir: true,
  },
});
