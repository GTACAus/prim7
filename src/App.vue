<script setup>
import { useRoute } from "vue-router";
import PageHeader from "./components/layout/PageHeader.vue";
import LoadSpinner from "./components/ui/LoadSpinner.vue";
import { applyPage, pageLoading } from "./composables/usePageLoading.js";

const route = useRoute();
</script>

<template>
  <!-- while the next page's code downloads (first visit), over the current page -->
  <Transition name="page-spinner">
    <div v-if="pageLoading" class="page-spinner">
      <LoadSpinner label="Loading..." show-label />
    </div>
  </Transition>
  <PageHeader v-if="route.meta.header !== false" :save="route.meta.save" />
  <RouterView v-slot="{ Component, route }">
    <!-- the new page's data-page / theme are switched as it starts to enter,
         so the old page keeps its styles while it fades out -->
    <Transition name="page" mode="out-in" @before-enter="applyPage(route)">
      <div :key="route.path" class="page-transition">
        <component :is="Component" />
      </div>
    </Transition>
  </RouterView>
</template>

<style>
.page-enter-active {
  transition:
    transform 0.5s ease,
    opacity 0.5s ease;
}
.page-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}
.page-enter-from {
  opacity: 0;
  transform: scale(0.8);
}
.page-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* the spinner sits in the middle of the window, over the page it's leaving */
.page-spinner {
  position: fixed;
  inset: 0;
  z-index: 3000; /* above the page header (2000) */

  display: grid;
  place-items: center;

  background: color-mix(in srgb, var(--bg) 55%, transparent);
  pointer-events: none;
}

.page-spinner-enter-active,
.page-spinner-leave-active {
  transition: opacity 0.2s ease;
}
.page-spinner-enter-from,
.page-spinner-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: none;
  }
}
</style>
