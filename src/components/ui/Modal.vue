<script setup>
import {
  computed,
  inject,
  onMounted,
  onUnmounted,
  ref,
  watch,
  nextTick,
} from "vue";

import { modal, openModal, closeModal } from "../../composables/useModal.js";
import Button from "./Button.vue";
import Media from "./Media.vue";

const props = defineProps({
  label: { type: String, default: "" },

  title: { type: String, default: "Modal" },

  glossary: { type: Object, default: null },

  pdfLabel: { type: String, default: "" },

  note: {
    type: String,

    default:
      "Teacher mode changes navigation only. Student answers are not deleted.",
  },
});

const page = inject("lessonPage", null);

const teacherSections = computed(() => page?.sections.value ?? []);

const overlay = ref(null);

const panel = ref(null);

const lastTrigger = ref(null);

let previousOverflow = "";

const isPDFImage = computed(() =>
  /\.(png|jpe?g|gif|webp|svg)(?:[?#].*)?$/i.test(modal.options.src || ""),
);

const isTeacher = computed(() => modal.type === "teacher");

const modalTitle = computed(() => {
  switch (modal.type) {
    case "teacher":
      return "Jump to an activity";
    case "glossary":
      return props.title;
    default:
      return modal.options.title;
  }
});

const modalLabel = computed(() => {
  switch (modal.type) {
    case "teacher":
      return "Teacher tools";
    case "glossary":
      return props.label;
    case "pdf":
      return props.pdfLabel;
    default:
      return "";
  }
});

function show(type, options = {}, trigger = null) {
  lastTrigger.value = trigger;

  openModal(type, options);
}

function close() {
  closeModal();
}

function grow() {
  const box = panel.value;

  if (!box) return;

  const trigger = lastTrigger.value;

  const origin = trigger?.isConnected ? trigger.getBoundingClientRect() : null;

  const rect = box.getBoundingClientRect();

  if (origin?.width && rect.width) {
    box.style.setProperty(
      "--origin-x",

      `${origin.left + origin.width / 2 - rect.left}px`,
    );

    box.style.setProperty(
      "--origin-y",

      `${origin.top + origin.height / 2 - rect.top}px`,
    );

    box.style.setProperty(
      "--start-scale",

      Math.max(0.08, Math.min(origin.width / rect.width, 0.9)),
    );
  } else {
    box.style.removeProperty("--origin-x");

    box.style.removeProperty("--origin-y");

    box.style.removeProperty("--start-scale");
  }

  box.classList.remove("modal-grow-in");

  void box.offsetWidth; // restart CSS animation; measurement only, not state

  box.classList.add("modal-grow-in");
}

watch(
  () => [modal.open, modal.type],

  async () => {
    if (modal.open && modal.type !== "glossary" && modal.type !== "teacher") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousOverflow;
    }

    if (modal.open) {
      await nextTick();

      grow();
    }
  },

  { flush: "post" },
);

function keydown(event) {
  if (event.key === "Escape" && modal.open) close();
}

onMounted(() => {
  previousOverflow = document.body.style.overflow;

  window.addEventListener("keydown", keydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", keydown);

  document.body.style.overflow = previousOverflow;

  close();
});

function jump(id) {
  page?.teacherJump(id);

  close();
}

function showAll() {
  page?.teacherShowAll();

  close();
}

function resetView() {
  page?.teacherResetView();

  close();
}

function goBack(href) {
  if (href) window.location.assign(href);
}

defineExpose({ open: show, close });
</script>

<template>
  <div
    v-if="modal.open"
    ref="overlay"
    class="modal"
    :class="`${modal.type}-modal`"
    role="dialog"
    aria-modal="true"
    :aria-label="modalTitle"
    @click.self="close"
  >
    <div
      ref="panel"
      class="modal-content"
      :class="`${modal.type}-modal-content`"
    >
      <!-- Shared header -->
      <div class="modal-header">
        <div>
          <p v-if="modalLabel" class="modal-label">
            {{ modalLabel }}
          </p>
          <h2>{{ modalTitle }}</h2>
        </div>

        <Button
          class="close-button"
          :aria-label="`Close ${modal.type}`"
          @click="close"
          >x</Button
        >
      </div>

      <!-- Teacher menu -->
      <template v-if="isTeacher">
        <div class="teacher-section-list">
          <Button
            v-for="(section, index) in teacherSections"
            class="teacher-select-button"
            :key="section.id"
            @click="jump(section.id)"
          >
            {{ index + 1 }}. {{ section.label }}
          </Button>
        </div>

        <div class="teacher-actions">
          <Button class="teacher-secondary-button" @click="showAll">
            Show all sections
          </Button>

          <Button class="teacher-secondary-button" @click="resetView">
            Reset student view
          </Button>
        </div>

        <p class="teacher-note">{{ note }}</p>
      </template>

      <!-- Glossary -->
      <div v-else-if="modal.type === 'glossary'" class="vocab-list">
        <div
          v-for="(description, word) in glossary"
          :key="word"
          class="vocab-card"
        >
          <h3>{{ word }}</h3>
          <p v-html="description"></p>
        </div>
      </div>

      <!-- Video -->
      <Media
        v-else-if="modal.type === 'video'"
        class="video-modal-player"
        :framed="false"
        :src="modal.options.src"
        :alt="modalTitle"
      />

      <!-- PDF -->
      <template v-else-if="modal.type === 'pdf'">
        <img
          v-if="isPDFImage"
          class="pdf-modal-image"
          :src="modal.options.src"
          :alt="modalTitle"
        />

        <iframe
          v-else
          class="pdf-modal-frame"
          title="Document preview"
          :src="`${modal.options.src}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=Fit`"
        ></iframe>

        <div class="pdf-modal-actions">
          <a class="general-button" :href="modal.options.src" download>
            Download PDF
          </a>
        </div>
      </template>

      <!-- Image -->
      <img
        v-else-if="modal.type === 'image'"
        class="image-zoom-modal-image"
        :src="modal.options.src"
        :alt="modal.options.alt || modalTitle"
      />
    </div>
  </div>
</template>

<style scoped>
/* Shared overlays and modal panels */
.modal {
  position: fixed;
  inset: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 24px;
  background: rgba(39, 42, 36, 0.4);

  z-index: 2000;
  overflow-y: auto;
}

.modal-content {
  width: min(720px, 100%);
  margin: 50px auto;

  background: var(--card);
  border: 3px solid var(--line);
  border-radius: 24px;
  box-shadow: 0 8px 0 var(--line);
  padding: 28px;
  max-height: 88vh;
  overflow-y: auto;
}

/* Shared headings and dismiss buttons */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.modal-header :deep(h2) {
  margin: 0;
  color: var(--text);
  font-size: 1.55rem;
  font-weight: 600;
}

.close-button {
  --radius: 40px;
  --display: flex;

  align-items: center;
  justify-content: center;

  --width: var(--radius);
  --height: var(--radius);

  --border-radius: 50%;
  --background: var(--soft-orange);
  --border: var(--border-medium);
  --box-shadow: none;
  --color: var(--text);
  --font-size: 1.4rem;

  --background-hover: var(--orange);
  --color-hover: var(--paper);
  --background-active: var(--orange);
}

.modal-label {
  margin: 0 0 5px;
  color: var(--accent-text);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Glossary cards and teacher navigation share the same card treatment */
.vocab-list,
.teacher-section-list {
  display: grid;
  gap: 14px;
}

.vocab-card,
.teacher-section-list :deep(button) {
  padding: 16px;
  background: var(--surface);
  border: 2px solid var(--line);
  border-radius: 14px;
  box-shadow: 0 3px 0 var(--shadow-soft);
}

.vocab-card :deep(h3) {
  margin: 0 0 6px;
  color: #3f463f;
  font-size: 1.05rem;
}

.vocab-card :deep(p) {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}

.vocab-card:nth-child(4n + 1) {
  border-left: 10px solid var(--yellow);
}
.vocab-card:nth-child(4n + 2) {
  border-left: 10px solid var(--orange);
}
.vocab-card:nth-child(4n + 3) {
  border-left: 10px solid var(--green);
}
.vocab-card:nth-child(4n + 4) {
  border-left: 10px solid var(--purple);
}

.teacher-section-list {
  gap: 10px;
}
.teacher-select-button {
  width: 100%;
  color: var(--text);
  text-align: left;
  font-size: 0.98rem;
  font-weight: 600;
  --box-shadow-hover: none;

}
.teacher-section-list :deep(button:hover) {
  background: var(--soft-yellow);
  transform: translateX(3px);
}

.teacher-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}
.teacher-secondary-button {
  padding: 11px 14px;
  background: var(--soft-purple);
  color: var(--text);
  border: 2px solid var(--line);
  border-radius: 12px;
  font-weight: 600;

  --background-hover: var(--soft-green);
}

.teacher-note {
  margin: 16px 0 0;
  color: var(--muted);
  font-size: 0.85rem;
  line-height: 1.5;
}

/* Media modals */
.video-modal-content,
.pdf-modal-content {
  width: min(900px, 100%);
}
.image-zoom-modal-content {
  width: min(760px, 100%);
}

.video-modal-player,
.pdf-modal-frame,
.pdf-modal-image,
.image-zoom-modal-image {
  display: block;
  background: #fff;
  border: 3px solid var(--line);
  border-radius: 16px;
}

.video-modal-player,
.pdf-modal-image,
.image-zoom-modal-image {
  width: 100%;
}
.video-modal-player {
  overflow: hidden;
  background: #101110;
}
.video-modal-player :deep(video) {
  max-height: 70vh;
}
.pdf-modal-image,
.image-zoom-modal-image {
  object-fit: contain;
}
.pdf-modal-image {
  max-height: 70vh;
}
.image-zoom-modal-image {
  max-height: 75vh;
}

.pdf-modal-frame {
  width: min(100%, 50vh);
  aspect-ratio: 1190 / 1684;
  margin: 0 auto;
}
.pdf-modal-actions {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

/* Modal grows from the trigger when one is supplied */
.modal-grow-in {
  transform-origin: var(--origin-x, 50%) var(--origin-y, 50%);
  animation: modal-grow 0.32s cubic-bezier(0.2, 0.8, 0.3, 1);
}
@keyframes modal-grow {
  from {
    transform: scale(var(--start-scale, 0.2));
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 600px) {
  .teacher-actions {
    grid-template-columns: 1fr;
  }
  .video-modal-content,
  .pdf-modal-content {
    margin: 20px auto;
    padding: 18px;
  }
  .pdf-modal-frame {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .modal-grow-in {
    animation: none;
  }
}
</style>
