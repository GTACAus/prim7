<script setup>
import Page from "../components/Page.vue";
import Section from "../components/Section.vue";
import Flashcards from "../components/lesson1/Flashcards.vue";
import QuestionWheel from "../components/lesson1/QuestionWheel.vue";
import PredictionTests from "../components/lesson1/PredictionTests.vue";
import PredictionTable from "../components/activities/PredictionTable.vue";
import LessonIntro from "../components/LessonIntro.vue";
import LessonCard from "../components/LessonCard.vue";
import ThinkBox from "../components/ThinkBox.vue";

import { openVideo } from "../composables/useModal.js";

// Learning objective and success criteria shown in the lesson intro
const objective =
  "We are learning to:<br>1. Ask <strong>testable questions</strong> and<br>2. Make <strong>reasoned predictions</strong> for a scientific experiment.";
const criteria = [
  "I can classify whether a <strong>question</strong> is testable or untestable",
  "I can write a <strong>testable question</strong>",
  "I can make <strong>predictions</strong> and give a reason for my choice",
];

// Terms shown in the vocabulary modal: { word: description }
const glossary = {
  Experiment:
    "A test scientists carry out to answer a testable question by changing one thing and measuring the effect it has on something else.",
  Question:
    "Something you are curious about after making an observation. In science, a good question leads to an investigation.",
  Observation:
    "Something you notice happening by using your senses, such as seeing, hearing, or feeling. In science, observations help you ask questions and understand what is happening.",
  Prediction:
    "An educated guess about what the result of an experiment will be, based on your knowledge of the relationship between two things.",
  "Reasoned Prediction":
    "A prediction that is based on scientific knowledge and evidence, explaining why a particular outcome is expected.",
  Measure:
    "To observe and record the effect that a change has on something. This is the result you collect during an experiment using a tool or method such as a ruler, stopwatch, or scale.",
  Change:
    "To make something different from what it was. In an experiment, this is the one thing you deliberately adjust to see what effect it has on something else.",
  "Testable question":
    "A question that can be answered by doing an experiment where you change something and measure the effect it has on something else.",
  "Untestable question":
    "A question that cannot be answered through an experiment, usually because it is based on personal opinion or cannot be measured.",
};

// Experiments for the "test reasoned predictions" activity
const predictionTests = [
  {
    title: "Changing the ramp angle",
    question:
      "Does <strong>changing</strong> the angle of the ramp <strong>affect</strong> how far the car travels?",
    prediction:
      "If I <strong>increase the angle of the ramp</strong>, then this will <strong>increase how far the car will travel</strong>. This is because the car gains more speed travelling down the ramp.",
    image: "../images/lesson1/l1-example1.png",
    answer: "true",
    correct:
      "It is supported. Increasing the angle of the ramp causes the car to travel further.",
    incorrect:
      "Try again. The results show that increasing the angle of the ramp causes the car to travel further.",
  },
  {
    title: "Changing the car colour",
    question:
      "Does <strong>changing</strong> the colour of a car <strong>affect</strong> how far the car travels?",
    prediction:
      "If I <strong>change the colour of the car from blue to red</strong>, then <strong>the distance the car travels will stay the same</strong>. This is because colour does not affect how fast the car travels down the ramp.",
    image: "../images/lesson1/l1-example2.png",
    answer: "true",
    correct:
      "It is supported because the results show that both cars travel the same distance.",
    incorrect:
      "Try again. The results show that both cars travel the same distance.",
  },
  {
    title: "Changing the size of the car",
    question:
      "If we <strong>change</strong> the size of a car, how does this <strong>affect</strong> the distance it travels?",
    prediction:
      "If I <strong>increase the size of the car</strong>, then <strong>the distance the car travels will decrease</strong>. This is because bigger objects stop rolling sooner.",
    image: "../images/lesson1/l1-example3.png",
    answer: "false",
    correct:
      "It is not supported. The bigger car travels further than the smaller car.",
    incorrect:
      "Try again. The results show that the bigger car travels further than the smaller car.",
  },
  {
    title: "Changing the wheel size",
    question:
      "How does <strong>changing</strong> the size of a car's wheels <strong>affect</strong> the distance it will travel?",
    prediction:
      "If I <strong>increase the size of the car's wheels</strong>, then <strong>the distance the car travels will increase</strong>. This is because bigger wheels will make it travel faster.",
    image: "../images/lesson1/l1-example4.png",
    answer: "false",
    correct:
      "It is not supported because the results show that the car with smaller wheels travels further than the car with bigger wheels.",
    incorrect:
      "Try again. The results show that the car with smaller wheels travels further than the car with bigger wheels.",
  },
];

const stwGroups = [
  {
    key: "see",
    title: "See",
    prompt: "What do you notice?",
    placeholder: "Type something you see",
  },
  {
    key: "think",
    title: "Think",
    prompt: "What do you think is happening?",
    placeholder: "Type what you think",
  },
  {
    key: "wonder",
    title: "Wonder",
    prompt: "What questions do you have?",
    placeholder: "Type what you wonder",
  },
];

// Choices in the reasoned prediction builder
const changeOptions = [
  "the angle of the ramp",
  "the colour of the car",
  "the size of the car",
  "the size of the car's wheels",
];
const measureOptions = ["the distance the car travels"];

// Sections of the page. Order defines the unlock chain (next-id) and which
// sections start locked; override per section where needed.
const sections = [
  {
    id: "observe-experiment",
    title: "Observe the Experiment",
  },
  {
    id: "testable-question-intro",
    title:
      "Learn how to identify a testable question that can be used in an experiment",
  },
  {
    id: "flashcards",
    title: "Practice identifying if a question is testable or untestable",
    label: "Testable or non-testable?",
  },
  {
    id: "testable-questions",
    title: "How do we write testable questions?",
  },
  {
    id: "reasoned-prediction",
    title: "Writing a Reasoned Prediction",
  },
  {
    id: "reasoned-builder",
    title: "Make a Reasoned Prediction",
  },
  {
    id: "testing-predictions",
    title: "Testing our reasoned predictions",
  },
];
</script>
<template>
  <Page
    lessonId="lesson1"
    title="Lesson 1 - Questioning and Predicting"
    :sections="sections"
    :glossary="glossary"
  >
    <template #lesson-intro>
      <LessonIntro
        label="Lesson 1"
        title="Questioning and Predicting"
        worksheet="../worksheets/l1-worksheet.pdf"
        :objective="objective"
        :criteria="criteria"
      >

        <template #observation>
          <h2>See, Think, Wonder</h2>
          <p>
            As scientists we are curious. We observe the world around us. We ask
            <strong>questions</strong> about how the world works. To do this we
            can use a thinking tool called <strong>See, Think, Wonder</strong>.
            Follow these steps to make <strong>observations</strong> and ask
            <strong>questions</strong>:
          </p>
          <div class="stw-explanation">
            <div>
              <strong>See</strong>
              <span>What do you notice?</span>
            </div>
            <div>
              <strong>Think</strong>
              <span>What do you think is happening?</span>
            </div>
            <div>
              <strong>Wonder</strong>
              <span>What questions do you have?</span>
            </div>
          </div>
        </template>
      </LessonIntro>
    </template>

    <template #sections>
      <!-- ---------- Explicit Teaching: Introduction Image ---------- -->
      <Section name="observe-experiment">
        <div class="diagram-box diagram-activity">
          <p class="activity-instruction">
            Look at the image below. It shows a fair test being done. Use the
            <strong><i>See, Think, Wonder</i></strong> tool to make
            <strong>observations</strong> and ask <strong>questions</strong>.
          </p>
        </div>
        <div class="observe-experiment-grid">
          <div class="image-box">
            <img src="../images/lesson1/l1-default.png" alt="Toy car example" />
          </div>
          <ThinkBox class="lesson1-stw-box" :groups="stwGroups" />
        </div>
      </Section>
      <!-- ---------- Explicit Teaching: What is a Testable Question? ---------- -->
      <Section name="testable-question-intro">
        <div class="diagram-box diagram-activity">
          <p>
            You came up with some questions in the see, think, wonder activity.
            Now learn how to turn these into testable questions.
          </p>
          <h3>What is a testable question?</h3>
          <p class="activity-instruction">
            It is answered by doing an experiment. You change one thing and
            <strong>measure</strong> the effect on something else. It explores
            the relationship between two different things. Compare the rules for
            a testable and an untestable question below.
          </p>
        </div>
        <div class="intro-grid question-comparison-grid">
          <LessonCard class="testable-card">
            <template #eyebrow>
              <p>Testable questions</p>
            </template>
            <template #content>
              <ul>
                <li>
                  Can be answered by doing an <strong>experiment</strong>.
                </li>
                <li>Explore the relationship between two things.</li>
                <li>
                  One thing is <strong>changed</strong>, and the effect is
                  <strong>measured</strong>.
                </li>
              </ul>
            </template>
          </LessonCard>
          <LessonCard class="untestable-card">
            <template #eyebrow>
              <p>Untestable questions</p>
            </template>
            <template #content>
              <ul>
                <li>
                  Cannot be answered using an <strong>experiment</strong>.
                </li>
                <li>May be answered using personal opinions.</li>
                <li>
                  Are not done by <strong>changing</strong> only one thing. So
                  you cannot <strong>measure</strong> its effect on another
                  thing.
                </li>
              </ul>
            </template>
          </LessonCard>
        </div>
        <div class="diagram-box diagram-activity question-example-intro">
          <p class="activity-instruction">
            Look at the four questions below for the cars rolling down ramps
            experiment. Learn to identify what makes a question testable.
          </p>
        </div>
        <div class="intro-grid question-example-grid">
          <LessonCard class="testable-card">
            <template #eyebrow>
              <p>Testable question</p>
            </template>
            <template #content>
              <p class="example-question">
                Does changing the angle of the ramp affect how far the car
                travels?
              </p>
              <div class="question-check-list">
                <div class="question-check-row">
                  <span class="question-check-icon correct">✓</span>
                  <div>
                    <strong>Is something being changed?</strong>
                    <p>Yes. The angle of the ramp is changed.</p>
                  </div>
                </div>
                <div class="question-check-row">
                  <span class="question-check-icon correct">✓</span>
                  <div>
                    <strong>Can the effect be measured?</strong>
                    <p>Yes. Measure the distance the car travels.</p>
                  </div>
                </div>
              </div>
            </template>
          </LessonCard>
          <LessonCard class="untestable-card">
            <template #eyebrow>
              <p>Untestable question</p>
            </template>
            <template #content>
              <p class="example-question">
                Does changing the angle of the ramp affect how much fun the car
                has?
              </p>
              <div class="question-check-list">
                <div class="question-check-row">
                  <span class="question-check-icon correct">✓</span>
                  <div>
                    <strong>Is something being changed?</strong>
                    <p>Yes. The angle of the ramp is changed.</p>
                  </div>
                </div>
                <div class="question-check-row">
                  <span class="question-check-icon incorrect">×</span>
                  <div>
                    <strong>Can the effect be measured?</strong>
                    <p>No. Fun is based on personal opinion.</p>
                  </div>
                </div>
              </div>
            </template>
          </LessonCard>
          <LessonCard class="testable-card">
            <template #eyebrow>
              <p>Testable question</p>
            </template>
            <template #content>
              <p class="example-question">
                What will changing the size of the car do to the distance the
                car travels?
              </p>
              <div class="question-check-list">
                <div class="question-check-row">
                  <span class="question-check-icon correct">✓</span>
                  <div>
                    <strong>Is something being changed?</strong>
                    <p>Yes. The size of the car is changed.</p>
                  </div>
                </div>
                <div class="question-check-row">
                  <span class="question-check-icon correct">✓</span>
                  <div>
                    <strong>Can the effect be measured?</strong>
                    <p>Yes. Measure the distance the car travels.</p>
                  </div>
                </div>
              </div>
            </template>
          </LessonCard>
          <LessonCard class="untestable-card">
            <template #eyebrow>
              <p>Untestable question</p>
            </template>
            <template #content>
              <p class="example-question">How far does the red car travel?</p>
              <div class="question-check-list">
                <div class="question-check-row">
                  <span class="question-check-icon incorrect">×</span>
                  <div>
                    <strong>Is something being changed?</strong>
                    <p>No. Nothing is changed.</p>
                  </div>
                </div>
                <div class="question-check-row">
                  <span class="question-check-icon correct">✓</span>
                  <div>
                    <strong>Can the effect be measured?</strong>
                    <p>Yes. The distance the car travels can be measured.</p>
                  </div>
                </div>
              </div>
            </template>
          </LessonCard>
        </div>
      </Section>
      <!-- ---------- Flashcards ---------- -->
      <Section name="flashcards">
        <div class="flashcards-learning-grid">
          <Flashcards />
          <LessonCard class="testable-card testable-question-guide">
            <template #eyebrow>
              <p>Testable question guide</p>
            </template>
            <template #content>
              <h3>What makes a question testable?</h3>
              <div class="question-check-list">
                <div class="question-check-row">
                  <span
                    class="question-check-icon question-guide-icon"
                    aria-hidden="true"
                    >1</span
                  >
                  <div>
                    <strong>Is something being changed?</strong>
                    <p>A fair test changes one thing.</p>
                  </div>
                </div>
                <div class="question-check-row">
                  <span
                    class="question-check-icon question-guide-icon"
                    aria-hidden="true"
                    >2</span
                  >
                  <div>
                    <strong>Can the effect be measured?</strong>
                    <p>Look for a result you can observe or measure.</p>
                  </div>
                </div>
              </div>
            </template>
          </LessonCard>
        </div>
      </Section>
      <!-- Part C: How do we write testable questions? -->
      <Section name="testable-questions">
        <div class="diagram-box diagram-activity">
          <p class="activity-instruction">
            A <strong>testable question</strong> describes two things:
          </p>
          <ol>
            <li>What is being <strong>changed</strong> and</li>
            <li>What is being <strong>measured</strong>.</li>
          </ol>
          <p>
            <strong>Testable questions</strong> begin with words like
            <strong><i>What, How, Does and If</i></strong
            >.
          </p>
        </div>
        <QuestionWheel next-button-id="testableQuestionsNextButton" />
      </Section>
      <Section name="reasoned-prediction">
        <div class="diagram-box diagram-activity">
          <p class="activity-instruction">
            You have a <strong>testable question</strong>. Next you make a
            <strong>reasoned prediction</strong>. State what you think the
            result will be. Then provide a reason for your choice.
          </p>
          <p class="activity-instruction">
            In a <strong>reasoned prediction</strong> you make an educated
            guess. This is based on your knowledge about the relationship
            between two things. The thing you <strong>change</strong> and the
            thing you will <strong>measure</strong>.
          </p>
          <p class="activity-instruction">
            You can use a graphic organiser to help you write a
            <strong>reasoned prediction</strong>.
          </p>
        </div>
        <!-- <div class="diagram-box diagram-activity"> -->
        <div class="prediction-organiser">
          <div class="prediction-organiser-row row-header">
            <div class="prediction-organiser-cell">
              <span class="cell-sublabel" data-template-id="org-col-tq-label"
                >Testable question:</span
              >
            </div>
            <div class="prediction-organiser-cell">
              <span
                class="cell-sublabel"
                data-template-id="org-col-change-label"
                >Change this</span
              >
            </div>
            <div class="prediction-organiser-cell">
              <span
                class="cell-sublabel"
                data-template-id="org-col-measure-label"
                >Measure this</span
              >
            </div>
          </div>
          <!-- Relationship row -->
          <div class="prediction-organiser-row row-relationship">
            <div class="prediction-organiser-cell cell-label">
              <span class="cell-sublabel" data-template-id="org-row-rel-label"
                >Relationship:</span
              >
              <span
                class="cell-helper"
                data-template-id="org-row-rel-label"
              ></span>
            </div>
            <div class="prediction-organiser-cell">
              <span class="cell-sublabel" data-template-id="org-cause-label"
                >Cause</span
              >
              <span class="cell-helper" data-template-id="org-cause-helper"
                >increase / decrease<br />
                with / without<br />
                condition 1 versus condition 2</span
              >
            </div>
            <div class="prediction-organiser-cell">
              <span class="cell-sublabel" data-template-id="org-effect-label"
                >Effect (result)</span
              >
              <span class="cell-helper" data-template-id="org-effect-helper"
                >increase / decrease / stay the same<br
              /></span>
            </div>
          </div>
          <!-- Prediction row -->
          <div class="prediction-organiser-row row-prediction">
            <div class="prediction-organiser-cell cell-label">
              <span class="cell-sublabel" data-template-id="org-row-pred-label"
                >Prediction:</span
              >
            </div>
            <div class="prediction-organiser-cell">
              <span class="cell-helper" data-template-id="org-pred-if"
                >If I do this</span
              >
            </div>
            <div class="prediction-organiser-cell">
              <span class="cell-helper" data-template-id="org-pred-then"
                >then this will happen</span
              >
            </div>
          </div>
          <!-- Reason row -->
          <div class="prediction-organiser-row row-reason">
            <div class="prediction-organiser-cell cell-label">
              <span
                class="cell-sublabel"
                data-template-id="org-row-reason-label"
                >Reason:</span
              >
            </div>
            <div class="prediction-organiser-cell span-2">
              <span class="cell-helper" data-template-id="org-reason-body"
                >This is because…</span
              >
            </div>
          </div>
          <!-- Reasoned prediction row -->
          <div class="prediction-organiser-row row-full">
            <div class="prediction-organiser-cell cell-label">
              <span class="cell-sublabel" data-template-id="org-row-full-label"
                >Reasoned prediction:</span
              >
            </div>
            <div class="prediction-organiser-cell span-2">
              <span class="cell-helper" data-template-id="org-full-body"
                >If I do this then this will happen. This is because of
                this.</span
              >
            </div>
          </div>
        </div>
      </Section>
      <!-- ---------- Reasoned Prediction Builder ---------- -->
      <Section name="reasoned-builder">
        <div class="diagram-box diagram-activity">
          <div class="prediction-video-layout">
            <div class="prediction-video-instructions">
              <p class="activity-instruction">
                Follow these steps to create a
                <strong>reasoned prediction</strong>:
              </p>
              <ol>
                <li>Choose your testable question.</li>
                <li>
                  <strong>Watch the video</strong> to learn how to make a
                  reasoned prediction.
                </li>
                <li>
                  Use the graphic organiser to write your prediction and reason.
                </li>
              </ol>
            </div>
            <button
              type="button"
              class="prediction-video-button"
              aria-label="Watch the reasoned prediction video"
              @click="
                openVideo(
                  '../videos/lesson1/reasoned-prediction-v2.mp4',
                  'Reasoned prediction video',
                )
              "
            >
              <span class="prediction-video-play" aria-hidden="true">▶</span>
              <span class="prediction-video-label"
                ><strong>Watch the video</strong></span
              >
            </button>
          </div>
        </div>
        <PredictionTable
          :change-options="changeOptions"
          :measure-options="measureOptions"
          show-reset
        />
      </Section>
      <!-- ---------- Testing Reasoned Predictions ---------- -->
      <Section name="testing-predictions">
        <div class="diagram-box diagram-activity">
          <p class="activity-instruction">
            To test a <strong>reasoned prediction</strong>, you do an
            <strong>experiment</strong>. Look at the results of these four
            experiments done by students.<br />
            Decide if their reasoned predictions are:
          </p>
          <ol>
            <li><strong>Supported</strong></li>
            <li><strong>Unsupported</strong></li>
          </ol>
          <p>
            Unsupported results still teach you something. That is what science
            is about!
          </p>
        </div>
        <PredictionTests :tests="predictionTests" />
      </Section>
    </template>
  </Page>

  <!-- Question Wheel Script -->
</template>

<style>
/* Lesson 1-specific styles only */

ol li::marker {
  color: var(--purple);
  font-weight: 700;
}

/* ==================================================
        REASONED PREDICTION ORGANISER
        ================================================== */
.prediction-organiser {
  border: 3px solid var(--line);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 5px 0 var(--line);
}

/* Each row is a horizontal stripe */
.prediction-organiser-row {
  display: grid;
  grid-template-columns: clamp(80px, 18vw, 180px) minmax(0, 1fr) minmax(0, 1fr);
  border-bottom: 2px solid var(--line);
}

.prediction-organiser-row:last-child {
  border-bottom: none;
}

.prediction-organiser-cell {
  padding: 14px 18px;
  font-size: 0.95rem;
  line-height: 1.55;
  border-right: 2px solid var(--line);
}

.prediction-organiser-cell:last-child {
  border-right: none;
}

/* Row-type colour bands */
.row-header {
  background: var(--purple);
}

.row-header .prediction-organiser-cell {
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
}

.row-question {
  background: var(--soft-blue);
}

.row-relationship {
  background: var(--soft-yellow);
}

.row-prediction {
  background: var(--soft-green);
}

.row-reason {
  background: var(--soft-purple);
}

.row-full {
  background: var(--card);
}

/* Span-2 cell (no right border on the spanning cell) */
.prediction-organiser-cell.span-2 {
  grid-column: span 2;
  border-right: none;
}

/* Label column — always slightly darker */
.cell-label {
  background: rgba(0, 0, 0, 0.04);
  font-weight: 700;
  overflow-wrap: break-word;
}

/* sub-labels inside cells */
.cell-sublabel {
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--purple);
  margin-bottom: 4px;
}

.row-header .cell-sublabel {
  color: var(--cream);
}

/* italic helper lines */
.cell-helper {
  display: block;
  font-size: 0.88rem;
  color: var(--muted);
  font-style: italic;
  line-height: 1.5;
}

/* ==================================================
   LESSON 1 ACTIVITIES
   
   Question wheel, testable-question cards and the
   testing-reasoned-predictions examples.
   Used only by lesson1/lesson1.html.
   ================================================== */

.testable-card {
  background: color-mix(in srgb, var(--soft-green) 50%, white 50%);
  border-top: 10px solid var(--green);
}

.untestable-card {
  background: color-mix(in srgb, var(--soft-orange) 20%, white 80%);
  border-top: 10px solid var(--orange);
}

.question-check-list {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.question-check-row {
  display: grid;
  grid-template-columns: 34px 1fr;
  align-items: start;
  gap: 12px;

  padding: 14px 16px;

  background: var(--soft-yellow);
  border: 2px solid var(--line);
  border-radius: 14px;

  box-shadow: 0 3px 0 rgba(48, 51, 47, 0.18);
}

.question-check-icon {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 28px;
  height: 28px;

  border: 2px solid var(--line);
  border-radius: 8px;

  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
}

.question-check-row strong {
  display: block;
  margin-bottom: 5px;

  color: var(--text);
}

.question-check-row p {
  margin: 0;

  color: var(--text);
  line-height: 1.5;
}

/* Moved from prim7 lesson1.css: STW grid, flashcard guide, prediction video */
/* ==================================================
        OBSERVATION AND TESTABLE-QUESTION ACTIVITIES
        ================================================== */

.observe-experiment-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(290px, 0.85fr);
  align-items: stretch;
  gap: 20px;
}

#observe-experiment .image-box,
#observe-experiment .lesson1-stw-box {
  min-width: 0;
  min-height: 480px;
  margin: 20px 0;
}

#observe-experiment .image-box {
  display: flex;
  align-items: center;
  justify-content: center;
}

#observe-experiment .image-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.lesson1-stw-box {
  display: flex;
  flex-direction: column;
  background: var(--soft-yellow);
  border: 3px solid var(--line);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 5px 0 var(--line);
}

.lesson1-stw-box .stw-column {
  flex: 1;
  padding: 14px 16px;
  border-bottom: 2px dashed rgba(48, 51, 47, 0.32);
}

.lesson1-stw-box .stw-column:last-child {
  border-bottom: none;
}

.lesson1-stw-box .stw-column h3 {
  margin: 0 0 6px;
  color: var(--purple);
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
}

.lesson1-stw-box .stw-column p {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 0.85rem;
}

.lesson1-stw-box .stw-input-row {
  display: flex;
  gap: 8px;
}

.lesson1-stw-box .stw-input-row input {
  flex: 1;
  width: 100%;
  min-width: 0;
  margin-bottom: 8px;
  padding: 9px 10px;
  background: white;
  color: var(--text);
  border: 2px solid var(--line);
  border-radius: 12px;
  box-shadow: inset 0 -2px 0 rgba(48, 51, 47, 0.09);
  font: inherit;
}

.lesson1-stw-box .stw-input-row input:focus {
  outline: 3px solid rgba(78, 50, 232, 0.18);
  border-color: var(--purple);
}

.lesson1-stw-box .stw-input-row button {
  align-self: flex-start;
  padding: 9px 12px;
  color: white;
  background: var(--green);
  border: 2px solid var(--line);
  border-radius: 12px;
  box-shadow: 0 3px 0 var(--line);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.lesson1-stw-box .stw-input-row button:hover {
  background: var(--purple);
}

.lesson1-stw-box .stw-list {
  margin: 6px 0 0;
  padding: 0;
  color: var(--text);
  font-size: 0.9rem;
  line-height: 1.4;
  list-style: none;
}

.lesson1-stw-box .stw-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
  padding: 7px 9px;
  background: white;
  border: 2px solid var(--line);
  border-radius: 10px;
}

.flashcards-learning-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(250px, 0.9fr);
  align-items: start;
  gap: 20px;
}

.flashcards-learning-grid .flashcard-box {
  min-width: 0;
}

.flashcards-learning-grid .flashcard-content {
  padding: 24px 8px;
}

.testable-question-guide {
  min-width: 0;
  padding: 20px;
}

.testable-question-guide h3 {
  margin: 0;
  color: var(--text);
  font-size: 1.2rem;
  line-height: 1.35;
}

.testable-question-guide .question-check-list {
  gap: 10px;
  margin-top: 14px;
}

.testable-question-guide .question-check-row {
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 10px;
  padding: 12px;
}

.testable-question-guide .question-guide-icon {
  background: var(--mint);
}

.testable-question-guide .question-check-row p {
  font-size: 0.9rem;
}

/* ==================================================
        REASONED-PREDICTION VIDEO
        ================================================== */

.prediction-video-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(140px, 20%);
  align-items: center;
  gap: 20px;
}

.prediction-video-instructions .activity-instruction {
  margin-top: 0;
}

.prediction-video-instructions ol {
  display: grid;
  gap: 10px;
  margin: 16px 0 0;
  padding-left: 1.4rem;
}

.prediction-video-instructions li {
  padding-left: 4px;
  line-height: 1.5;
}

.prediction-video-button {
  display: flex;
  width: min(100%, 150px);
  aspect-ratio: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  justify-self: center;
  padding: 14px;
  color: white;
  background: var(--green);
  border: 3px solid var(--line);
  border-radius: 18px;
  box-shadow: 0 4px 0 var(--line);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    background-color 160ms ease;
}

.prediction-video-button:hover {
  background: var(--button-hover);
  transform: translateY(-1px);
  box-shadow: 0 5px 0 var(--line);
}

.prediction-video-button:focus-visible {
  outline: 3px solid var(--purple);
  outline-offset: 4px;
}

.prediction-video-play {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  padding-left: 4px;
  color: var(--purple);
  background: var(--paper);
  border: 2px solid var(--line);
  border-radius: 50%;
  font-size: 1.8rem;
  line-height: 1;
}

.prediction-video-label {
  font-size: 0.95rem;
}

@media (max-width: 960px) {
  .observe-experiment-grid,
  .flashcards-learning-grid {
    grid-template-columns: 1fr;
  }

  .flashcards-learning-grid .testable-card {
    grid-row: 1;
  }

  #observe-experiment .image-box,
  #observe-experiment .lesson1-stw-box {
    min-height: 0;
  }

  #observe-experiment .image-box {
    min-height: 320px;
  }
}

@media (max-width: 700px) {
  .prediction-video-layout {
    grid-template-columns: 1fr;
  }

  .prediction-video-button {
    width: min(100%, 150px);
  }
}
</style>
