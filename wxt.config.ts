import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  webExt:{
    disabled: true,
  },
  modules: ['@wxt-dev/module-vue'],
});
