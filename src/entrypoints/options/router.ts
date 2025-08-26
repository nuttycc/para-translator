import { createRouter, createWebHashHistory } from 'vue-router';
import AiView from './views/AiView.vue';
import TaskView from './views/TaskView.vue';
import AiHome from './views/AiHome.vue';
import AiPanel from './views/AiPanel.vue';
import TasksHome from './views/TasksHome.vue';
import TaskPanel from './views/TaskPanel.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: { name: 'ai.home' },
    },
    {
      path: '/ai',
      name: 'ai',
      component: AiView,
      meta: { transition: 'fade' },
      children: [
        { path: '', name: 'ai.home', component: AiHome },
        { path: ':configId', name: 'ai.config', component: AiPanel },
      ],
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: TaskView,
      meta: { transition: 'fade' },
      children: [
        { path: '', name: 'tasks.home', component: TasksHome },
        { path: ':taskId', name: 'tasks.detail', component: TaskPanel },
      ],
    },
  ],
});

export default router;
