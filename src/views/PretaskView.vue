<script setup>
// Load before the components: these styles keep the cascade order of the old stylesheet.
import "../styles/pretask.css";
import Page from "../components/layout/Page.vue";
import Section from "../components/layout/Section.vue";
import ThinkBox from "../components/activities/ThinkBox.vue";
import PostitBrainstorm from "../components/lessons/pretask/PostitBrainstorm.vue";
import FinalBrainstorm from "../components/lessons/pretask/FinalBrainstorm.vue";
import PlantDetective from "../components/lessons/pretask/PlantDetective.vue";
import PlantGame from "../components/lessons/pretask/PlantGame.vue";
import WordSentences from "../components/lessons/pretask/WordSentences.vue";

// Sections of the page. Order defines the unlock chain (next-id) and which
// sections start locked; override per section where needed.
const sections = [
  {
    id: "watch",
    title: "Making observations of plants",
  },
  {
    id: "build",
    title: "The structure of a flowering plant",
  },
  {
    id: "brainstorm",
    title: "Think like a scientist - Brainstorm to share ideas",
  },
  {
    id: "diagram",
    title: "Why do plants need the right physical conditions to survive?",
  },
  {
    id: "detective",
    title: "Can you solve the mystery of the unhealthy plants?",
  },
  {
    id: "final-brainstorm",
    title: "Check your understanding",
  },
];

// See, Think, Wonder columns
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

// Closing brainstorm
const finalPrompt = "Why do plants need these physical conditions?";
const finalBranches = [
  {
    key: "water",
    title: "Water",
    placeholder: "Why do plants need water?",
  },
  {
    key: "sunlight",
    title: "Sunlight",
    placeholder: "Why do plants need sunlight?",
  },
  {
    key: "nutrients",
    title: "Nutrients",
    placeholder: "Why do plants need nutrients?",
  },
  {
    key: "soil",
    title: "Soil",
    placeholder: "Why does soil matter?",
  },
  {
    key: "co2",
    title: "Carbon Dioxide",
    placeholder: "Why might plants need carbon dioxide?",
  },
  {
    key: "oxygen",
    title: "Oxygen",
    placeholder: "Why might plants need oxygen?",
  },
];

import LessonIntro from "../components/content/LessonIntro.vue";

// Learning objective and success criteria shown in the lesson intro
const objective =
  "Identify the physical conditions that affect a plant’s ability to grow and survive.";
const criteria = [
  "I can identify the <strong>physical conditions</strong> that a plant needs to grow and survive.",
  "I can compare healthy and unhealthy plants to explain why plants need the correct <strong>physical conditions</strong> to be healthy",
];

// Terms shown in the vocabulary modal: { word: description }
const glossary = {
  Botanist: "A scientist who studies plants.",
  Diagnose:
    "To identify what is wrong with a living thing by carefully examining it and looking for clues about what physical condition may be missing or out of balance.",
  Function:
    "The job or role that a part of a plant performs to help it survive.",
  Germinate:
    "When a seed begins to sprout and grow into a new plant after absorbing water and being exposed to the right temperature and conditions.",
  Investigate:
    "To carefully examine and gather information about something in order to find an answer or understand it better.",
  Nutrients:
    "Substances found in soil and water that plants absorb through their roots to grow and stay healthy.",
  "Observe / Observation":
    "Information gathered by using your senses—sight, hearing, touch, smell, or taste—to carefully notice and describe something in the world around you.",
  Structure:
    "A physical part of a plant, such as the roots, stem, leaves, flower, or fruit, that has a specific job.",
};
</script>

<template>
  <Page
    lessonId="pretask"
    title="Pre-Task: What do plants need to survive?"
    :sections="sections"
    :glossary="glossary"
  >
    <template #lesson-intro>
      <LessonIntro
        label="Pre-Task"
        title="What do plants need to survive?"
        worksheet="../worksheets/pretask-worksheet.pdf"
        :objective="objective"
        :criteria="criteria"
      >
        Plants are living organisms found growing all around the world. Animals
        rely on plants for food, nutrients and the oxygen they produce.

        <template #mission>
          <div class="botanist-mission">
            <div class="mission-icon">
              <img
                src="../images/pretask/botanist.jpg"
                alt="A botanist studying plants"
              />
            </div>
            <div>
              <p class="intro-eyebrow">Your mission</p>

              <h2>Become a botanist</h2>

              <p>
                In this lesson, you will be a plant detective. You will
                investigate why plants become unhealthy and work out how to make
                them healthy again.
              </p>
            </div>
          </div>
        </template>

        <template #observation>
          <h2>See, Think, Wonder</h2>

          <p>
            <strong>Botanists</strong> observe how plants grow and behave. They
            use a thinking routine called
            <strong><i>See, Think, Wonder</i></strong> to make scientific
            <strong>observations</strong>.
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
      <!-- Part B: Making observations of plants -->
      <Section name="watch">
        <div class="diagram-box diagram-activity">
          <p class="activity-instruction">
            Watch the video of a seed germinating, add your observations, and
            then select <strong>Next</strong> to continue.
          </p>
        </div>

        <div class="video-row">
          <div class="video-box">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube-nocookie.com/embed/w77zPAtVTuI"
              title="Plant video"
              frameborder="0"
              allow="
                accelerometer;
                autoplay;
                clipboard-write;
                encrypted-media;
                gyroscope;
                picture-in-picture;
                web-share;
              "
              allowfullscreen
            >
            </iframe>
          </div>

          <ThinkBox id="watchStwActivity" :groups="stwGroups" />
        </div>
      </Section>

      <!-- Part C: The structure of a flowering plant -->
      <Section name="build">
        <div class="diagram-box diagram-activity">
          <p class="activity-instruction">
            Watching time lapse videos of plants helps us to
            <strong>observe</strong> the behaviour of plants. As a
            <strong>botanist</strong> you want to be sure you use the correct
            terms when talking about plants. To remind yourself of the major
            parts of a flowering plant complete this drag and drop activity.
          </p>
        </div>
        <PlantGame />
      </Section>

      <Section name="brainstorm">
        <div class="diagram-box diagram-activity">
          <p class="activity-instruction">
            <strong>Botanists</strong> like to collaborate and share ideas with
            one another when they are investigating plants. One way to do this
            is to <strong><i>brainstorm</i></strong> to think of new ideas. In
            this activity you can work on your own or in a team to
            <strong><i>brainstorm</i></strong> ideas to explore the question,
            what are the <strong>physical conditions</strong> that plants
            require to grow and survive. Come up with as many ideas as you can.
            You can use the picture to help you think of ideas and write them on
            the sticky notes activity below.
          </p>
        </div>

        <div class="image-box">
          <img
            src="../images/pretask/plantneeds-unmarked.png"
            alt="Plants need water, sunlight and nutrients"
          />
        </div>

        <PostitBrainstorm id="brainstormActivity" />
      </Section>

      <Section name="diagram">
        <div class="diagram-box diagram-activity">
          <p class="activity-instruction">
            Some of the <strong>physical conditions</strong> that plants need to
            grow include sunlight, soil, water, carbon dioxide, oxygen,
            <strong>nutrients</strong>, and temperature. Use the diagram and
            interactive video to investigate why they need these
            <strong>physical conditions</strong>. You will also explore the
            <strong>function</strong> of different parts of the plant.
          </p>
        </div>

        <div class="learning-row">
          <div class="diagram-box diagram-activity">
            <div class="image-box">
              <img
                src="../images/pretask/plantneeds-marked.png"
                alt="Diagram showing the parts of a flowering plant"
              />
            </div>

            <WordSentences />
          </div>

          <div class="writing-box thinglink-box">
            <div class="thinglink-responsive-wrapper">
              <iframe
                width="960"
                height="1440"
                data-original-width="1080"
                data-original-height="1620"
                src="https://www.thinglink.com/view/scene/2126199449112805862"
                type="text/html"
                style="border: none"
                webkitallowfullscreen
                mozallowfullscreen
                allowfullscreen
                scrolling="no"
              >
              </iframe>
            </div>
          </div>
        </div>
      </Section>

      <Section name="detective">
        <div class="diagram-box diagram-activity">
          <p class="activity-instruction">
            <strong>Botanists</strong>, farmers, nursery workers and gardeners
            often need to be plant detectives to solve the mystery of unhealthy
            plants. They think about the
            <strong>physical conditions</strong> that plants need to be healthy
            and how too much or too little of each
            <strong>physical condition</strong> can cause a plant to become
            unhealthy. Use your detective skills to make
            <strong>observations</strong> and come up with an idea for what each
            plant might need to become healthy again. Test your idea and see if
            you can solve the mystery for each unhealthy plant.
          </p>
        </div>

        <div class="detective-embed-box">
          <PlantDetective />
        </div>
      </Section>

      <Section name="final-brainstorm">
        <FinalBrainstorm
          id="finalBrainstormActivity"
          :prompt="finalPrompt"
          :branches="finalBranches"
        />
      </Section>
    </template>
  </Page>
</template>
