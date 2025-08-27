import '@/assets/base.css';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { useAiConfigsStore } from '@/stores/aiConfigs';
import { useTaskConfigsStore } from '@/stores/taskConfigs';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

// Preload stores before mounting to ensure route decisions have data available
const initializeStores = async () => {
  const aiConfigsStore = useAiConfigsStore();
  const taskConfigsStore = useTaskConfigsStore();

  await Promise.all([
    aiConfigsStore.load(),
    taskConfigsStore.load()
  ]);
};

// Initialize stores and then mount the app
initializeStores().then(() => {
  app.mount('#app');
}).catch((err) => {
  console.error('Failed to initialize stores:', err);
  // Still mount the app even if store initialization fails
  app.mount('#app');
});

