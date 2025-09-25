<template>
  <div class='grid gap-2'>
    <code-mirror
      v-model="preferences.paraCardCSS"
      :lang="lang"
      :dark="dark"
      :extensions="extensions"
      class="css-editor"
    />
    <div class="justify-self-end">
      <div class="tooltip" data-tip="Reset the CSS to default">
      <button @click="resetCss" class="btn btn-soft">RESET</button>
    </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { oneDark } from '@codemirror/theme-one-dark';
// Import CodeMirror extensions
import { EditorView } from '@codemirror/view';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import CodeMirror from 'vue-codemirror6';

import { usePreferenceStore, defaultPreferences } from '@/stores/preference';

// Import CSS language support
import { css } from '@codemirror/lang-css';

const preferenceStore = usePreferenceStore();

const { preferences } = storeToRefs(preferenceStore);


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
      width: '33dvw',
      fontSize: '14px',
    },
  }),
  // Use dark theme when in dark mode
  ...(dark.value ? [oneDark] : []),
]);

function resetCss() {
  const confirmed = window.confirm('Are you sure you want to reset the CSS to default?');
  if (confirmed) {
    preferences.value.paraCardCSS = defaultPreferences.paraCardCSS;
  }
}
</script>
