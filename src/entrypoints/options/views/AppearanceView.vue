<script setup lang="ts"></script>

<template>
  <div class="flex min-h-[66dvh]">
    <nav role="tablist" class="tabs *:tab flex-col gap-2">
      <RouterLink to="/appearance/custom-css" role="tab" class="btn btn-soft">Custom CSS</RouterLink>
      <RouterLink to="/appearance/2" role="tab" class="btn btn-soft">Tab 2</RouterLink>
      <RouterLink to="/appearance/3" role="tab" class="btn btn-soft">Tab 3</RouterLink>
    </nav>

    <div class="divider divider-horizontal"></div>

    <RouterView />
  </div>
</template>
