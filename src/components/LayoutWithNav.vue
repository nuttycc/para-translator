<template>
  <div class="w-2xl grid grid-cols-[10rem_auto_4fr]">
    <nav class="navbar flex flex-col items-end gap-2 self-start">
      <slot name="nav"></slot>
    </nav>
    <div class="divider divider-horizontal min-h-[80dvh]"></div>
    <div class="flex-auto w-md">
      <slot name="content"></slot>
    </div>
  </div>
</template>
