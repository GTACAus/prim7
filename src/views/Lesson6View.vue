<script setup>
// Load before the components: these styles keep the cascade order of the old stylesheet.
import "../styles/graphs.css";
import { ref } from "vue";
import Page from "../components/layout/Page.vue";
import Section from "../components/layout/Section.vue";
import LessonIntro from "../components/content/LessonIntro.vue";
import NumberLine from "../components/lessons/lesson6/NumberLine.vue";
import LineGraph from "../components/lessons/lesson6/LineGraph.vue";
import Media from "../components/ui/Media.vue";
import {
  ELEPHANT,
  CONNIWINKS,
  YEAST,
  PLANTS,
} from "../components/lessons/lesson6/lineGraphs.js";
import ContentBox from "../components/ui/ContentBox.vue";
import Grid from "../components/layout/Grid.vue";
import LessonEndCard from "../components/content/LessonEndCard.vue";

// Terms shown in the vocabulary modal: { word: description }
const glossary = {
  Graph:
    "A visual way of showing data so patterns, comparisons and relationships are easier to see.",
  "X-axis":
    "The horizontal axis. In a fair test line graph, this often shows the independent variable — what was changed.",
  "Y-axis":
    "The vertical axis. In a fair test graph, this often shows the dependent variable — what was measured.",
  "Line graph":
    "A graph that uses points and lines to show how a measured value changes across ordered or continuous values.",
  "Bar graph":
    "A graph that uses separate bars to compare amounts across different categories.",
};

// Learning objective and success criteria shown in the lesson intro
const objective =
  "We are learning how to <strong>construct and interpret a line graph</strong>.";
const criteria = [
  "I can describe what the <strong>x-axis</strong> and <strong>y-axis</strong> show.",
  "I can <strong>plot points</strong> on the graph and <strong>connect them with a line</strong>.",
  "I can describe <strong>trends or patterns</strong> in line graphs.",
];

// The three steps in the intro's "When do scientists use a line graph?" card
const graphSteps = [
  {
    title: "Look for a continuous variable",
    points: [
      "We use a line graph when the variable on the x-axis is continuous. The values can include whole numbers, decimals, or fractions.",
    ],
  },
  {
    title: "Think about what can vary continuously",
    points: ["Examples include length, weight, temperature, volume and depth."],
  },
  {
    title: "Connect the data points",
    points: [
      "The connected line helps you see trends or patterns as the x-axis variable changes.",
    ],
  },
];

// Sections of the page. Order defines the unlock chain.
const sections = [
  { id: "marine-snail-context", title: "Victorian Marine Snails" },
  { id: "number-line-activity", title: "Explore How a Line Graph Works" },
  { id: "line-graph-elephant", title: "Turn a Data Table into a Line Graph" },
  { id: "line-graph-conniwinks", title: "Build a Line Graph" },
  { id: "line-graph-yeast", title: "Practise Applying the Principles" },
  { id: "line-graph-plants", title: "Plotting Time on the x-axis" },
];

// Testable question and reasoned prediction above each line graph
const questions = {
  elephant: {
    aria: "Elephant snail investigation question and prediction",
    question:
      "How does the distance from the low tide mark affect the number of elephant snails on the rock platform?",
    prediction:
      "As the distance from the low tide mark increases, the number of elephant snails decreases.",
    reason:
      "Elephant snails are large marine snails and risk drying out, so they prefer being close to the water.",
  },
  conniwinks: {
    aria: "Striped conniwinks investigation question and prediction",
    question:
      "How does the distance from the low tide mark affect the number of striped conniwinks on the rock platform?",
    prediction:
      "As the distance from the low tide mark increases, the number of striped conniwinks decreases.",
    reason:
      "Striped conniwinks are marine snails and risk drying out, so they prefer being close to the water.",
  },
  yeast: {
    aria: "Yeast investigation question and prediction",
    question: "How does temperature affect yeast activity?",
    prediction:
      "As the temperature increases, the activity of the yeast increases.",
    reason: "Living things like warmth, so warmth helps yeast to grow.",
  },
  plants: {
    aria: "Stevia plant investigation question and prediction",
    question: "What is the effect of water on Stevia plant height?",
    prediction:
      "Increasing the amount of water increases the height of the plant.",
    reason: "This is because the plant needs water to expand and grow.",
  },
};

// Each line graph's reset button clears everything in its section.
const elephantSection = ref(null);
const conniwinksSection = ref(null);
const yeastSection = ref(null);
const plantsSection = ref(null);
const plants = ref(null);
</script>

<template>
  <!-- Page renders the vocabulary modal and the hidden teacher menu
       (opened by clicking the lesson title five times). -->
  <Page
    lessonId="lesson6"
    title="Lesson 6 - Using Line Graphs to Visualise Data"
    :sections="sections"
    :glossary="glossary"
  >
    <!-- ==================================================
         LESSON INTRODUCTION
         ================================================== -->
    <template #lesson-intro>
      <LessonIntro
        label="Lesson 6"
        title="Using Line Graphs to Visualise Data"
        :objective="objective"
        :criteria="criteria"
      >

        <template #observation>
          <h2>When do scientists use a line graph?</h2>
          <p>
            In a line graph, a line connects the points. The line shows how one
            variable <strong>continuously affects another variable</strong>.
          </p>

          <div class="formula-card">
            <div
              v-for="(step, i) in graphSteps"
              :key="step.title"
              class="formula-step"
            >
              <div class="formula-step-number">{{ i + 1 }}</div>
              <div>
                <strong>{{ step.title }}</strong>
                <ul>
                  <li v-for="point in step.points" :key="point">{{ point }}</li>
                </ul>
              </div>
            </div>
          </div>
        </template>
      </LessonIntro>
    </template>

    <template #sections>
      <!-- ==================================================
           MARINE-SNAIL CONTEXT
           ================================================== -->
      <Section name="marine-snail-context">
        <ContentBox>
          <p>
            <strong>You are a marine biologist.</strong> Marine biologists study
            the animals and plants that live in or near the sea. Today, you are
            investigating three marine snails that live between the
            <strong>low tide</strong> and <strong>high tide</strong> points on a
            rock platform. Your task is to explore how the distribution of each
            snail changes as you move away from the low tide mark.
          </p>
        </ContentBox>

        <Media
          class="spaced-block"
          src="../images/lesson6/tide-animation.gif"
          alt="Animated diagram showing the rock platform changing between low tide and high tide"
        />
      </Section>

      <!-- ==================================================
           EXPLORE THE ROCK PLATFORM (number line)
           ================================================== -->
      <Section name="number-line-activity">
        <NumberLine />
      </Section>

      <!-- ==================================================
           LINE GRAPH: TURN A DATA TABLE INTO A GRAPH
           ================================================== -->
      <Section ref="elephantSection" name="line-graph-elephant">
        <Grid
          :cols="2"
          gap="sm"
          class="project-question-grid"
          :aria-label="questions.elephant.aria"
        >
          <div class="project-question-card">
            <h4>Testable question</h4>
            <p>
              <strong>{{ questions.elephant.question }}</strong>
            </p>
          </div>
          <div class="project-question-card">
            <h4>Reasoned prediction</h4>
            <p>
              <strong>{{ questions.elephant.prediction }}</strong>
              {{ questions.elephant.reason }}
            </p>
          </div>
        </Grid>

        <LineGraph :graph="ELEPHANT" @reset="elephantSection?.reset()" />
      </Section>

      <!-- ==================================================
           YOUR TURN - STRIPED CONNIWINKS
           ================================================== -->
      <Section ref="conniwinksSection" name="line-graph-conniwinks">
        <Grid
          :cols="2"
          gap="sm"
          class="project-question-grid"
          :aria-label="questions.conniwinks.aria"
        >
          <div class="project-question-card">
            <h4>Testable question</h4>
            <p>
              <strong>{{ questions.conniwinks.question }}</strong>
            </p>
          </div>
          <div class="project-question-card">
            <h4>Reasoned prediction</h4>
            <p>
              <strong>{{ questions.conniwinks.prediction }}</strong>
              {{ questions.conniwinks.reason }}
            </p>
          </div>
        </Grid>

        <LineGraph :graph="CONNIWINKS" @reset="conniwinksSection?.reset()" />
      </Section>

      <!-- ==================================================
           PRACTISE - YEAST
           ================================================== -->
      <Section ref="yeastSection" name="line-graph-yeast">
        <Grid :cols="2" gap="sm" class="project-question-grid" :aria-label="questions.yeast.aria">
          <div class="project-question-card">
            <h4>Testable question</h4>
            <p>
              <strong>{{ questions.yeast.question }}</strong>
            </p>
          </div>
          <div class="project-question-card">
            <h4>Reasoned prediction</h4>
            <p>
              <strong>{{ questions.yeast.prediction }}</strong>
              {{ questions.yeast.reason }}
            </p>
          </div>
        </Grid>

        <Media
          class="spaced-block"
          src="../images/lesson6/yeastexperiment.png"
          alt="Diagram of the yeast, sugar, water and balloon fair-test experiment"
        />

        <ContentBox>
          <p>
            Yeast in water feed on sugar and produce
            <strong>carbon dioxide gas</strong> as they grow and divide. The gas
            can be captured in a balloon. The size of the balloon indicates how
            much gas is produced, and therefore how active the yeast are.
          </p>
        </ContentBox>

        <LineGraph :graph="YEAST" @reset="yeastSection?.reset()" />
      </Section>

      <!-- ==================================================
           SPECIAL CASE - TIME ON THE X-AXIS
           ================================================== -->
      <Section
        ref="plantsSection"
        name="line-graph-plants"
        :class="{ 'plant-graph-complete': plants?.complete }"
      >
        <ContentBox>
          <p>
            In many fair test experiments, the dependent variable is measured as
            it changes over time. Time is shown on the
            <strong>x-axis</strong> of <strong>graphs</strong> for such
            experiments, even though time is not the independent variable.
          </p>
        </ContentBox>

        <Grid :cols="2" gap="sm" class="project-question-grid" :aria-label="questions.plants.aria">
          <div class="project-question-card">
            <h4>Testable question</h4>
            <p>
              <strong>{{ questions.plants.question }}</strong>
            </p>
          </div>
          <div class="project-question-card">
            <h4>Reasoned prediction</h4>
            <p>
              <strong>{{ questions.plants.prediction }}</strong>
              {{ questions.plants.reason }}
            </p>
          </div>
        </Grid>

        <Media
          class="spaced-block"
          src="../images/lesson6/stevia-plants.png"
          alt="Six Stevia plants split between 100 mL and 300 mL watering conditions"
        />

        <ContentBox>
          <p>
            <strong>Special case:</strong> the amount of water is the
            independent variable, but plant height was measured repeatedly over
            <strong>60 days</strong>. To compare both watering conditions
            throughout the experiment, put <strong>time on the x-axis</strong>
            and show the two water amounts as
            <strong>two lines on the same graph</strong>.
          </p>
        </ContentBox>

        <LineGraph
          ref="plants"
          :graph="PLANTS"
          @reset="plantsSection?.reset()"
        />

        <LessonEndCard
          v-if="plants?.predictionComplete"
          :lesson-number="6"
          :practiced="[
            'Plotting and connecting points on a line graph',
            'Describing trends as a variable changes over time',
          ]"
        />
      </Section>
    </template>
  </Page>
</template>

<style>
/* Moved from styles/lesson4_styles/lesson4.css. Not scoped: some rules style child components' content. */

/* Slightly larger numbers on the x- and y-axes */
:is(
    #lineGraphElephantSvg,
    #lineGraphConniwinksSvg,
    #lineGraphYeastSvg,
    #lineGraphPlantsSvg
  )
  .tick-label {
  font-size: 14px;
  font-weight: 700;
}

/* Keep all line-graph data tables compact and easy to scan. */
:is(
    #line-graph-elephant,
    #line-graph-conniwinks,
    #line-graph-yeast,
    #line-graph-plants
  )
  .linegraph-data-table {
  width: min(820px, 100%);
  margin: 0 auto;
  table-layout: fixed;
}

/* First column gets a little more room, but stays centred.
   The remaining four columns share the rest evenly. */
:is(
    #line-graph-elephant,
    #line-graph-conniwinks,
    #line-graph-yeast,
    #line-graph-plants
  )
  .linegraph-data-table
  th:first-child,
:is(
    #line-graph-elephant,
    #line-graph-conniwinks,
    #line-graph-yeast,
    #line-graph-plants
  )
  .linegraph-data-table
  td:first-child {
  width: 28%;
  text-align: center;
  vertical-align: middle;
}

/* Keep the investigation cards visually separate from the data card below. */
#line-graph-elephant .project-question-grid {
  margin-bottom: 20px;
}

:is(
    #lineGraphElephantSvg,
    #lineGraphConniwinksSvg,
    #lineGraphYeastSvg,
    #lineGraphPlantsSvg
  )
  .linegraph-path {
  fill: none;
  stroke: var(--purple);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

:is(
    #lineGraphElephantSvg,
    #lineGraphConniwinksSvg,
    #lineGraphYeastSvg,
    #lineGraphPlantsSvg
  )
  .linegraph-point {
  fill: var(--orange);
  stroke: var(--charcoal);
  stroke-width: 3;
  transform-box: fill-box;
  transform-origin: center;
  animation: graphPointPop 0.35s ease-out;
}

:is(
    #lineGraphElephantSvg,
    #lineGraphConniwinksSvg,
    #lineGraphYeastSvg,
    #lineGraphPlantsSvg
  )
  .linegraph-point.connectable {
  cursor: pointer;
}

:is(
    #lineGraphElephantSvg,
    #lineGraphConniwinksSvg,
    #lineGraphYeastSvg,
    #lineGraphPlantsSvg
  )
  .linegraph-point.connectable:hover,
:is(
    #lineGraphElephantSvg,
    #lineGraphConniwinksSvg,
    #lineGraphYeastSvg,
    #lineGraphPlantsSvg
  )
  .linegraph-point.connectable:focus {
  fill: var(--yellow);
  stroke: var(--purple);
  outline: none;
}

:is(
    #lineGraphElephantSvg,
    #lineGraphConniwinksSvg,
    #lineGraphYeastSvg,
    #lineGraphPlantsSvg
  )
  .linegraph-point.connected {
  fill: var(--soft-green);
  stroke: var(--green);
  stroke-width: 4;
}

:is(
    #lineGraphElephantSvg,
    #lineGraphConniwinksSvg,
    #lineGraphYeastSvg,
    #lineGraphPlantsSvg
  )
  .linegraph-point.connect-error {
  fill: var(--soft-orange);
  stroke: var(--orange);
  stroke-width: 4;
}

:is(#line-graph-conniwinks, #line-graph-yeast, #line-graph-plants)
  .project-question-grid {
  margin-bottom: 20px;
}

:is(#lineGraphConniwinksSvg, #lineGraphYeastSvg, #lineGraphPlantsSvg) {
  cursor: crosshair;
  touch-action: none;
}

#lineGraphPlantsSvg .plant-line-100 {
  stroke: var(--purple);
}

#lineGraphPlantsSvg .plant-line-300 {
  stroke: var(--green);
}
</style>
