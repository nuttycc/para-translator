import { createRouter, createWebHashHistory } from 'vue-router';

import AiView from '@/entrypoints/options/views/AiView.vue';
import HistoryView from '@/entrypoints/options/views/HistoryView.vue';
import TaskView from '@/entrypoints/options/views/TaskView.vue';
import AiConfig from '@/components/AiConfig.vue';
import TaskConfig from '@/components/TaskConfig.vue';
import PreferenceView from '@/entrypoints/options/views/PreferenceView.vue';
import CssEditor from '@/components/CssEditor.vue';
import PreferenceHome from '@/components/PreferenceHome.vue';

const router = createRouter({
  linkActiveClass: 'btn-active btn-accent',
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
      path: '/preference',
      name: 'preference',
      component: PreferenceView,
      redirect: { name: 'preference.home' },
      children: [
        { path: 'home', name: 'preference.home', component: PreferenceHome },
        { path: 'custom-css', name: 'preference.custom-css', component: CssEditor },
      ],
    },
  ],
});

export default router;
