import { defineStore } from "pinia";
import { ref, watch } from "vue";

const STORAGE_KEY = "prim7:home";

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch (error) {
    console.warn("Could not restore home page progress:", error);
    return {};
  }
}

// Home page state: which lesson card the carousel is showing.
// Saved to localStorage automatically whenever it changes.
export const useHomeStore = defineStore("home", () => {
  const saved = load();
  const currentLesson = ref(saved.currentLesson ?? 0);
  // lessonIds of finished lessons, e.g. ["pretask", "lesson1"]
  const completeLessons = ref(saved.completeLessons ?? []);

  watch(
    [currentLesson, completeLessons],
    () => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            currentLesson: currentLesson.value,
            completeLessons: completeLessons.value,
          }),
        );
      } catch (error) {
        console.warn("Could not save home page progress:", error);
      }
    },
    { deep: true },
  );

  // Called by each lesson's Page: true once every section is done, false after a reset.
  function setLessonComplete(lessonId, complete) {
    const has = completeLessons.value.includes(lessonId);
    if (complete && !has) completeLessons.value.push(lessonId);
    else if (!complete && has)
      completeLessons.value = completeLessons.value.filter(
        (id) => id !== lessonId,
      );
  }

  return { currentLesson, completeLessons, setLessonComplete };
});
