<script setup lang="ts">



</script>

<template>
  <div class="flex min-h-[66dvh]">

    <nav role="tablist" class="tabs flex-col">
      <RouterLink to="/appearance/custom-css" role="tab" class="tab">Custom CSS</RouterLink>
      <RouterLink to="/appearance/tab-2" role="tab" class="tab">Tab 2</RouterLink>
      <RouterLink to="/appearance/tab-3" role="tab" class="tab">Tab 3</RouterLink>
    </nav>

    <div class="divider divider-horizontal"></div>

    <RouterView />
  </div>
</template>
