<script setup>
// Load before the components: these styles keep the cascade order of the old stylesheet.
import "../styles/data-tables.css";
import "../styles/lesson3.css";
import { ref } from "vue";
import Page from "../components/layout/Page.vue";
import Section from "../components/layout/Section.vue";
import LessonIntro from "../components/content/LessonIntro.vue";
import Button from "../components/ui/Button.vue";
import StopAndCheck from "../components/content/StopAndCheck.vue";
import VariableSort from "../components/activities/VariableSort.vue";
import YeastCards from "../components/lessons/lesson3/YeastCards.vue";
import YeastResultsTable from "../components/lessons/lesson3/YeastResultsTable.vue";
import { openPDF, openVideo } from "../composables/useModal.js";

// Learning objective and success criteria shown in the lesson intro
const objective =
  "We are learning how to collect <strong>data</strong> and record it in a <strong>table</strong>.";
const criteria = [
  "I can label a <strong>table</strong> with variables and <strong>units</strong> in the correct way.",
  "I can collect <strong>data</strong> and enter it into a <strong>table</strong> with the correct <strong>units</strong>.",
  "I can work out the average result for an experiment.",
];

// Terms shown in the vocabulary modal: { word: description }
const glossary = {
  Data: "The observations or measurements you collect during an investigation. Data can be numbers (e.g. temperature, height) or descriptions (e.g. colour, texture).",
  "Dependent variable":
    "The result that is observed or measured during a fair test experiment.",
  "Independent variable":
    "The one variable changed during a fair test experiment.",
  "Repeat tests":
    "The same test carried out two or more times under exactly the same conditions, to check that your results are consistent.",
  Table: "An organised arrangement of columns and rows used to display data.",
  Units:
    "The standard amount or portion of something that is measured, e.g. cm for length, kg for weight, minutes for time.",
};

// Sections of the page. Order defines the unlock chain.
const sections = [
  { id: "yeast-image-investigation", title: "Is Yeast Alive?" },
  {
    id: "yeast-variables",
    title: "A fair test to find out what makes yeast active",
    label: "Yeast Variables: Select the variables",
  },
  { id: "data-table-template", title: "How to make a scientific table" },
  { id: "yeast-labels", title: "Build and Complete the Yeast Data Table" },
];

// Options passed to the activity components
const sortVariablesOneActivityOptions = {
  tiles: [
    "amount-of-yeast",
    "amount-of-sugar",
    "amount-of-water",
    "temperature",
    "size-of-flask",
    "amount-of-gas-produced",
    "type-of-balloon",
  ],
  answers: {
    independent: "temperature",
    dependent: "amount-of-gas-produced",
    controlled: [
      "amount-of-yeast",
      "amount-of-sugar",
      "amount-of-water",
      "size-of-flask",
      "type-of-balloon",
    ],
  },
  messages: {
    dependentWrong:
      "Try again. Which variable is observed or measured in this question?",
    controlledWrong:
      "Try again. That variable is not controlled in this fair test.",
    controlledMore:
      "Yes, that is a controlled variable. Choose another variable that must be kept the same.",
  },
};

// The "how will they measure the gas" check appears once the sort is done
const variableSort = ref(null);

// Videos and reference sheet for the scientific table key
const tableKeys = [
  {
    class: "key-independent",
    title: "Independent variable",
    text: "What you change.",
    video: "../videos/lesson3/independentvar.mp4",
    videoTitle: "Independent Variable Guide",
  },
  {
    class: "key-dependent",
    title: "Dependent variable",
    text: "What you measure or observe.",
    video: "../videos/lesson3/dependentvar-2.mp4",
    videoTitle: "Dependent Variable Guide",
  },
  {
    class: "key-units",
    title: "Units",
    text: "The <strong>unit</strong> belongs in the heading, not in each cell.",
    video: "../videos/lesson3/units-2.mp4",
    videoTitle: "Units Guide",
    pdf: "../downloads/lesson3/units.pdf",
    pdfTitle: "Examples of Units",
  },
];

// The last section's reset button clears everything in that section
const labelsSection = ref(null);
</script>

<template>
  <!-- Page renders the vocabulary modal and the hidden teacher menu
       (opened by clicking the lesson title five times). -->
  <Page
    lessonId="lesson3"
    title="Lesson 3 - Organising Fair Test Data into a Table"
    :sections="sections"
    :glossary="glossary"
  >
    <!-- ==================================================
         LESSON INTRODUCTION
         ================================================== -->
    <template #lesson-intro>
      <LessonIntro
        label="Lesson 3"
        title="Organising Fair Test Data into a Table"
        worksheet="../worksheets/l3-worksheet.pdf"
        :objective="objective"
        :criteria="criteria"
      >
        <template #observation>
          <h2>Recording Data in Scientific Tables</h2>

          <p>
            When scientists carry out fair tests, they use
            <strong>tables</strong> to record <strong>data</strong>. This helps
            them to see patterns, trends, and relationships in the
            <strong>data</strong>.
          </p>

          <div class="formula-card">
            <div class="formula-step">
              <div id="formula-step-independent" class="formula-step-number">
                1
              </div>
              <div>
                <strong
                  >The independent variable and how you will change it</strong
                >
                <span>
                  Put this in the left-hand column of the
                  <strong>table</strong>
                </span>
              </div>
            </div>

            <div class="formula-step">
              <div id="formula-step-dependent" class="formula-step-number">
                2
              </div>
              <div>
                <strong
                  >The dependent variable and the measurements you make for
                  it</strong
                >
                <span>
                  Put this in the right-hand column of the
                  <strong>table</strong>
                </span>
              </div>
            </div>

            <div class="formula-step">
              <div id="formula-step-units" class="formula-step-number">3</div>
              <div>
                <strong>Repeat each test three times</strong>
                <span>
                  Record each repeat as test 1, test 2, and test 3. This helps
                  you to spot errors if they occur
                </span>
              </div>
            </div>
          </div>
        </template>
      </LessonIntro>
    </template>

    <template #sections>
      <!-- ==================================================
           1. IS YEAST ALIVE?
           ================================================== -->
      <Section name="yeast-image-investigation">
        <div class="diagram-box diagram-activity">
          Hover over each image to learn if yeast is alive, and how it is used
          to produce bread.
        </div>
        <YeastCards />
      </Section>

      <!-- ==================================================
           2. YEAST FAIR TEST - IDENTIFY VARIABLES
           ================================================== -->
      <Section name="yeast-variables">
        <div class="diagram-activity diagram-box">
          <p class="activity-instruction">
            A student set up a fair test as seen in the image below. They wrote
            a testable question.
          </p>
          <div class="variable-question floating-title">
            How does changing temperature affect the amount of gas made by
            yeast?
          </div>
          <p class="activity-instruction">
            Then the student came up with a reasoned prediction:
          </p>
          <div
            class="diagram-activity diagram-box reasoned-prediction-box floating-title"
          >
            As temperature increases, the amount of gas made by yeast increases.
            This is because living things need to be warm to survive.
          </div>
        </div>

        <div class="yeast-balloon-image-box">
          <img
            src="../images/lesson3/balloon-experiment.png"
            alt="A fair test for the effect of temperature on yeast activity"
          />
        </div>

        <div class="diagram-box diagram-activity">
          <p class="activity-instruction">
            Identify all the variables in the yeast fair test:
          </p>

          <ol class="variable-steps">
            <li>
              Select <strong>Independent variable</strong>, then choose what is
              changed.
            </li>
            <li>
              Select <strong>Dependent variable</strong>, then choose what is
              measured.
            </li>
            <li>
              Select <strong>Controlled variable</strong>, then choose
              everything kept the same.
            </li>
          </ol>
        </div>

        <VariableSort
          ref="variableSort"
          id="sortVariablesOneActivity"
          name="yeast-variable-sort"
          :options="sortVariablesOneActivityOptions"
        >
          <template #autofillTestableQuestion>
            How does changing temperature affect the amount of gas made by
            yeast?
          </template>
        </VariableSort>

        <StopAndCheck v-if="variableSort?.isComplete" name="measure-gas-check">
          <template #content>
            <p>Look at the image for the fair test.</p>
            <p>How will they measure the amount of gas produced?</p>
          </template>
          <template #answer>
            The balloon will trap any gas made by the yeast. As yeast gets more
            active, there will be more gas made, so the balloon will be bigger.
          </template>
        </StopAndCheck>
      </Section>

      <!-- ==================================================
           3. PARENT / REFERENCE TABLE
           ================================================== -->
      <Section name="data-table-template">
        <div class="diagram-box diagram-activity">
          <p class="activity-instruction">
            Scientists have a format they use to make a scientific
            <strong>table</strong> to record <strong>data</strong>. Watch the
            videos below to learn how they do this.
          </p>
        </div>

        <div class="data-table-card reference-table-card">
          <div class="table-key-grid" aria-label="Parts of a data table">
            <div
              v-for="key in tableKeys"
              :key="key.title"
              class="table-key-card"
              :class="key.class"
            >
              <h3>{{ key.title }}</h3>
              <p v-html="key.text"></p>
              <Button
                class="watch-video-button"
                symbol="▶"
                @click="openVideo(key.video, key.videoTitle)"
              >
                Watch Video
              </Button>
              <Button
                v-if="key.pdf"
                class="watch-video-button"
                @click="openPDF(key.pdf, key.pdfTitle)"
              >
                {{ key.pdfTitle }}
              </Button>
            </div>
          </div>

          <div class="reference-callout-row" aria-hidden="true">
            <div class="data-table-callout reference-callout-independent">
              <span class="callout-number">1</span>
              <p>
                Put the <strong>independent variable and its units</strong>
                at the top of the first column. List each condition that you
                change in the cells below this.
              </p>
            </div>

            <div class="data-table-callout reference-callout-dependent">
              <span class="callout-number">2</span>
              <p>
                Put the <strong>dependent variable and its units</strong> across
                the top of the <strong>table</strong>. Put test 1, test 2, and
                test 3 below this.
              </p>
            </div>
          </div>

          <div class="experiment-table-scroll">
            <table
              class="experiment-table reference-table conventional-table"
              aria-label="Example scientific data table"
            >
              <thead>
                <tr>
                  <th class="independent-heading" rowspan="2" scope="col">
                    <strong>Independent variable</strong>
                    <span class="table-units">(<strong>units</strong>)</span>
                  </th>
                  <th class="dependent-heading" colspan="3" scope="colgroup">
                    <strong>Dependent variable</strong>
                    <span class="table-units">(<strong>units</strong>)</span>
                  </th>
                </tr>
                <tr>
                  <th
                    v-for="test in 3"
                    :key="test"
                    class="test-heading"
                    scope="col"
                  >
                    Test {{ test }}
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="condition in 3" :key="condition">
                  <th class="independent-value" scope="row">
                    Condition {{ condition }}
                  </th>
                  <td v-for="test in 3" :key="test"><strong>Data</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <!-- ==================================================
           4. YEAST EXPERIMENT - LABELS, RESULTS, AVERAGES
           ================================================== -->
      <Section ref="labelsSection" name="yeast-labels">
        <!-- Remind students of the testable question -->
        <div class="diagram-box diagram-activity">
          <div class="variable-question floating-title">
            How does changing temperature affect the amount of gas made by
            yeast?
          </div>
        </div>

        <YeastResultsTable @reset="labelsSection?.reset()" />
      </Section>
    </template>
  </Page>
</template>
