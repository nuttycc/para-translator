import { createRouter,createMemoryHistory  } from 'vue-router';

import AiView from './pages/AiView.vue';
import TaskView from './pages/TaskView.vue';

const routes = [
  {
    path: '/',
    component: AiView,
    meta: { transition: 'fade' }
  },
  {
    path: '/tasks',
    component: TaskView,
    meta: { transition: 'fade' }
  },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

export default router;
