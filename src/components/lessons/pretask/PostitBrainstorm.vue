<script setup>
/*
  Pre-task post-it brainstorm: a board of single-answer notes. The activity
  is complete once min-total notes have been filled in.

    <PostitBrainstorm id="brainstormActivity" :count="8" :min-total="4" />
*/
import InputResponse from '../../activities/InputResponse.vue'
import ResponseBox from '../../activities/ResponseBox.vue'

// Vite serves public assets from the site's base URL (also works under /prim7/).
const postitBackground = `${import.meta.env.BASE_URL}images/pretask/postitwall.jpg`

defineProps({
  count: { type: Number, default: 8 },
  minTotal: { type: Number, default: 4 },
  placeholder: { type: String, default: "Add an idea" },
})
</script>

<template>
  <InputResponse
    class="postit-brainstorm"
    :data-tr-min-total="minTotal"
    :style="{ backgroundImage: `url('${postitBackground}')` }"
  >
    <ResponseBox
      v-for="n in count"
      :key="n"
      class="postit-answer"
      :class="'postit-' + n"
      :group-key="String(n)"
      :max="1"
      :input-id="'brainstormInput' + n"
      :placeholder="placeholder"
      list-class="brainstorm-answer"
      :list-id="'brainstormAnswer' + n"
    />
  </InputResponse>
</template>

<style scoped>

.postit-brainstorm {
  position: relative;
  width: 100%;
  aspect-ratio: 1.5 / 1;

  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  border: 3px solid var(--line);
  border-radius: 22px;
  overflow: hidden;

  box-shadow: 0 6px 0 var(--line);
}

.postit-answer {
  position: absolute;
  width: 17.5%;
  height: 15%;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 8px;
}

.postit-answer :deep(input) {
  width: 100%;
  height: 100%;

  border: 2px solid rgba(48, 51, 47, 0.75);
  border-radius: 12px;

  background: rgba(255, 253, 244, 0.86);
  color: var(--text);

  padding: 8px 10px;

  box-shadow: 0 3px 0 rgba(48, 51, 47, 0.18);

  font-family: inherit;
  font-size: clamp(0.72rem, 1.3vw, 0.95rem);
  font-weight: 600;
  text-align: center;

  outline: none;
}

.postit-answer :deep(input:focus) {
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 0 0 3px rgba(0, 188, 116, 0.2);
}

.postit-answer :deep(.brainstorm-answer) {
  width: 100%;
  height: 100%;

  align-items: center;
  justify-content: center;
  gap: 8px;

  padding: 8px 10px;

  border: 2px solid var(--line);
  border-radius: 10px;
  background: rgba(255, 253, 244, 0.92);
  box-shadow: 0 3px 0 rgba(48, 51, 47, 0.22);

  color: var(--text);
  font-size: clamp(0.72rem, 1.3vw, 0.95rem);
  font-weight: 700;
  text-align: center;
  line-height: 1.25;
}

/* Positions over the notes in the background image: 2 rows x 4 columns */
.postit-1 {
  top: 25%;
  left: 10%;
}

.postit-2 {
  top: 25%;
  left: 31%;
}

.postit-3 {
  top: 25%;
  left: 52%;
}

.postit-4 {
  top: 25%;
  left: 74%;
}

.postit-5 {
  top: 57%;
  left: 10%;
}

.postit-6 {
  top: 57%;
  left: 31%;
}

.postit-7 {
  top: 57%;
  left: 52%;
}

.postit-8 {
  top: 57%;
  left: 74%;
}

@media (max-width: 800px) {
  .postit-answer {
    width: 20%;
    height: 20%;
  }
}
</style>
