<script setup>
import { asset } from "@/utils/asset.js";
import LessonIntro from "@/components/content/LessonIntro.vue";
import Expedition from "@/components/lessons/lesson7/Expedition.vue";

// Terms shown in the vocabulary modal ("Field guide"): { word: description }
const glossary = {
  "Scientific diagram":
    "A simplified representation of an experimental set-up using clear conventions and equipment symbols.",
  "Scientific drawing":
    "A clear, accurate line drawing used to record an observation.",
  "Fair test":
    "An investigation where the variable being tested is changed while relevant conditions are kept the same.",
  Observation:
    "Information collected by carefully noticing and recording features or changes.",
};

// Learning objective and success criteria shown in the lesson intro
const objective =
  "We are learning how to create <strong>scientific drawings</strong> of specimens.";
const criteria = [
  "I am learning how to observe and record details in my drawings.",
  "I can label parts of a specimen in my drawing.",
  "I can use a scientific drawing to communicate my observations.",
];

// The steps in the intro's "Constructing a scientific drawing" card
const drawingSteps = [
  "Identify the specimen",
  "Observe and record details",
  "Label the parts of the specimen",
];

document.title = "Lesson 7 - Drawing Scientific Diagrams";
</script>

<template>
  <main class="page expedition-page">
    <div class="expedition-intro">
      <LessonIntro
        label="Lesson 7"
        title="Drawing Scientific Diagrams"
        :worksheet="asset('worksheets/l7-worksheet.pdf')"
        :objective="objective"
        :criteria="criteria"
      >
        Scientific drawings help scientists to record and communicate their
        observations. In this lesson, we will learn how to create a scientific
        drawing of a specimen.

        <template #observation>
          <h2>Constructing a scientific drawing</h2>
          <p>
            How to construct a <strong>scientific drawing</strong> to represent
            observations:
          </p>
          <div class="formula-card">
            <div
              v-for="(step, i) in drawingSteps"
              :key="step"
              class="formula-step"
            >
              <div class="formula-step-number">{{ i + 1 }}</div>
              <div>
                <strong>{{ step }}</strong>
              </div>
            </div>
          </div>
        </template>
      </LessonIntro>
    </div>

    <!-- The game, with the vocabulary modal and the hidden teacher menu
         (opened by clicking the lesson title five times). -->
    <Expedition :glossary="glossary" />
  </main>
</template>

<style scoped>
/* Same width as the intro on the other lessons (Page.vue); the game below stays full-width. */
.expedition-intro {
  width: min(1180px, 94%);
  margin: 0 auto;
}
</style>
