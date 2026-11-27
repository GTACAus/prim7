<script setup>
import { asset } from "@/utils/asset.js";
import Page from "@/components/layout/Page.vue";
import Section from "@/components/layout/Section.vue";
import LessonIntro from "@/components/content/LessonIntro.vue";
import LessonCard from "@/components/content/LessonCard.vue";
import Button from "@/components/ui/Button.vue";

// Learning objective and success criteria shown in the lesson intro
const objective = "Objective";
const criteria = ["Criterion 1", "Criterion 2", "Criterion 3"];

// Terms shown in the vocabulary modal: { word: description }
const glossary = {};

// Sections of the page. Order defines the unlock chain (next-id) and which
// sections start locked; override per section where needed.
const sections = [
  {
    id: "section",
    title: "Section",
  },
];
</script>
<template>
  <Page
    lessonId="lesson8"
    title="Lesson 8 - "
    :sections="sections"
    :glossary="glossary"
  >
    <template #lesson-intro>
      <LessonIntro
        label="Lesson 8"
        title="Lesson 8 Title"
        :worksheet="asset('')"
        :objective="objective"
        :criteria="criteria"
      >
        <template #observation>
          <h2>Title</h2>
          <p>Description</p>
        </template>
      </LessonIntro>
    </template>

    <template #sections>
      <Section name="section"></Section>
    </template>
  </Page>

  <!-- Question Wheel Script -->
</template>
