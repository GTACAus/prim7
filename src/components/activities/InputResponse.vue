<script setup>
/*
  A set of answer groups ("type an answer, press Add / Enter, see it appear as a
  removable answer") that together make one activity: See / Think / Wonder
  columns, a sticky-note brainstorm, short written answers, numeric table cells.

    <InputResponse ref="results" data-tr-min-total="4" @change="...">
      <ResponseBox group-key="see" :min="1" ... />
      <ResponseBox group-key="think" :min="1" ... />
    </InputResponse>

  The groups are <ResponseBox>es (any depth inside the root); each one is a
  <StudentEntry>, which does the typing, the language filter and the delete
  buttons.

  Complete (for the section's Next button) when:
    - data-tr-min-total="N" on the root: N answers across every group, or
    - each group has its own min answers; if no group sets one the activity
      is always complete,
    - and every group with a right answer holds a correct answer.

  @change(answers) fires whenever answers change: { groupKey: [answers...] }.
  Exposes getAnswers(), getAnswer(key), reset(), isCorrect() and complete.
  The answers are saved through <Activity :state>.
*/
import { computed, onMounted, provide, reactive, ref, useAttrs, watch } from "vue";
import Activity from "./Activity.vue";

defineProps({
  tag: { type: String, default: "div" },
});

const emit = defineEmits(["change"]);

const attrs = useAttrs();
const groups = reactive([]);
let ready = false;

// Saved through <Activity :state> when inside a <Section>: { groupKey: [answers] }.
// The groups register after <Activity> restores, so the restore waits for mount.
const savedAnswers = ref({});
const saved = { answers: savedAnswers };
let pendingRestore = null;

provide("inputResponse", {
  register: (group) => groups.push(group),
  unregister: (group) => {
    const i = groups.indexOf(group);
    if (i >= 0) groups.splice(i, 1);
  },
});

function matches(group, answer) {
  if (!group.answer) return false;

  const isNumber = group.type === "number";

  return group.answer.split("|").some((accepted) => {
    accepted = accepted.trim();
    if (isNumber)
      return answer.trim() !== "" && Number(answer) === Number(accepted);
    return answer.trim().toLowerCase() === accepted.toLowerCase();
  });
}

const allCorrect = computed(() =>
  groups.every(
    (group) =>
      !group.answer ||
      (group.answers.length > 0 && matches(group, group.answers[0])),
  ),
);

const complete = computed(() => {
  const minTotal = parseInt(attrs["data-tr-min-total"] || "0", 10);
  let enough;

  if (minTotal > 0) {
    enough =
      groups.reduce((sum, group) => sum + group.answers.length, 0) >= minTotal;
  } else {
    const anyMinSet = groups.some((group) => group.min > 0);
    enough =
      !anyMinSet ||
      groups.every(
        (group) => group.min === 0 || group.answers.length >= group.min,
      );
  }

  return enough && allCorrect.value;
});

function getAnswers() {
  const result = {};
  groups.forEach((group) => {
    if (group.key) result[group.key] = [...group.answers];
  });
  return result;
}

function restore(answers) {
  answers = answers || {};
  groups.forEach((group) => {
    group.answers = [...((group.key && answers[group.key]) || [])];
  });
}

function reset() {
  groups.forEach((group) => group.clear());
}

// answers changed (typed, deleted, restored or reset)
watch(
  () => groups.map((group) => group.answers.join("\u0001")).join("\u0002"),
  () => {
    if (!ready) return;
    const answers = getAnswers();
    savedAnswers.value = answers;
    emit("change", answers);
  },
);

onMounted(() => {
  if (pendingRestore) restore(pendingRestore);
  ready = true;
});

defineExpose({
  getAnswers,
  getAnswer: (key) => getAnswers()[key]?.[0] ?? null,
  reset,
  isCorrect: () => allCorrect.value,
  complete,
});
</script>

<template>
  <Activity
    :tag="tag"
    :complete="complete"
    :state="saved"
    @restore="pendingRestore = $event.answers"
    @reset="reset"
  >
    <slot />
  </Activity>
</template>
