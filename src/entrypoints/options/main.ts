import { createPinia } from 'pinia';
import { createApp } from 'vue';

import { useAiProviderStore, useTaskSettingsStore } from '@/stores';

import App from './App.vue';
import router from './router';

const startTime = performance.now();

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

// Preload stores before mounting to ensure route decisions have data available
const initializeStores = async () => {
  const aiProviderStore = useAiProviderStore();
  const taskSettingsStore = useTaskSettingsStore();

  await Promise.all([aiProviderStore.load(), taskSettingsStore.load()]);
};

initializeStores()
  .then(() => {
    app.mount('#app');
    console.log(`App mounted in ${(performance.now() - startTime).toFixed(2)}ms`);
    return;
  })
  .catch((err) => {
    console.error('Failed to initialize stores:', err);
    app.mount('#app');
  });
