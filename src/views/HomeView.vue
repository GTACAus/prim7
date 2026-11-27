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
// Carousel state (a 3D ring the cards sit around)
// ─────────────────────────────────────────────
const count = lessons.length;
const lastIndex = count - 1;
// One slot more than there are cards: the empty slot is a card-sized gap
// between the last lesson and the first, marking where the ring starts.
const SLOTS = count + 1;
const ANGLE = 360 / SLOTS; // degrees between neighbouring slots on the ring
const RING_GAP = 24; // px of space between neighbouring cards' edges

const wrap = (n) => ((n % SLOTS) + SLOTS) % SLOTS;
// Shortest signed distance around the ring, in the range [-SLOTS/2, SLOTS/2).
const ringDistance = (n) => wrap(n + SLOTS / 2) - SLOTS / 2;

const currentIndex = computed(() =>
  Math.max(0, Math.min(home.currentLesson, lastIndex)),
);
const status = computed(() => String(currentIndex.value + 1).padStart(2, "0"));
const total = String(count).padStart(2, "0");

const showAll = ref(false);
const track = ref(null);

function isLocked(number) {
  return !showAll.value && number > availableLesson;
}

// The current lesson lives in the home store, which saves itself.
// The ring stops at both ends: no going from the first lesson to the last.
function showLesson(index) {
  home.currentLesson = Math.max(0, Math.min(index, lastIndex));
}

// Where a card sits relative to the current one: 0 = current, -1 = previous,
// 1 = next. Not wrapped, so the first and last lessons are never neighbours.
function ringOffset(index) {
  return index - currentIndex.value;
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
// Ring geometry: the radius that fits every card around the circle
// ─────────────────────────────────────────────
const cardWidth = ref(0);
let resizeObserver = null;

function measureCards() {
  const card = track.value?.querySelector(".lesson-card");
  if (card) cardWidth.value = card.offsetWidth;
}

const ringRadius = computed(
  () => (cardWidth.value / 2 + RING_GAP / 2) / Math.tan(Math.PI / SLOTS),
);

const trackStyle = computed(() =>
  showAll.value ? undefined : { "--ring-radius": `${ringRadius.value}px` },
);

// ─────────────────────────────────────────────
// Swipe (touch) handling
// ─────────────────────────────────────────────
const SWIPE_THRESHOLD = 100;

let swipeStart = null;
let swipeClickCard = null;
let swipeClickTimeout = 0;

// How far the ring is being dragged, in cards (0 when not swiping).
const swipeShift = ref(0);
const isSwiping = ref(false);

function updateSwipePreview(deltaX) {
  const trackWidth = track.value.clientWidth;
  const direction = deltaX < 0 ? 1 : -1;
  let progress = Math.min(Math.abs(deltaX) / (trackWidth * 0.55), 1);

  // At either end the ring only gives a little, then springs back.
  if (
    (currentIndex.value === 0 && direction < 0) ||
    (currentIndex.value === lastIndex && direction > 0)
  ) {
    progress *= 0.18;
  }

  isSwiping.value = true;
  swipeShift.value = direction * progress;
}

function clearSwipePreview() {
  isSwiping.value = false;
  swipeShift.value = 0;
}

// Each card's angle around the ring and how strongly it shows. The angle is
// never wrapped, so every card turns the same way when the ring moves.
function cardStyle(index) {
  if (showAll.value) return undefined;

  const position = index - currentIndex.value - swipeShift.value;
  const distance = Math.abs(ringDistance(position));
  const opacity =
    distance <= 1
      ? 1 - distance * 0.08
      : Math.max(0.2, 0.92 - (distance - 1) * 0.3);
  // const opacity = 1;

  return {
    "--ring-angle": `${position * ANGLE}deg`,
    "--ring-opacity": String(opacity),
    // Nearer cards paint (and take the mouse) on top of further ones.
    "--ring-z": String(Math.round((SLOTS / 2 - distance) * 10)),
  };
}

// True once a card has turned 90° or more (edge-on or facing away), so its
// contents can be hidden instead of showing through backwards.
function isFacingAway(index) {
  if (showAll.value) return false;
  const position = index - currentIndex.value - swipeShift.value;
  return Math.abs(ringDistance(position)) * ANGLE >= 80;
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
  // Cards animate their width, so watch the cards themselves, not the track.
  resizeObserver = new ResizeObserver(measureCards);
  track.value
    .querySelectorAll(".lesson-card")
    .forEach((card) => resizeObserver.observe(card));
});

onBeforeUnmount(() => {
  window.clearTimeout(swipeClickTimeout);
  resizeObserver?.disconnect();
});
</script>

<template>
  <main class="page">
    <header class="lesson-heading">
      <div id="hero" @click="onHeroClick">
        <div class="image-container">
          <img :src="titleImg" alt="Science Inquiry Lab" />
          <div class="hero-lens">
            <img :src="titleResponsiveImg" alt="Responsive part of the title" />
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
        :class="{
          'is-ring': !showAll,
          'is-swiping': isSwiping,
          'is-grid': showAll,
        }"
        :style="trackStyle"
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
          :offset="ringOffset(number)"
          :locked="isLocked(number + 1)"
          :grid="showAll"
          :style="cardStyle(number)"
          :class="{ 'is-back': isFacingAway(number) }"
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
  /* Heading and status keep their size; the carousel takes what is left so
     everything fits on one screen without page scrolling. */
  grid-template-rows: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: clamp(6px, 1.2vh, 20px);
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  padding: clamp(8px, 2vh, 30px) 0;
}
/* Teacher's all-lessons grid is taller than the screen, so let it scroll. */
.page:has(.carousel-track.is-grid) {
  height: auto;
  min-height: 100dvh;
  overflow: visible;
  overflow-x: clip;
}
.lesson-heading {
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: center;
  align-self: start;
  width: min(460px, 92vw);
  height: clamp(90px, 18vh, 210px);

  margin: 0;
  margin-top: 0;
}
#hero {
  --gradient: linear-gradient(to top, var(--purple), var(--orange));
  --mask: url("@/assets/homepage/title-responsive.png") center / 100% 100%
    no-repeat;

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
  width: clamp(120px, min(40vw, 30vh), 450px);
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
  height: 100%;
  align-self: stretch;
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

/* ---------- 3D ring ----------
   Every card is pushed out to the ring's edge and turned to its angle, so the
   whole set forms a cylinder that rotates around its centre. The extra
   .carousel prefix keeps these rules ahead of Card.vue's own styles. */
/* No preserve-3d: the track's own flat surface would then sit in front of
   every card set back into the ring and swallow their hovers and clicks.
   Instead each card is projected on its own and --ring-z orders them. */
.carousel .carousel-track.is-ring {
  perspective: 1400px;
  /* Look down on the ring from above so the cards behind rise above the front. */
  perspective-origin: 50% 15%;
}
.carousel .carousel-track.is-ring .lesson-card {
  left: 50%;
  z-index: var(--ring-z, 0);
  opacity: var(--ring-opacity, 1);
  transform: translate(-50%, -50%) translateZ(calc(-1 * var(--ring-radius)))
    rotateY(var(--ring-angle, 0deg))
    translateZ(calc(var(--ring-radius) + var(--ring-pop, 0px)));
  transition:
    transform 0.75s cubic-bezier(0.22, 0.8, 0.26, 1),
    opacity 0.75s ease,
    box-shadow 0.2s ease,
    background 0.45s ease,
    width 0.45s ease;
}
/* Neighbours lean out of the ring and light up when hovered. */
.carousel .carousel-track.is-ring .lesson-card.is-previous:hover,
.carousel .carousel-track.is-ring .lesson-card.is-next:hover {
  --ring-pop: 40px;
  opacity: 1;
  background: color-mix(in srgb, var(--accent) 12%, white 88%);
  box-shadow: 0 24px 54px rgb(0 0 0 / 40%);
}
/* Locked cards stay solid (so the back of the ring doesn't show through)
   and look washed out instead. */
.carousel .carousel-track.is-ring .lesson-card.unavailable {
  opacity: 1;
  filter: grayscale(0.8) contrast(0.6) brightness(1.15);
}
/* Cards turned away from the viewer show a blank back instead of their
   contents mirrored. (backface-visibility can't do this: each card flattens
   its contents onto itself, so they never count as facing away.) */
.carousel .carousel-track.is-ring .lesson-card.is-back > :deep(*) {
  visibility: hidden;
}
/* While dragging, the ring follows the finger exactly. */
.carousel .carousel-track.is-ring.is-swiping .lesson-card {
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
  padding: clamp(4px, 1vh, 10px) 10px;
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
  .carousel {
    grid-template-columns: 40px minmax(0, 1fr) 40px;
    grid-template-rows: 1fr;
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
  }

  .carousel-control {
    width: max(48px, 1.7vw);
    height: max(48px, 1.7vw);
  }
}
</style>
