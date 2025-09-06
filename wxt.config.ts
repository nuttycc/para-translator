import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  imports: false,
  srcDir: 'src',
  webExt: {
    disabled: true,
  },
  modules: ['@wxt-dev/module-vue', '@wxt-dev/auto-icons'],
  manifest: {
    permissions: ['storage'],
  },
  vite: () => ({
    plugins: [tailwindcss(), tsconfigPaths()],
  }),
});
