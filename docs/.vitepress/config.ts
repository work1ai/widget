import { defineConfig } from 'vitepress';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  title: 'Work1 Chat Widget',
  description: 'Embeddable AI chat widget documentation',
  base: '/widget/',

  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag === 'work1-chat-widget',
      },
    },
  },

  vite: {
    resolve: {
      alias: {
        '@work1ai/chat-widget': fileURLToPath(
          new URL('../../src/index.ts', import.meta.url),
        ),
      },
    },
  },

  themeConfig: {
    search: {
      provider: 'local',
    },

    nav: [
      { text: 'Guide', link: '/integration' },
      { text: 'API', link: '/api' },
    ],

    sidebar: [
      {
        text: 'Documentation',
        items: [
          { text: 'Integration Guide', link: '/integration' },
          { text: 'Theming', link: '/theming' },
          { text: 'API Reference', link: '/api' },
          { text: 'Events & Connection', link: '/events' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/work1ai/widget' },
    ],
  },
});
