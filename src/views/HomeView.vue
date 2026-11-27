<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import Card from "@/components/homepage/Card.vue";
import Button from "@/components/ui/Button.vue";
import { useHomeStore } from "@/stores/home.js";
import lesson1CardImg from "@/assets/homepage/lesson1.png";
import lesson2CardImg from "@/assets/homepage/lesson2.png";
import lesson3CardImg from "@/assets/homepage/lesson3.png";
import lesson4CardImg from "@/assets/homepage/lesson4.png";
import titleImg from "@/assets/homepage/title.png";
import titleResponsiveImg from "@/assets/homepage/title-responsive.png";

const lessons = [
  {
    to: "/lesson1",
    img: lesson1CardImg,
    accent: "var(--purple)",
    subtitle: "Asking Scientific Questions & Making Predictions",
    description:
      "Use what you know about the world to ask questions and make predictions.",
    experiment: "Toy Cars Rolling Down Ramps",
  },
  {
    to: "/lesson2",
    img: lesson2CardImg,
    accent: "var(--orange)",
    subtitle: "Planning a Fair Test",
    description: "Learn how to plan a fair test and represent it as a diagram.",
    experiment: "Ball Bounce Test",
  },
  {
    to: "/lesson3",
    img: lesson3CardImg,
    accent: "var(--green)",
    subtitle: "Organising Fair Test Data into a Table",
    description:
      "Collect data from a fair test and learn how to organize it into a table.",
    experiment: "Is Yeast Alive?",
  },
  {
    to: "/lesson4",
    img: lesson3CardImg,
    accent: "var(--purple)",
    subtitle: "Science Inquiry Lab - Skills Check!",
    description: "Apply what you have learned in lessons 1,2 and 3.",
    experiment: "Ball Bounce Test Continued",
  },
  {
    to: "/lesson5",
    img: lesson4CardImg,
    accent: "var(--blue)",
    subtitle: "Using Bar Graphs to Visualise Data",
    description:
      "Learn how to convert data into a bar graph to help analyse results.",
    experiment: "Leadbeaters Possum Conservation",
  },
  {
    to: "/lesson6",
    img: lesson4CardImg,
    accent: "var(--blue)",
    subtitle: "Using Line Graphs to Visualise Data",
    description:
      "Learn how to convert data into a line graph to help analyse results.",
    experiment: "What lives in the intertidal zone?",
  },
  {
    to: "/lesson7",
    img: lesson4CardImg,
    accent: "var(--green)",
    subtitle: "Drawing Scientific Diagrams",
    description:
      "Learn how to represent experiments as a diagram and observations as scientific drawings.",
    experiment: "Deep Sea Exploration + Rust experiment",
  },
  {
    to: "/lesson8",
    img: lesson4CardImg,
    accent: "var(--green)",
    subtitle: "Communicating Science",
    description:
      "Learn how to report on a fair test using a scientific poster or scientific report.",
    experiment: "Reaction Time Experiment",
  },
];

const home = useHomeStore();

// Lessons up to availableLesson are unlocked.
// Click the title 5 times to unlock everything (and show the grid).
const availableLesson = 7;

function isLessonComplete(lessonNumber) {
  return home.completeLessons.includes(`lesson${lessonNumber}`);
}

// ─────────────────────────────────────────────
// Carousel state
// ─────────────────────────────────────────────
const lastIndex = lessons.length - 1;
const currentIndex = computed(() =>
  Math.max(0, Math.min(home.currentLesson, lastIndex)),
);
const status = computed(() => String(currentIndex.value + 1).padStart(2, "0"));
const total = String(lessons.length).padStart(2, "0");

const showAll = ref(false);
const track = ref(null);

function isLocked(number) {
  return !showAll.value && number > availableLesson;
}

// The current lesson lives in the home store, which saves itself.
function showLesson(index) {
  home.currentLesson = Math.max(0, Math.min(index, lastIndex));
}

// Clicking a side or locked card selects it instead of opening it.
function onCardSelect(index, event) {
  if (showAll.value) return;
  if (index !== currentIndex.value || isLocked(index + 1)) {
    event.preventDefault();
    showLesson(index);
  }
}

// Click the title 5 times to switch between carousel and grid.
let heroClicks = 0;
function onHeroClick() {
  heroClicks++;
  if (heroClicks < 5) return;
  heroClicks = 0;
  showAll.value = !showAll.value;
}

// ─────────────────────────────────────────────
// Swipe (touch) handling
// ─────────────────────────────────────────────
const SWIPE_THRESHOLD = 100;

let swipeStart = null;
let swipeClickCard = null;
let swipeClickTimeout = 0;

// null when not swiping; otherwise how far the carousel is dragged
// (shift, in cards) and how far apart neighbouring cards sit (distance, px).
const swipe = ref(null);
const isSwiping = computed(() => swipe.value !== null);

function updateSwipePreview(deltaX) {
  const trackWidth = track.value.clientWidth;
  const swipeDirection = deltaX < 0 ? 1 : -1;
  let progress = Math.min(Math.abs(deltaX) / (trackWidth * 0.55), 1);

  if (
    (currentIndex.value === 0 && swipeDirection < 0) ||
    (currentIndex.value === lastIndex && swipeDirection > 0)
  ) {
    progress *= 0.18;
  }

  swipe.value = {
    shift: swipeDirection * progress,
    distance:
      window.innerWidth <= 600
        ? trackWidth * 0.3
        : Math.min(window.innerWidth * 0.4, 460),
  };
}

function clearSwipePreview() {
  swipe.value = null;
}

// CSS variables for a card while it is being dragged (read by .is-swiping in CSS).
function swipeStyle(index) {
  if (!swipe.value) return undefined;

  const offset = index - currentIndex.value - swipe.value.shift;
  const distance = Math.abs(offset);
  const visibleOffset = Math.min(distance, 1);
  const clamped = Math.max(-1, Math.min(1, offset));
  const opacity =
    distance <= 1
      ? 1 - visibleOffset * 0.38
      : Math.max(0, 0.62 * (1 - (distance - 1) / 0.6));

  return {
    "--swipe-x": `${clamped * swipe.value.distance}px`,
    "--swipe-opacity": String(opacity),
    "--swipe-scale": String(1 - visibleOffset * 0.18),
    "--swipe-rotate": `${clamped * 30}deg`,
    "--swipe-z": String(Math.max(0, 2 - Math.round(distance))),
  };
}

function onCarouselTrackPointerDown(event) {
  if (event.pointerType !== "touch" || !event.isPrimary) return;

  const target = event.target;
  swipeStart = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    card: target instanceof Element ? target.closest(".lesson-card") : null,
  };
}

function onCarouselTrackPointerMove(event) {
  if (!swipeStart || event.pointerId !== swipeStart.pointerId) return;

  const deltaX = event.clientX - swipeStart.x;
  const deltaY = event.clientY - swipeStart.y;

  if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
    updateSwipePreview(deltaX);
  } else if (Math.abs(deltaY) > 8) {
    clearSwipePreview();
  }
}

function onCarouselTrackPointerUp(event) {
  if (!swipeStart || event.pointerId !== swipeStart.pointerId) return;

  const deltaX = event.clientX - swipeStart.x;
  const deltaY = event.clientY - swipeStart.y;
  const swipedCard = swipeStart.card;
  swipeStart = null;

  const isSwipe =
    Math.abs(deltaX) >= SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY);

  if (isSwipe) showLesson(currentIndex.value + (deltaX < 0 ? 1 : -1));

  clearSwipePreview();

  // A swipe that ends on a card must not also count as a click on it.
  if (isSwipe && swipedCard) {
    swipeClickCard = swipedCard;
    window.clearTimeout(swipeClickTimeout);
    swipeClickTimeout = window.setTimeout(() => {
      swipeClickCard = null;
    }, 750);
  }
}

function onCarouselTrackPointerCancel(event) {
  if (swipeStart?.pointerId === event.pointerId) {
    swipeStart = null;
    clearSwipePreview();
  }
}

// Registered with .capture so it runs before the card's own click handling.
function onCarouselTrackClick(event) {
  const target = event.target;
  if (
    swipeClickCard &&
    event.detail > 0 &&
    target instanceof Element &&
    target.closest(".lesson-card") === swipeClickCard
  ) {
    event.preventDefault();
    event.stopImmediatePropagation();
    swipeClickCard = null;
    window.clearTimeout(swipeClickTimeout);
  }
}

onMounted(() => {
  document.title = "Science Inquiry Lab Overview";
});

onBeforeUnmount(() => {
  window.clearTimeout(swipeClickTimeout);
});
</script>

<template>
  <main class="page">
    <header class="lesson-heading">
      <div id="hero" @click="onHeroClick">
        <div class="image-container">
          <img
            :src="titleImg"
            alt="Science Inquiry Lab"
          />
          <div class="hero-lens">
            <img
              :src="titleResponsiveImg"
              alt="Responsive part of the title"
            />
            <span class="glow"></span>
          </div>
        </div>
      </div>
    </header>

    <section class="carousel" aria-label="Choose a lesson">
      <Button
        v-show="currentIndex !== 0"
        class="carousel-control carousel-control--previous"
        aria-label="Show previous lesson"
        @click="showLesson(currentIndex - 1)"
      />
      <div
        ref="track"
        class="carousel-track"
        :class="{ 'is-swiping': isSwiping, 'is-grid': showAll }"
        @click.capture="onCarouselTrackClick"
        @pointermove="onCarouselTrackPointerMove"
        @pointerup="onCarouselTrackPointerUp"
        @pointerdown="onCarouselTrackPointerDown"
        @pointercancel="onCarouselTrackPointerCancel"
      >
        <Card
          v-for="[number, lesson] of lessons.entries()"
          :key="number + 1"
          :to="lesson.to"
          :img="lesson.img"
          :stage="number + 1"
          :offset="number - currentIndex"
          :locked="isLocked(number + 1)"
          :grid="showAll"
          :style="swipeStyle(number)"
          :accent="lesson.accent"
          :description="lesson.description"
          :experiment="lesson.experiment"
          :lesson-complete="isLessonComplete(number + 1)"
          @select="onCardSelect(number, $event)"
        >
          <template #number>Lesson {{ number + 1 }}</template>
          <template #subtitle>{{ lesson.subtitle }}</template>
        </Card>
      </div>
      <Button
        v-show="currentIndex !== lastIndex"
        class="carousel-control carousel-control--next"
        aria-label="Show next lesson"
        @click="showLesson(currentIndex + 1)"
      ></Button>
    </section>
    <p :key="status" class="carousel-status" aria-live="polite">
      <span>{{ status }}</span> /
      <span>{{ total }}</span>
    </p>
  </main>
</template>

<style scoped>
.page {
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto minmax(min-content, 1fr) auto;
  align-items: center;
  gap: clamp(8px, 1.2vh, 20px);
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  /* Clip only sideways: allow vertical scrolling at high browser zoom. */
  overflow-x: clip;
  padding: clamp(30px, 5vh, 50px) 0;
}
.lesson-heading {
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: center;
  align-self: start;
  width: min(460px, 92vw);
  height: max(210px, 18vh);

  margin: 0;
  margin-top: 10px;
}
#hero {
  --gradient: linear-gradient(to top, var(--purple), var(--orange));
  --mask: url("@/assets/homepage/title-responsive.png") center / 100% 100% no-repeat;

  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  box-shadow: none;
  user-select: none;
}

.glow {
  position: absolute;
  inset: 0;
  opacity: 0;

  transition: opacity 0.4s ease;
  pointer-events: none;

  animation: glow-pulse 3s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%,
  100% {
    filter: blur(2px) brightness(1);
  }
  50% {
    filter: blur(8px) brightness(3) saturate(2);
  }
}

.glow::after {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--gradient);
  -webkit-mask: var(--mask);
  mask: var(--mask);
}

.page:has(.lesson-card:hover) .glow {
  opacity: 1; /* glow strength */
}

/* Rainbow overlay masked to the magnifier's shape; fades in on hover. */
.hero-lens::after {
  content: "";
  position: absolute;
  inset: 0;
  /* "to top" runs left-to-right once the container is rotated 90deg. */
  background: var(--gradient);
  -webkit-mask: var(--mask);
  mask: var(--mask);

  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none; /* doesn't interfere with the click counter */
}

.page:has(.lesson-card:hover) .hero-lens::after {
  opacity: 1;
}

/* One box, one rotation: both images are laid out inside it in the
   same 1414x2000 frame the original single logo used. */
.image-container {
  position: relative;
  flex: none;
  /* Prevent the rotated logo from taking over short/zoomed viewports. */
  width: clamp(200px, 40vw, 450px);
  aspect-ratio: 1414 / 2000;
  transform: rotate(90deg);
}

#hero img {
  display: block;
  max-width: none;
  width: 100%;
  height: 100%;
}

/* Magnifier: a square image placed over the "INQUIRY" part of the text. */
.hero-lens {
  position: absolute;
  left: 21%;
  top: 2%;
  width: 80%;
  aspect-ratio: 1 / 1;
}

.carousel {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) 56px;
  grid-template-rows: 1fr;
  width: min(calc(100% - 32px), 1480px);
  height: clamp(460px, 58vh, 620px);
  align-self: center;
  justify-self: center;
  align-items: center;
  justify-items: center;
  column-gap: 12px;
  min-height: 0;
  margin: 0 auto;
}
.carousel-track {
  position: relative;
  align-self: stretch;
  grid-column: 1 / -1;
  grid-row: 1;
  width: 100%;
  perspective: 1200px;
  touch-action: pan-y;
}
/* Grid mode: hide arrows, let the track size to its cards */
.carousel:has(.carousel-track.is-grid) {
  grid-template-rows: auto;
  width: min(calc(100% - 100px), 1980px);
  height: auto;
}
.carousel:has(.carousel-track.is-grid) .carousel-control {
  display: none;
}
.carousel-track.is-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, min(100%, 550px));
  grid-auto-rows: auto;
  gap: 16px;
  align-items: stretch;
  justify-content: center;
  height: auto;
}
.carousel-track.is-grid .lesson-card {
  position: static;
  width: auto;
  min-height: 380px;
  /* Content determines height in the teacher's all-lessons grid. */
  aspect-ratio: auto;
  padding: clamp(16px, 2vw, 28px);
  box-shadow: none;

  transform: none;

  rotate: none;
  scale: 1;

  transition: none;
  will-change: none;

  animation: pop-fade-in 0.5s ease;
}
/* Grid mode: the overview sits in the card's flow, under the title */
.carousel-track.is-grid :deep(.overview) {
  position: static;
  width: 100%;
  margin: auto 0 0;
}
.carousel-track.is-grid .lesson-card:hover {
  background: color-mix(in srgb, var(--accent) 20%, white 80%);
}

.carousel-track.is-swiping .lesson-card {
  left: calc(50% + var(--swipe-x));
  z-index: var(--swipe-z);
  opacity: var(--swipe-opacity);
  transform: translate(-50%, -50%) scale(var(--swipe-scale))
    rotateY(var(--swipe-rotate));
  transition: none;
}
.carousel-control {
  position: relative;
  z-index: 3;
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--paper);

  --border-color-active: var(--line);
  --background-hover: var(--yellow);
}
.carousel-control::before {
  width: 10px;
  height: 10px;
  border-top: 3px solid var(--text);
  border-right: 3px solid var(--text);
  content: "";
}
.carousel-control--previous {
  grid-column: 1;
  grid-row: 1;
}
.carousel-control--previous::before {
  margin-left: 5px;
  transform: rotate(-135deg);
}
.carousel-control--next {
  grid-column: 3;
  grid-row: 1;
}
.carousel-control--next::before {
  margin-right: 5px;
  transform: rotate(45deg);
}
.carousel-status {
  margin: 0 auto;
  padding: 10px;
  border-radius: 99px;
  color: var(--paper);
  background: var(--purple);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-align: center;
  text-transform: uppercase;
  border: 2px solid var(--line);
}
.carousel-status span:first-child {
  animation: pop-fade-in 0.5s ease;
}
#hero:focus-visible {
  outline: 4px solid var(--purple);
  outline-offset: 5px;
}
@media (max-width: 700px) {
  .page {
    padding: 18px 0;
  }
  .carousel {
    grid-template-columns: 40px minmax(0, 1fr) 40px;
    grid-template-rows: 1fr;
    height: 560px;
  }
  .carousel-track {
    height: 100%;
  }
  .carousel-track.is-grid {
    height: auto;
  }
  .carousel-control {
    width: 40px;
    height: 40px;
  }
}
@media (max-width: 520px) {
  .carousel {
    height: 620px;
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}

/* Larger screens: scale the homepage with the viewport */
@media (min-width: 1600px) {
  .carousel {
    width: min(calc(100% - 32px), max(1480px, 70vw));
    height: max(620px, 60vh);
  }

  .carousel-control {
    width: max(48px, 1.7vw);
    height: max(48px, 1.7vw);
  }
}
</style>
