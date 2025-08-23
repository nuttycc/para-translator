import { defineConfig } from 'wxt';
import { fileURLToPath } from 'node:url';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  webExt:{
    disabled: true,
  },
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    permissions: ['storage'],
  },
  vite: () => ({
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }),
});
