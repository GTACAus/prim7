<script setup>
// Load before the components: these styles keep the cascade order of the old stylesheet.
import "../styles/data-tables.css";
import { computed, ref } from "vue";
import Page from "../components/Page.vue";
import Section from "../components/Section.vue";
import LessonIntro from "../components/LessonIntro.vue";
import LessonCard from "../components/LessonCard.vue";
import Grid from "../components/Grid.vue";
import ContentBox from "../components/ContentBox.vue";
import StopAndCheck from "../components/StopAndCheck.vue";
import InvestigationQuestion from "../components/activities/InvestigationQuestion.vue";
import PredictionTable from "../components/activities/PredictionTable.vue";
import BallBounceVariables from "../components/lesson4/BallBounceVariables.vue";
import BallBounceTable from "../components/lesson4/BallBounceTable.vue";

// Terms shown in the vocabulary modal: { word: description }
const glossary = {
  Data: "The observations or measurements you collect during an investigation. Data can be numbers (e.g. temperature, height) or descriptions (e.g. colour, texture).",
  Units:
    "The standard amount or portion of something that is measured, e.g. cm for length, kg for weight, minutes for time.",
  Table: "An organised arrangement of columns and rows used to display data.",
  "Repeat tests":
    "The same test carried out two or more times under exactly the same conditions, to check that your results are consistent.",
  "Independent variable":
    "The one variable changed during a fair test experiment.",
  "Dependent variable":
    "The result that is observed or measured during a fair test experiment.",
};

// Sections of the page. Order defines the unlock chain.
const sections = [
  {
    id: "ball-bounce-variables",
  },
  {
    id: "ball-bounce-planning",
  },
  {
    id: "ball-bounce-tests",
  },
];

// The intro's objectives card
const objective = "Practice planning a fair test and record results in a table";
const criteria = [
  "I can identify variables in a fair test",
  "I can write a testable question and a reasoned prediction",
  "I can record results in a table. Then, I can use the results to check my prediction",
];

// The student's testable question fills in the prediction table's
// change / measure. The prediction appears once the question is done, and
// the "why repeat" block once the prediction is done.
const question = ref({
  structure: "",
  firstAnswer: "",
  secondAnswer: "",
  text: "",
});
const predictionContext = computed(() => ({
  structure: question.value.structure,
  change: question.value.firstAnswer,
  measure: question.value.secondAnswer,
}));
const questionActivity = ref(null);
const predictionActivity = ref(null);
</script>

<template>
  <!-- Page renders the vocabulary modal and the hidden teacher menu
       (opened by clicking the lesson title five times). -->
  <Page
    lessonId="lesson4"
    title="Lesson 4 - Science Inquiry Lab - Skills Check!"
    :sections="sections"
    :glossary="glossary"
  >
    <!-- ==================================================
         LESSON INTRODUCTION
         ================================================== -->
    <template #lesson-intro>
      <LessonIntro
        label="Lesson 4"
        title="Science Inquiry Lab - Skills Check!"
        worksheet="../worksheets/l4-worksheet.pdf"
      >
        Practice what you have learned by doing a ball bounce experiment

        <template #mission>
          <LessonCard class="objectives-card">
            <template #eyebrow>
              <p>Learning intention</p>
            </template>
            <template #content>
              <p class="learning-objective-text">{{ objective }}</p>

              <p class="success-heading">Success criteria</p>
              <ol class="objective-list">
                <li v-for="item in criteria" :key="item">{{ item }}</li>
              </ol>
            </template>
          </LessonCard>

          <Grid :cols="2" gap="lg">
            <LessonCard class="observation-card">
              <template #eyebrow>
                <p>Think like a scientist</p>
              </template>
              <template #content>
                <h2>The Fair-Test Formula</h2>
                <p>
                  A <strong>fair test</strong> experiment helps us to find out
                  if changing one thing causes a measureable effect in another
                  thing.
                </p>
                <div class="formula-card">
                  <div class="formula-step">
                    <div class="formula-step-number">1</div>
                    <div>
                      <strong>Change one factor</strong>
                      <span>Choose the independent variable.</span>
                    </div>
                  </div>
                  <div class="formula-step">
                    <div class="formula-step-number">2</div>
                    <div>
                      <strong>Measure the effect this causes</strong>
                      <span>Measure the dependent variable.</span>
                    </div>
                  </div>
                  <div class="formula-step">
                    <div class="formula-step-number">3</div>
                    <div>
                      <strong>Keep everything else the same</strong>
                      <span>Control all other variables.</span>
                    </div>
                  </div>
                </div>
              </template>
            </LessonCard>

            <LessonCard class="observation-card">
              <template #eyebrow>
                <p>Think like a scientist</p>
              </template>
              <template #content>
                <h2>Scientific Table Formula</h2>
                <p>
                  When scientists carry out fair tests, they use tables to
                  record
                  <strong>data</strong>. This helps them to see patterns,
                  trends, and relationships in the <strong>data</strong>.
                </p>
                <div class="formula-card">
                  <div class="formula-step">
                    <div class="formula-step-number">1</div>
                    <div>
                      <strong
                        >The independent variable and how you will change
                        it</strong
                      >
                      <span
                        >This goes in the left-hand column of the table</span
                      >
                    </div>
                  </div>
                  <div class="formula-step">
                    <div class="formula-step-number">2</div>
                    <div>
                      <strong
                        >The dependent variable and the measurements you
                        make</strong
                      >
                      <span>Put in the column to the right</span>
                    </div>
                  </div>
                  <div class="formula-step">
                    <div class="formula-step-number">3</div>
                    <div>
                      <strong>Repeat each test three times</strong>
                      <span>
                        Record each repeat as test 1, test 2, and test 3. This
                        helps you to spot errors should they occur
                      </span>
                    </div>
                  </div>
                </div>
              </template>
            </LessonCard>
          </Grid>
        </template>
      </LessonIntro>
    </template>

    <template #sections>
      <ContentBox class="step-sections">
        <h2 class="step-heading-title">
          Practice planning a fair test
        </h2>
        <!-- ==================================================
             1. SETUP AND VARIABLES
             ================================================== -->
        <Section name="ball-bounce-variables" :show-complete-note="false">
          <div class="step-card setup-card">
            <div class="step-heading">
              <span>1</span>
              <div>
                <h3>Look at the diagram showing a ball bounce fair test</h3>
              </div>
            </div>
            <p class="step-instruction">
              A table tennis ball is dropped from the same height onto two
              different surfaces. The number of bounces is counted until the
              ball stops.
            </p>
            <div class="ball-bounce-setup-image">
              <img
                src="../images/lesson4/Ball Bounce.png"
                alt="Ball bounce experiment setup"
              />
            </div>
          </div>
          <BallBounceVariables
            name="ball-bounce-variables"
            class="step-card variables-card"
          >
            <div class="step-heading">
              <span>2</span>
              <div>
                <h3>Identify the variables in the ball bounce fair test</h3>
              </div>
            </div>
            <p class="step-instruction">
              Complete the table to identify what is changed, what is measured,
              and what needs to stay the same.
            </p>
          </BallBounceVariables>
        </Section>
        <!-- ==================================================
             2. TESTABLE QUESTION, PREDICTION, WHY REPEAT
             ================================================== -->
        <Section name="ball-bounce-planning" :show-complete-note="false">
          <div class="step-card planning-card">
            <div class="step-heading">
              <span>3</span>
              <div>
                <h3>Write a testable question for this ball bounce experiment</h3>
              </div>
            </div>
            <p class="step-instruction">
              Click on one of the four sentence structures, then enter the
              <strong>independent variable</strong> (what is being changed) and
              <strong>dependent variable</strong> (what is being measured) for
              your ball-bounce experiment.
            </p>
            <InvestigationQuestion
              ref="questionActivity"
              name="ball-bounce-question"
              input-type="text"
              :steps="true"
              @change="question = $event"
            />
            <PredictionTable
              v-if="questionActivity?.isComplete"
              ref="predictionActivity"
              name="ball-bounce-prediction"
              class="pop-in"
              :context="predictionContext"
              change-label="What is being changed?"
              measure-label="What is being measured?"
            >
              <template #before>
                <div
                  class="step-heading step-divider prediction-heading"
                >
                  <span>4</span>
                  <div>
                    <h3>Make a reasoned prediction</h3>
                  </div>
                </div>
                <p class="step-instruction">
                  Use this graphic organiser to make a reasoned prediction.
                </p>
              </template>
            </PredictionTable>
            <div
              v-if="predictionActivity?.isComplete"
              class="repeat-tests-inline step-divider pop-in"
            >
              <div class="repeat-tests-card">
                <div class="repeat-tests-explanation">
                  <h3>Why do we repeat a fair test 3 times?</h3>
                  <p>
                    In a fair test, we repeat each test
                    <strong>3 times</strong> for the soft surface and for the hard
                    surface.
                  </p>
                  <p>We do this to:</p>
                  <ul>
                    <li>Check for mistakes when setting up each test.</li>
                    <li>Check for errors when making measurements.</li>
                    <li>Spot any strange results.</li>
                    <li>Make the results more reliable and trustworthy.</li>
                  </ul>
                </div>
                <div class="repeat-tests-example">
                  <h3>The student repeated the fair test 3 times.</h3>
                  <p>
                    Look at the results for three repeats on the soft surface.
                    Can you spot any mistakes or strange results?
                  </p>
                  <img
                    class="repeat-tests-image"
                    src="../images/lesson4/Repeat Tests.png"
                    alt="Diagram showing three table tennis-ball bounce tests on grass, with one unusual result"
                  />
                </div>
              </div>
              <StopAndCheck name="why-repeat-check">
                <template #content>
                  <p>
                    Look at the diagram above.
                  </p>
                  <p>
                    <strong
                      >Why is it important to repeat a test 3 times?</strong
                    >
                  </p>
                  <p>
                    <strong
                      >What would happen if you only did the first test?</strong
                    >
                  </p>
                </template>
                <template #answer>
                  Repeating a test helps us to spot mistakes or strange results.
                  <br />
                  If we used the first result, it is not accurate. It hit
                  something hard that made it bounce more.
                </template>
              </StopAndCheck>
            </div>
          </div>
        </Section>
        <!-- ==================================================
             3. OBSERVE, RECORD, INTERPRET
             ================================================== -->
        <Section name="ball-bounce-tests" :show-complete-note="false">
          <BallBounceTable class="step-card tests-card">
            <div class="step-heading observation-heading">
              <span>5</span>
              <div>
                <h3>Record results for the ball bounce fair test</h3>
              </div>
            </div>
            <p class="step-instruction">
              Watch both videos and record the number of bounces from each test
              in your data table below.
            </p>
          </BallBounceTable>
        </Section>
      </ContentBox>
    </template>
  </Page>
</template>

<style>
/* Lesson 4 layout: numbered step cards inside each section.
   (Global, not scoped: the cards wrap activity components.) */
.step-sections {
  /* padding: 0; */
  position: relative;

  margin-bottom: 38px;
  padding: 28px;

  background: var(--paper);

  animation: pop-fade-in 0.5s ease;
}
.step-sections > * {
  border: none;
  box-shadow: none;
  margin: 0;
  padding: 0;
}

.step-heading-title {
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

/* ---------- Step cards ---------- */

.step-card {
  margin-bottom: 20px;
  padding: 24px;

  background: var(--paper);
  border: 2px solid var(--charcoal);
  border-radius: 20px;
  box-shadow: var(--shadow-small);
}

.step-card.setup-card {
  border-top: 8px solid var(--blue);
}

.step-card.variables-card {
  border-top: 8px solid var(--yellow);
}

.step-card.planning-card {
  border-top: 8px solid var(--purple);
}

.step-card.tests-card {
  border-top: 8px solid var(--mint);
}

/* tells students the question blanks are for them to fill in */
.question-fill-instruction {
  margin: 0 0 14px;
  padding: 10px 14px;

  background: var(--soft-yellow);
  border: 2px solid var(--charcoal);
  border-radius: 12px;

  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.5;
}

/* separates the stages inside one card */
.step-divider {
  margin-top: 28px;
  padding-top: 28px;
  border-top: 2px dashed var(--line);
}

/* ---------- Step headings ---------- */

.step-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.step-heading > span {
  display: grid;
  place-items: center;
  flex: 0 0 auto;

  min-width: 38px;
  height: 38px;
  padding: 0 8px;
  box-sizing: border-box;

  background: var(--blue);
  border: 2px solid var(--charcoal);
  border-radius: 999px;

  font-weight: 700;
}

.step-heading.prediction-heading > span {
  background: var(--lavender);
}

.step-heading.observation-heading > span {
  background: var(--soft-green);
}

.step-heading h3 {
  margin: 0;
  color: var(--text);
  font-size: 1.15rem;
}

.step-eyebrow {
  margin: 0 0 3px;

  color: var(--purple);

  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.step-instruction {
  margin: 0 0 18px 50px;
  color: var(--muted);
  line-height: 1.5;
}

/* ---------- Setup image ---------- */

.ball-bounce-setup-image {
  margin-top: 18px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: var(--soft-blue);
  border: 2px dashed var(--charcoal);
  border-radius: 16px;
}

.ball-bounce-setup-image img {
  display: block;
  width: 100%;
  max-width: 700px;
  height: auto;
  border-radius: 12px;
}

/* ---------- Why repeat each test ---------- */

.repeat-tests-card {
  display: grid;
  grid-template-columns: 1fr 3fr;
  gap: 18px;
}

.repeat-tests-explanation,
.repeat-tests-example {
  padding: 22px;

  background: white;
  border: 2px solid var(--charcoal);
  border-radius: 18px;
  box-shadow: var(--shadow-small);
}

.repeat-tests-explanation {
  border-top: 8px solid var(--blue);
}

.repeat-tests-example {
  border-top: 8px solid var(--yellow);
}

.repeat-tests-explanation p,
.repeat-tests-example p {
  margin: 0 0 12px;
  line-height: 1.55;
}

.repeat-tests-explanation ul {
  margin: 12px 0 0;
  padding-left: 24px;
}

.repeat-tests-explanation li {
  margin-bottom: 9px;
  line-height: 1.45;
}

.repeat-tests-example h3 {
  margin: 4px 0 12px;
}

.repeat-tests-label {
  margin: 0;

  color: var(--purple);

  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.repeat-tests-image {
  display: block;
  width: 100%;
  margin: 18px auto 0;
  border: 2px solid var(--charcoal);
  border-radius: 14px;
}

@media (max-width: 900px) {
  .repeat-tests-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .step-card {
    padding: 18px;
  }

  .step-instruction {
    margin-left: 0;
  }
}
</style>
