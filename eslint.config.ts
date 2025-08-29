import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  // Global parserOptions to ensure tsconfig is resolved relative to this file
  { languageOptions: { parserOptions: { tsconfigRootDir: __dirname } } },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.browser },
  },
  tseslint.configs.recommended,
  pluginVue.configs['flat/essential'],
  // Ensure parser resolves tsconfig relative to this config file
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser, tsconfigRootDir: __dirname } },
  },

  // no-unused-vars -> warning
  { rules: { 'no-unused-vars': 'warn' } },
]);
