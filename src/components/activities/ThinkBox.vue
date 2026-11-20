<script setup>
/*
  Pre-task "See, Think, Wonder" box: one column per group, each with a prompt,
  an input and the list of answers.

    <ThinkBox id="watchStwActivity" :groups="[{ key, title, prompt, placeholder }]" />

  Built on <InputResponse>; every group needs at least one answer.
*/
import InputResponse from "./InputResponse.vue";
import ResponseBox from "./ResponseBox.vue";

defineProps({
  groups: { type: Array, required: true },
});
</script>

<template>
  <InputResponse class="think-box">
    <ResponseBox
      v-for="group in groups"
      :key="group.key"
      class="stw-column"
      :group-key="group.key"
      :min="1"
      :input-id="group.key + 'Input'"
      :placeholder="group.placeholder"
      row-class="stw-input-row"
      add-label="Add"
      list-tag="ul"
      list-class="stw-list"
      :list-id="group.key + 'List'"
    >
      <h3>{{ group.title }}</h3>
      <p>{{ group.prompt }}</p>
    </ResponseBox>
  </InputResponse>
</template>

<style>
/* Moved from pretask_styles/pretask.css. Not scoped: some rules style child components' content. */

.think-box {
  min-height: 500px;
  background: var(--soft-yellow);
  border: 3px solid var(--line);
  border-radius: 20px;
  padding: 0;
  color: var(--muted);
  overflow: hidden;
  box-shadow: 0 5px 0 var(--line);
}

.stw-column {
  padding: 17px;
  border-bottom: 2px dashed rgba(48, 51, 47, 0.32);
}

.stw-column:last-child {
  border-bottom: none;
}

.stw-column h3 {
  margin: 0 0 8px;
  color: var(--purple);
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
}

.stw-column p {
  margin: 0 0 10px;
  font-size: 0.85rem;
  color: var(--muted);
}

.stw-list {
  color: var(--text);
  font-size: 0.95rem;
  line-height: 1.5;
}
</style>
