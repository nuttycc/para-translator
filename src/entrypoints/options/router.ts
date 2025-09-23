import { createRouter, createWebHashHistory } from 'vue-router';

import AiView from '@/entrypoints/options/views/AiView.vue';
import HistoryView from '@/entrypoints/options/views/HistoryView.vue';
import TaskView from '@/entrypoints/options/views/TaskView.vue';
import AiConfig from '@/components/AiConfig.vue';
import TaskConfig from '@/components/TaskConfig.vue';
import AppearanceView from '@/entrypoints/options/views/AppearanceView.vue';
import CssEditor from '@/components/CssEditor.vue';

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
      children: [{ path: ':configId?', name: 'ai.config', component: AiConfig }],
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: TaskView,
      meta: { transition: 'fade' },
      children: [
        { path: ':taskId?', name: 'tasks.detail', component: TaskConfig }, // for now, taskId === taskType
      ],
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView,
    },
    {
      path: '/appearance',
      name: 'appearance',
      component: AppearanceView,
      children: [
        { path: '', redirect: { name: 'appearance.custom-css' } },
        { path: 'custom-css', name: 'appearance.custom-css', component: CssEditor },
      ],
    },
  ],
});

export default router;
