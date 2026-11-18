<script setup>
// Loads before the components so its rules keep the cascade order of the old stylesheet.
import "../styles/lesson2.css";
import { computed, ref } from "vue";
import Page from "../components/Page.vue";
import Section from "../components/Section.vue";
import StopAndCheck from "../components/StopAndCheck.vue";
import InvestigationQuestion from "../components/activities/InvestigationQuestion.vue";
import DiscoverVariables from "../components/lesson2/DiscoverVariables.vue";
import BallPairChoice from "../components/lesson2/BallPairChoice.vue";
import PredictionTable from "../components/activities/PredictionTable.vue";
import VariableSort from "../components/activities/VariableSort.vue";
import FairTestBuilder from "../components/lesson2/FairTestBuilder.vue";

// Options passed to the activity components
const sortVariablesOneActivityOptions = {
  answers: {
    independent: "bounce-surface",
    dependent: "bounce-height",
    controlled: [
      "ball-size",
      "ball-material",
      "drop-height",
      "ball-squashiness",
      "number-of-bounces",
      "time-spent-bouncing",
    ],
  },
};

const sortVariablesTwoActivityOptions = {
  answers: {
    independent: "ball-size",
    dependent: "bounce-height",
    controlled: [
      "ball-material",
      "drop-height",
      "ball-squashiness",
      "bounce-surface",
      "number-of-bounces",
      "time-spent-bouncing",
    ],
  },
};

const sortVariablesThreeActivityOptions = {
  options: {
    independent: [
      "ball-size",
      "ball-material",
      "drop-height",
      "ball-squashiness",
      "bounce-surface",
    ],
    dependent: ["bounce-height", "number-of-bounces", "time-spent-bouncing"],
    controlled: [
      "ball-size",
      "ball-material",
      "drop-height",
      "ball-squashiness",
      "bounce-surface",
    ],
  },
};

const dropdownAnswers = [
  "ball size",
  "ball material",
  "drop height",
  "ball squashiness",
  "bounce surface",
  "bounce height",
  "number of bounces",
  "time spent bouncing",
];

// The student's testable question, from <InvestigationQuestion @change>.
// It fills in the prediction table's change / measure and the question
// shown above the variable sort.
const question = ref({
  structure: "",
  firstAnswer: "",
  secondAnswer: "",
  text: "",
});
const testableQuestion = computed(() => question.value.text);
const predictionContext = computed(() => ({
  structure: question.value.structure,
  change: question.value.firstAnswer,
  measure: question.value.secondAnswer,
}));

// One reset button for the question and the prediction
const questionActivity = ref(null);
const predictionActivity = ref(null);
function resetQuestionAndPrediction() {
  questionActivity.value?.reset();
  predictionActivity.value?.reset();
}
import LessonIntro from "../components/LessonIntro.vue";
import Button from "../components/Button.vue";
import ContentBox from "../components/ContentBox.vue";

// Learning objective and success criteria shown in the lesson intro
const objective =
  "We are learning to plan a fair test and draw it as a diagram.";
const criteria = [
  "I can identify <strong>variables</strong> in a fair test.",
  "To plan a fair test, I can select: <ul> <li>The <strong>independent variable</strong> (thing I change),</li> <li>The <strong>dependent variable</strong> (thing I measure) and</li> <li>The <strong>controlled variables</strong> (things I keep the same) </li> </ul>",
  "I can use a diagram to describe my <strong>fair test</strong>",
];

// Terms shown in the vocabulary modal: { word: description }
const glossary = {
  Variable:
    "An aspect of an investigation that can be different or can change.",
  "Independent variable":
    "The one <strong>variable</strong> changed during a <strong>fair test</strong> experiment.",
  "Dependent variable":
    "The result that is observed or measured during a <strong>fair test</strong> experiment.",
  "Controlled variables":
    "The <strong>variables</strong> kept the same so the experiment is fair.",
  "Fair test Experiment":
    "An experiment where one <strong>variable</strong> is changed, one is measured, and all others are kept the same.",
};

// Sections of the page. Order defines the unlock chain (next-id) and which
// sections start locked; override per section where needed.
const sections = [
  {
    id: "discover-variables",
    title: "Planning a ball bounce fair test",
  },
  {
    id: "variable-types",
    title: "Using variables to design a fair test",
  },
  {
    id: "sort-variables-one",
    title:
      "Practice reading a testable question and identifying variables for the fair test",
  },
  {
    id: "sort-variables-two",
    // No heading: Example 2 continues the Example 1 section above
    label: "Sort variables: ball size",
  },
  {
    id: "choose-ball-pair",
    title: "Focus on the independent variable",
  },
  {
    id: "design-question",
    title: "Write your own ball bounce fair test question",
  },
  {
    id: "sort-variables-three",
    title: "Identify all variables for your fair test.",
  },
  {
    id: "build-experiment",
    title: "Build Your Fair Test Plan",
  },
];
</script>

<template>
  <!-- Page renders the vocabulary modal and the hidden teacher menu
       (opened by clicking the lesson title five times). -->
  <Page
    lessonId="lesson2"
    title="Lesson 2 - Planning a Fair Test"
    :sections="sections"
    :glossary="glossary"
  >
    <!-- ==================================================
         LESSON INTRODUCTION
         ================================================== -->
    <template #lesson-intro>
      <LessonIntro
        label="Lesson 2"
        title="Planning a Fair Test"
        worksheet="../worksheets/l2-worksheet.pdf"
        :objective="objective"
        :criteria="criteria"
      >

        <template #title>Planning a <strong>Fair Test</strong></template>

        <template #observation>
          <h2>The fair test rules</h2>

          <p>
            Use a <strong>fair test</strong> to find out if changing one thing
            causes an effect in another thing.
          </p>

          <div class="fair-test-formula">
            <div class="formula-step change">
              <div class="formula-step-number">1</div>
              <div>
                <strong>Change one factor</strong>
                <span>Choose the independent variable.</span>
              </div>
            </div>

            <div class="formula-step measure">
              <div class="formula-step-number">2</div>
              <div>
                <strong>Measure the effect this causes</strong>
                <span>Measure the dependent variable.</span>
              </div>
            </div>

            <div class="formula-step control">
              <div class="formula-step-number">3</div>
              <div>
                <strong>Keep everything else the same</strong>
                <span>Control all other variables.</span>
              </div>
            </div>
          </div>
        </template>
      </LessonIntro>
    </template>

    <template #sections>
      <!-- ==================================================
           2. DISCOVER VARIABLES
           ================================================== -->
      <Section name="discover-variables">
        <DiscoverVariables
          id="discoverVariablesActivity"
          image="../images/lesson2/l2-stw.png"
          image-alt="Bouncing ball investigation showing possible variables"
        >
          <template #intro>
            <ContentBox>
              <p class="activity-instruction">
                The image below shows a mind map for planning a ball bounce
                <strong>fair test</strong>. The <strong>variables</strong> have
                been identified.
              </p>
              <p class="activity-instruction">
                A <strong>variable</strong> is any factor that can vary. For
                example, the size of the ball used could be small or big. These
                factors can affect the result of a <strong>fair test</strong>.
              </p>
              <p class="activity-instruction">
                Use the boxes to type in how each varies or can be different.
                Drop height has been done for you
              </p>
            </ContentBox>
          </template>
          <template #between>
            <ContentBox>
              <p class="activity-instruction">
                Now record the <strong>variables</strong> for the ball bounce
                <strong>fair test</strong> in a table. Use the mind map above to
                help you do this.
              </p>
            </ContentBox>
          </template>
        </DiscoverVariables>
      </Section>
      <!-- ==================================================
          3. VARIABLE TYPES
          ================================================== -->
      <Section name="variable-types">
        <ContentBox>
          <p class="activity-instruction">
            In a <strong>fair test</strong>, you change one
            <strong>variable</strong> and measure the effect this causes on
            another <strong>variable</strong>. You keep all other
            <strong>variables</strong> the same.
          </p>
        </ContentBox>
        <div class="variable-type-grid">
          <ContentBox class="variable-type-card independent">
            <template #eyebrow>Change</template>
            <h3>Independent variable</h3>
            <p>
              Does this <strong>cause</strong> an effect on another
              <strong>variable</strong>?
            </p>
          </ContentBox>
          <ContentBox class="variable-type-card dependent">
            <template #eyebrow>Measure</template>
            <h3>Dependent variable</h3>
            <p>
              To observe the <strong>effect</strong> caused by the thing you
              change.
            </p>
          </ContentBox>
          <ContentBox class="variable-type-card controlled">
            <template #eyebrow>Keep the same</template>
            <h3>Controlled variables</h3>
            <p>
              Be sure that the <strong>effect</strong> you measure can only be
              <strong>caused</strong> by the thing you change.
            </p>
          </ContentBox>
        </div>
        <div class="fair-test-rule">
          We write a testable question to show what is changed and what is
          measured in a <strong>fair test</strong>.
        </div>
        <StopAndCheck class="stop-and-check">
          <template #content>
            In a <strong>fair test</strong>, why is it important to only change
            one <strong>variable</strong>? Why should you keep all other
            <strong>variables</strong> the same? Click the button below to check
            your answer.
          </template>
          <template #answer>
            Only changing one <strong>variable</strong> and keeping all others
            the same means that any effect you measure is caused by the thing
            you changed.
          </template>
        </StopAndCheck>
      </Section>
      <!-- ==================================================
             4. SORT VARIABLES - FLOOR SURFACE
             ================================================== -->
      <Section name="sort-variables-one">
        <div class="diagram-box diagram-activity">
          <p class="activity-instruction">
            Two examples of testable questions are shown below. For each
            example, read the testable question, and then follow steps 1, 2, and
            3 to identify the variables.
          </p>
          <ol class="ol-step-count">
            <li>
              Click on the <strong>Independent Variable</strong> button. Then
              select the <strong>variable</strong> being changed.
            </li>
            <li>
              Click on the <strong>Dependent Variable</strong> button. Then
              select the thing being measured.
            </li>
            <li>
              Click on the <strong>Controlled Variable</strong> button. Then
              select the <strong>variables</strong> that are kept the same to
              make sure it is a <strong>fair test</strong>.
            </li>
          </ol>
        </div>
        <VariableSort
          id="sortVariablesOneActivity"
          :options="sortVariablesOneActivityOptions"
        >
          <template #autofillTestableQuestion>
            <strong>Example 1:</strong>
            How does changing the surface a ball bounces on affect the height it
            will bounce?
          </template>
        </VariableSort>
      </Section>
      <!-- ==================================================
           5. SORT VARIABLES - BALL SIZE
           ================================================== -->
      <Section name="sort-variables-two">
        <VariableSort
          id="sortVariablesTwoActivity"
          :options="sortVariablesTwoActivityOptions"
        >
          <template #autofillTestableQuestion>
            <strong>Example 2:</strong>
            If I change the size of the ball, how will it affect the height of
            the first bounce?
          </template>
        </VariableSort>
      </Section>
      <!-- ==================================================
            6. CHOOSE A FAIR-TEST BALL PAIR
            ================================================== -->
      <Section name="choose-ball-pair">
        <p class="variable-question floating-title">
          Does changing the size of a ball effect the height of the first
          bounce?
        </p>
        <div class="diagram-box diagram-activity">
          <p class="activity-instruction">
            Read the testable question below, and look at the four pictures.
            Select the picture to show how you would set up the independent
            variable for this <strong>fair test</strong>.
          </p>
        </div>
        <BallPairChoice />
      </Section>
      <!-- ==================================================
             DESIGN A QUESTION AND MAKE A PREDICTION
             ================================================== -->
      <Section name="design-question">
        <!-- ================================
         PART 1: INVESTIGATION QUESTION
         ================================ -->
        <InvestigationQuestion
          ref="questionActivity"
          name="investigation-question"
          steps
          :variable-options="dropdownAnswers"
          @change="question = $event"
        >
          <template #autofillTestableQuestion />
        </InvestigationQuestion>
        <!-- ================================
         PART 2: REASONED PREDICTION
         ================================ -->
        <div class="diagram-box diagram-activity">
          <p class="activity-instruction">
            Once we have a <strong>fair test</strong> question (testable
            question) we make a prediction to say what we think will happen.
            Then we give a reason for why we think this. This is called a
            reasoned prediction.
          </p>
        </div>
        <PredictionTable
          ref="predictionActivity"
          name="reasoned-prediction"
          :context="predictionContext"
        />
        <!-- One reset button for both activities -->
        <div class="reset-button-container">
          <Button :is-reset="true" @click="resetQuestionAndPrediction" />
        </div>
      </Section>
      <!-- ==================================================
             OPEN VARIABLE SELECTION
             ================================================== -->
      <Section name="sort-variables-three">
        <div class="diagram-box diagram-activity">
          <p class="activity-instruction">
            What will you change (<strong>Independent variable</strong>)?<br />
            What will you measure (<strong>Dependent variable</strong>)?<br />
            What will you keep the same (<strong>Controlled variables</strong>)?
          </p>
        </div>
        <VariableSort
          id="sortVariablesThreeActivity"
          :options="sortVariablesThreeActivityOptions"
        >
          <template v-if="testableQuestion" #autofillTestableQuestion>
            {{ testableQuestion }}
          </template>
        </VariableSort>
      </Section>
      <!-- ==================================================
           9. DESCRIBE THE FAIR TEST
           ================================================== -->
      <Section name="build-experiment">
        <div class="diagram-box diagram-activity">
          <p class="activity-instruction">
            Follow the steps and watch as your
            <strong>fair test</strong> diagram is created.
          </p>
          <ol class="ol-step-count">
            <li>
              Click on the <strong><i>Change</i></strong> button. Then select
              the <strong><i>independent variable</i></strong> - what you will
              change. If you choose ball material, select which two materials to
              compare.
            </li>
            <li>
              Click on the <strong><i>Measure</i></strong> button. Then select
              the <strong>dependent variable</strong> - what you will measure,
              then choose <strong>how</strong> to measure it.
            </li>
            <li>
              Click on <strong><i>Keep the same</i></strong
              >. Choose a variable to review the shared setting for both
              experiments.
            </li>
          </ol>
        </div>
        <FairTestBuilder />
      </Section>
    </template>
  </Page>
</template>
