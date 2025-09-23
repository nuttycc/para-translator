<template>
  <div>
    <code-mirror
      v-model="paraCardCSS"
      :lang="lang"
      :dark="dark"
      :extensions="extensions"
      class="css-editor"
    />
  </div>
</template>

<script setup lang="ts">
import { oneDark } from '@codemirror/theme-one-dark';
// Import CodeMirror extensions
import { EditorView } from '@codemirror/view';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import CodeMirror from 'vue-codemirror6';

import { useAppearanceStore } from '@/stores/appearance';

// Import CSS language support
import { css } from '@codemirror/lang-css';

const appearanceStore = useAppearanceStore();

appearanceStore.init().then(() => {
  console.log('Appearance store initialized');
  return;
});

const { paraCardCSS } = storeToRefs(appearanceStore);

// Dark mode detection
const dark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);

// CSS language configuration
const lang = css();

// CodeMirror extensions
const extensions = computed(() => [
  EditorView.lineWrapping,
  EditorView.theme({
    '&': {
      height: '400px',
      fontSize: '14px',
    },
    '.cm-focused': {
      outline: 'none',
    },
  }),
  // Use dark theme when in dark mode
  ...(dark.value ? [oneDark] : []),
]);
</script>

<style scoped>
.css-editor {
  border: 1px solid hsl(var(--b3));
  border-radius: 0.5rem;
  overflow: hidden;
}
</style>
