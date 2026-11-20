<script setup>
/*
  Pre-task closing brainstorm: a centre question with a branch for each
  physical condition, each collecting answers.

    <FinalBrainstorm id="finalBrainstormActivity" prompt="..." :branches="[{ key, title, placeholder }]" />
*/
import InputResponse from '../../activities/InputResponse.vue'
import ResponseBox from '../../activities/ResponseBox.vue'

defineProps({
  prompt: { type: String, required: true },
  branches: { type: Array, required: true },
})
</script>

<template>
  <InputResponse class="final-brainstorm-box">
    <div class="final-brainstorm-centre">{{ prompt }}</div>

    <ResponseBox
      v-for="branch in branches"
      :key="branch.key"
      class="final-branch"
      :group-key="branch.key"
      :input-id="'final-' + branch.key + '-input'"
      :placeholder="branch.placeholder"
      row-class="final-input-row"
      add-label="Add"
      list-tag="ul"
      list-class="final-answer-list"
      :list-id="'final-' + branch.key + '-list'"
    >
      <h3>{{ branch.title }}</h3>
    </ResponseBox>
  </InputResponse>
</template>

<style>
/* Moved from pretask_styles/pretask.css. Not scoped: some rules style child components' content. */

.final-brainstorm-box {
  background: var(--yellow);
  border: 3px solid var(--line);
  border-radius: 22px;
  padding: 24px;
  box-shadow: 0 6px 0 var(--line);

  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}

.final-brainstorm-centre {
  grid-column: 1 / -1;
  background: var(--purple);
  color: white;
  border: 3px solid var(--line);
  border-radius: 16px;
  padding: 18px 24px;
  box-shadow: 0 4px 0 var(--line);
  text-align: center;
  font-weight: 700;
}

.final-branch {
  width: 100%;
  background: var(--card);
  border: 3px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 4px 0 var(--line);
}

.final-branch h3 {
  margin: 0 0 12px;
  text-align: left;
  color: var(--purple);
  text-transform: uppercase;
}
</style>
