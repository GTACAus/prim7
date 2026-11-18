<script setup>
/*
  MULTIPLE CHOICE
  One or more questions, each with its own choice buttons. Lay them out however
  the page likes - only the three components matter:

    <MultipleChoice completion-mode="live" v-slot="{ reset }">
      <McQuestion answer="basketballs" class="ball-pair-grid">
        <McChoice value="basketballs" v-slot="{ selected, correct }">
          <img ... />
          <span v-if="selected">{{ correct ? "Yes!" : "Try again" }}</span>
        </McChoice>
        <McChoice value="tennis">...</McChoice>
      </McQuestion>

      <Button @click="reset">Reset</Button>
    </MultipleChoice>

  A choice is right when its value matches its question's answer.

  Props
  - completionMode: "sticky" (default) - a question stays done once it has been
    answered right; "live" - only the latest pick counts, so a wrong pick
    after a right one un-completes it.
  - sequence: show one question at a time; a right answer moves to the next.
  - classes: rename the classes put on a picked choice - defaults
    { selected: "selected-answer", correct: "correct-answer",
      incorrect: "incorrect-answer" }.

  Slot props: MultipleChoice { reset, complete, solved (question key -> true
  once answered right), questions (every question's key) }, McQuestion { picked,
  answered, correct }, McChoice { selected, correct }.
  @answer gets { question, value, correct } on every pick.

  Complete once every question satisfies completionMode. The picks are saved
  through <Activity :state>. Give each McQuestion a `name` if questions can be
  added or removed; otherwise their order is used.
*/
import { computed, provide, reactive, ref } from "vue";
import Activity from "./Activity.vue";

const DEFAULT_CLASSES = {
  selected: "selected-answer",
  correct: "correct-answer",
  incorrect: "incorrect-answer",
};

const props = defineProps({
  tag: { type: String, default: "div" },
  completionMode: { type: String, default: "sticky" }, // sticky | live
  sequence: { type: Boolean, default: false },
  classes: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["answer"]);

// Saved progress: latest pick, and which questions have been answered right
const picked = ref({});
const solved = ref({});
const saved = { picked, solved }; // the refs themselves, so <Activity> can restore them

const questions = reactive([]);
let nextIndex = 0;

const classNames = computed(() => ({ ...DEFAULT_CLASSES, ...props.classes }));

const isDone = (q) =>
  props.completionMode === "live"
    ? picked.value[q.key] === q.answer
    : !!solved.value[q.key];

const isComplete = computed(
  () => questions.length > 0 && questions.every(isDone),
);

// sequence: the first question not yet answered right (none once all are)
const current = computed(() =>
  questions.find((q) => !solved.value[q.key]),
);

function select(question, value) {
  const correct = !question.answer || value === question.answer;
  picked.value = { ...picked.value, [question.key]: value };
  if (correct) solved.value = { ...solved.value, [question.key]: true };
  emit("answer", { question: question.key, value, correct });
}

function reset() {
  picked.value = {};
  solved.value = {};
}

provide("multipleChoice", {
  register(question) {
    question.key = question.name || "q" + nextIndex++;
    questions.push(question);
    return question.key;
  },
  unregister(question) {
    const i = questions.indexOf(question);
    if (i >= 0) questions.splice(i, 1);
  },
  picked,
  classNames,
  select,
  isVisible: (question) => !props.sequence || current.value === question,
});

defineExpose({ reset, isComplete, solved });
</script>

<template>
  <Activity
    :tag="tag"
    :complete="isComplete"
    :state="saved"
    @reset="reset"
  >
    <slot
      :reset="reset"
      :complete="isComplete"
      :solved="solved"
      :questions="questions.map((q) => q.key)"
    />
  </Activity>
</template>
