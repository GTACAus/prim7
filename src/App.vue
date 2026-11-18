<script setup>
import { useRoute } from "vue-router";
import PageHeader from "./components/PageHeader.vue";

const route = useRoute();
</script>

<template>
  <PageHeader v-if="route.meta.header !== false" :save="route.meta.save" />
  <RouterView />
</template>
