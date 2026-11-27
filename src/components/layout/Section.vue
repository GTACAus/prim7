<script setup>
import {
  computed,
  inject,
  onMounted,
  onUnmounted,
  provide,
  reactive,
  ref,
  watch,
} from "vue";
import Button from "@/components/ui/Button.vue";
import ContentBox from "@/components/ui/ContentBox.vue";

const props = defineProps({
  name: { type: String, default: "" },
  id: { type: String, default: "" },
  title: { type: String, default: "" },
  last: { type: Boolean, default: false },
  showCompleteNote: { type: Boolean, default: true },
});
const emit = defineEmits(["complete", "unlock", "restore"]);
const page = inject("lessonPage", null);
const legacySections = inject("pageSections", []);
const index = computed(() =>
  legacySections.findIndex(
    (s) => (s.key || s.name || s.id) === props.name || s.id === props.id,
  ),
);
const config = computed(() => legacySections[index.value] || {});
const sectionId = computed(() => props.id || config.value.id || props.name);
const sectionTitle = computed(() => props.title || config.value.title || "");
const sectionLast = computed(
  () =>
    props.last || config.value.last || page?.isLast(sectionId.value) || false,
);
const locked = computed(() =>
  page ? page.isLocked(sectionId.value) : props.locked,
);
const completed = computed(() =>
  page ? page.isCompleted(sectionId.value) : false,
);
const activities = reactive(new Set());
const element = ref(null);

// Saved state for this section: { activities: { [activityKey]: {...} } }.
// Restored from the page when the section is created.
const savedState = page?.restoreSection(sectionId.value);
const state = { activities: { ...savedState?.activities } };
if (savedState) emit("restore", savedState);

let activityCount = 0;

provide("section", {
  // Returns the activity's key and its saved data (if any) so it can restore.
  register(activity, name) {
    activities.add(activity);
    const key = name || `activity-${activityCount++}`;
    return { key, saved: state.activities[key] };
  },
  unregister(activity) {
    activities.delete(activity);
  },
  save(key, data) {
    state.activities[key] = data;
    page?.saveSection(sectionId.value, state);
  },
});

const complete = computed(() => {
  if (activities.size === 0) return true;

  return [...activities].every((activity) => activity.isComplete());
});

const showNext = computed(
  () =>
    !sectionLast.value && !locked.value && !completed.value && complete.value,
);

function reset() {
  state.activities = {};
  for (const a of activities) a.reset();
}
function next() {
  if (!showNext.value) return;
  page?.completeSection(sectionId.value);
}
// The last section has no Next button, so it counts as completed as soon as
// its activities are done. That is what marks the whole lesson complete.
// Checked after mount so the activities have registered and restored first.
function completeIfLast() {
  if (sectionLast.value && !locked.value && !completed.value && complete.value)
    page?.completeSection(sectionId.value);
}
onMounted(completeIfLast);
watch([complete, locked], completeIfLast);
function scrollTo() {
  // element is the <ContentBox> component, so scroll its root element
  element.value?.$el?.scrollIntoView({ behavior: "smooth", block: "start" });
}
page?.registerSection(sectionId.value, { reset, scrollTo });
onUnmounted(() => page?.unregisterSection(sectionId.value));
watch(complete, (value) => {
  if (value) emit("complete");
});
watch(locked, (value, previous) => {
  if (previous && !value) emit("unlock");
});
defineExpose({ locked, completed, complete, reset, next, scrollTo });
</script>

<template>
  <ContentBox
    ref="element"
    tag="section"
    class="section"
    :id="sectionId"
    :class="{ locked, completed }"
  >
    <h2 v-if="sectionTitle" class="section-title">
      <slot name="title">{{ sectionTitle }}</slot>
    </h2>
    <slot />
    <template v-if="!sectionLast">
      <Button v-if="showNext" class="next-button" @click="next">Next</Button>

      <p v-if="completed && showCompleteNote" class="completed-note">
        Completed — next activity unlocked.
      </p>
    </template>
  </ContentBox>
</template>

<style scoped>
/* ---------- Main lesson sections ---------- */
.section-title {
  display: inline-block;
  align-items: center;

  margin: -8px 0 22px;
  padding: 9px 18px;

  background: var(--yellow);
  color: var(--charcoal);

  border: 2px solid var(--charcoal);
  border-radius: 12px;

  box-shadow: 0 3px 0 var(--charcoal);

  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.035em;
  text-transform: uppercase;
}

.next-button {
  --padding: 12px 22px;
  --background: var(--orange);

  --background-hover: var(--purple);

  --background-active: var(--purple);
  --border-color-active: var(--charcoal);

  margin-top: 20px;
  width: fit-content;
  font-size: 0.95rem;
}

.next-button::after {
  content: "  →";
  display: inline-block;
  transition: transform 0.2s ease;
}

.next-button:hover::after {
  transform: translateX(4px);
}

/* ---------- Completion message ---------- */

.completed-note {
  display: none;

  width: fit-content;
  padding: 9px 13px;

  background: var(--soft-green);
  border: 2px solid var(--line);
  border-radius: 12px;

  color: var(--text);
  font-size: 0.85rem;
  font-weight: 700;
}

.section.completed .completed-note {
  display: block;
}

/* ---------- Smaller screens ---------- */
/* Tablet / mobile rules for this component go here, last in the block (see src/styles/base.css). */
@media (max-width: 800px) {
  .section {
    padding: 18px;
    border-radius: 20px;
  }
}
</style>
