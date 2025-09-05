import { createRouter, createWebHashHistory } from 'vue-router';
import AiPanel from './views/AiPanel.vue';
import AiView from './views/AiView.vue';
import TaskPanel from './views/TaskPanel.vue';
import TaskView from './views/TaskView.vue';
import HistoryView from './views/HistoryView.vue';
import UserView from './views/UserView.vue';

const router = createRouter({
  linkActiveClass: 'btn-active btn-accent',
  linkExactActiveClass: 'btn-active btn-info',
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/ai',
    },
    {
      path: '/ai',
      name: 'ai',
      component: AiView,
      meta: { transition: 'fade' },
      children: [{ path: ':configId?', name: 'ai.config', component: AiPanel }],
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: TaskView,
      meta: { transition: 'fade' },
      children: [
        { path: ':taskId?', name: 'tasks.detail', component: TaskPanel }, // for now, taskId === taskType
      ],
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView,
    },
    {
      path: '/user',
      name: 'user',
      component: UserView,
    },
  ],
});

export default router;
