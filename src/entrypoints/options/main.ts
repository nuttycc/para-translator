import { createPinia } from 'pinia';
import { createApp } from 'vue';

import { useAiConfigsStore } from '@/stores/aiConfigs';
import { useTaskConfigsStore } from '@/stores/taskConfigs';
import { useHistoryStore } from '@/stores/history';

import App from './App.vue';
import router from './router';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

// Preload stores before mounting to ensure route decisions have data available
const initializeStores = async () => {
  const aiConfigsStore = useAiConfigsStore();
  const taskConfigsStore = useTaskConfigsStore();
  const historyStore = useHistoryStore();

  await Promise.all([aiConfigsStore.load(), taskConfigsStore.load(), historyStore.load()]);
};

initializeStores()
  .then(() => {
    app.mount('#app');
    return;
  })
  .catch((err) => {
    console.error('Failed to initialize stores:', err);
    app.mount('#app');
  });
