<script setup>
/*
  Lesson 6: turn a data table into a line graph, step by step.
    1. Calculate the averages in each table.
    2. Drag the variable and unit cards onto the axes (<DragDrop strict>).
    3. Plot each average. guided: choose x, choose y, click where the dotted
       guides cross. Otherwise a dotted crosshair follows the pointer; click
       near the highlighted row's coordinate and the point snaps onto it.
    4. Join the points: click any point, then keep clicking a point next to
       either end of the line. With two tables (two lines) each is plotted
       and joined in turn.
    5. Do the results support the reasoned prediction? (<PredictionCheck>)

    <LineGraph ref="plants" :graph="PLANTS" @reset="section.reset()" />

  The graph's data and wording come from lineGraphs.js. Exposes complete
  (every line joined). The averages, plotted points and joined lines are
  saved through <Activity :state>; the axes and the prediction check are
  activities that save themselves.
*/
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import Activity from "../../activities/Activity.vue";
import DragDrop from "../../activities/DragDrop.vue";
import DragItem from "../../activities/DragItem.vue";
import DropSlot from "../../activities/DropSlot.vue";
import PredictionCheck from "../../activities/PredictionCheck.vue";
import {
  DEFAULT_MESSAGES,
  average,
  formatNumber,
  numberWord,
} from "./lineGraphs.js";

const props = defineProps({
  graph: { type: Object, required: true },
});

const emit = defineEmits(["reset"]);

const g = props.graph;
const plot = g.plot;
const messages = { ...DEFAULT_MESSAGES, ...g.messages };
const multi = g.tables.length > 1;

const yOf = (value) =>
  plot.bottom - (value / plot.maxY) * (plot.bottom - plot.top);

// one line per table
const series = g.tables.map((table) => ({
  key: g.key,
  label: "",
  shortLabel: "",
  ...table.series,
  points: table.rows.map(([x, ...trials], index) => {
    const y = average(trials);
    return { x, y, px: g.xPos(index, x), py: yOf(y) };
  }),
}));

const yTicks = Array.from({ length: plot.maxY + 1 }, (_, value) => ({
  value,
  y: yOf(value),
  labelled: value % g.labelEvery === 0,
}));

const cardText = (name) => g.cards.find((c) => c.name === name)?.text ?? name;

/* ---------- saved state ---------- */

const calculated = ref(g.tables.map(() => false));
const plotted = ref(series.map(() => 0)); // points plotted per line
const connected = ref(series.map(() => [])); // joined point indexes per line, in line order
const state = { calculated, plotted, connected };

/* ---------- step 1: averages ---------- */

const allCalculated = computed(() => calculated.value.every(Boolean));
const stage = ref(null);

function calculate(i) {
  calculated.value = calculated.value.map((done, j) => done || j === i);
}

watch(allCalculated, async (all, before) => {
  if (!all || before) return;
  await nextTick();
  setTimeout(
    () => stage.value?.scrollIntoView({ behavior: "smooth", block: "start" }),
    120,
  );
});

function tableFeedback(table, i) {
  if (!calculated.value[i])
    return { variant: "", title: table.start.title, text: table.start.text };
  const [title, text] = g.averageMessage(table, allCalculated.value);
  return { variant: "success", title, text };
}

/* ---------- step 2: axes ---------- */

const axes = ref(null);
const axesDone = computed(() => axes.value?.done ?? false);
const placements = computed(() => axes.value?.getPlacements() ?? {});
const axisReady = (axis) =>
  Boolean(
    placements.value[axis + "-variable"] && placements.value[axis + "-unit"],
  );

// what the axes held before the latest change (also right after a reload)
let previousPlacements = {};
watch(placements, (now) => (previousPlacements = now));

function onAxisIncorrect({ item }) {
  say(
    "try-again",
    "That card does not belong there.",
    g.axisSpecial?.[item] || g.axisWrong,
  );
}

function onAxisChange(now) {
  const placed = Object.keys(now).find(
    (slot) => previousPlacements[slot] !== now[slot],
  );
  previousPlacements = now;
  const answers = {
    "x-variable": g.slots.xVariable,
    "x-unit": g.slots.xUnit,
    "y-variable": g.slots.yVariable,
    "y-unit": g.slots.yUnit,
  };
  if (Object.entries(answers).every(([slot, item]) => now[slot] === item)) {
    say("", "Both axis labels are complete.", g.axisDone);
  } else if (placed && now[placed]) {
    say(
      "success",
      cardText(now[placed]) + " is in the right place.",
      g.axisRight,
    );
  }
}

/* ---------- steps 3-4: plot and join ---------- */

// the first line still being built (series.length once every line is joined)
const seriesIndex = computed(() => {
  const i = series.findIndex(
    (s, si) => connected.value[si].length < s.points.length,
  );
  return i === -1 ? series.length : i;
});
const complete = computed(() => seriesIndex.value === series.length);
const current = computed(
  () => series[Math.min(seriesIndex.value, series.length - 1)],
);
const plotIndex = computed(() => plotted.value[seriesIndex.value] ?? 0);

// waiting (axes not labelled) -> plot -> connect -> complete
const phase = computed(() => {
  if (!axesDone.value) return "waiting";
  if (complete.value) return "complete";
  return plotIndex.value < current.value.points.length ? "plot" : "connect";
});

// guided plotting goes x -> y -> intersection for every point
const guidedStep = ref("x");

function context(extra) {
  const s = current.value;
  return {
    series: s,
    multi,
    n: s.points.length,
    i: plotIndex.value,
    pt: s.points[plotIndex.value],
    word: numberWord(s.points.length),
    stage: g.guided ? guidedStep.value : "plot",
    ...extra,
  };
}

const labels = computed(() => {
  if (phase.value === "waiting")
    return [
      "Step 2 · Label the graph axes and units",
      g.initialHint ??
        "Label the axes of the graph before plotting the points.",
      g.initialBadge,
    ];
  const [step, hint, badge] =
    messages.labels?.(
      phase.value,
      Math.min(seriesIndex.value, series.length - 1),
    ) ?? [];
  return [step, hint, badge ?? g.initialBadge];
});

const plotPrompt = computed(() => {
  if (phase.value !== "plot") return null;
  const c = context();
  return { title: messages.plotTitle(c), text: messages.plotText(c) };
});

const connectPrompt = computed(() => {
  if (phase.value !== "connect") return null;
  const custom = messages.connectPrompt?.(
    context({ i: current.value.points.length - 1 }),
  );
  return custom
    ? { title: custom[0], text: custom[1] }
    : {
        title: "Connect the plotted points.",
        text: "Click any point to start. Then click neighbouring points until all five are connected.",
      };
});

function rowClass(si, row) {
  const n = series[si].points.length;
  return {
    "partc-complete-row":
      phase.value !== "waiting" &&
      (row < plotted.value[si] || plotted.value[si] >= n),
    "partc-current-row":
      phase.value === "plot" &&
      si === seriesIndex.value &&
      row === plotIndex.value,
  };
}

/* ---------- feedback ---------- */

const message = ref(null);
function say(variant, title, text) {
  message.value = { variant, title, text };
}
const sayMessage = (variant, [title, text]) => say(variant, title, text);

const feedback = computed(() => {
  if (message.value) return message.value;
  if (phase.value === "waiting")
    return {
      variant: "",
      title: g.startFeedback.title,
      text: g.startFeedback.text,
    };
  return {
    variant: "",
    title: "Both axis labels are complete.",
    text: g.axisDone,
  };
});

/* ---------- guides ---------- */

const guideX = ref(null); // SVG x of the vertical guide
const guideY = ref(null);
const activeX = ref(null); // chosen tick values (guided)
const activeY = ref(null);
const flash = ref(null); // { axis, value } of a wrong tick
const marker = ref(null); // { x, y } flashed at a placed intersection
const errorPoint = ref(null); // { si, index } of a wrong join

function hideGuides() {
  guideX.value = null;
  guideY.value = null;
  activeX.value = null;
  activeY.value = null;
}

const svg = ref(null);
function svgPoint(event) {
  const matrix = svg.value?.getScreenCTM();
  if (!matrix) return null;
  const point = svg.value.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(matrix.inverse());
}

// a little slack so points on the axes themselves (x = 0, y = 0) can be clicked
function insidePlot(p) {
  const slack = 10;
  return (
    p.x >= plot.left - slack &&
    p.x <= plot.right + slack &&
    p.y >= plot.top - slack &&
    p.y <= plot.bottom + slack
  );
}

function onPointerMove(event) {
  if (g.guided || phase.value !== "plot") return;
  const p = svgPoint(event);
  if (!p || !insidePlot(p)) {
    hideGuides();
    return;
  }
  guideX.value = p.x;
  guideY.value = p.y;
}

function onPointerLeave() {
  if (!g.guided) hideGuides();
}

function onSvgClick(event) {
  if (phase.value !== "plot") return;
  if (!g.guided) placeFromCrosshair(event);
  else if (guidedStep.value === "intersection") placeFromGuides(event);
}

function placeFromCrosshair(event) {
  const p = svgPoint(event);
  if (!p || !insidePlot(p)) return;
  const target = context().pt;
  const dx = Math.abs(p.x - target.px);
  const dy = Math.abs(p.y - target.py);
  if (Math.hypot(dx, dy) > g.tolerance) {
    say("try-again", "Use both axes.", messages.hint(context({ dx, dy })));
    return;
  }
  plotPoint();
}

function flashTick(axis, value) {
  flash.value = { axis, value };
  setTimeout(() => (flash.value = null), 550);
}

function chooseX(value) {
  if (phase.value !== "plot" || guidedStep.value !== "x") return;
  const c = context();
  if (value !== c.pt.x) {
    flashTick("x", value);
    sayMessage("try-again", messages.xWrong(c));
    return;
  }
  activeX.value = value;
  guideX.value = c.pt.px;
  guidedStep.value = "y";
  sayMessage("", messages.xRight(c));
}

function chooseY(value) {
  if (phase.value !== "plot" || guidedStep.value !== "y") return;
  const c = context();
  if (Math.abs(value - c.pt.y) > 0.001) {
    flashTick("y", value);
    sayMessage("try-again", messages.yWrong(c));
    return;
  }
  activeY.value = value;
  guideY.value = c.pt.py;
  guidedStep.value = "intersection";
  sayMessage("", messages.yRight(c));
}

function placeFromGuides(event) {
  if (
    event.target.closest?.(".partb-x-choice, .partb-y-choice, .linegraph-point")
  )
    return;
  const p = svgPoint(event);
  if (!p) return;
  const target = context().pt;
  if (Math.hypot(p.x - target.px, p.y - target.py) > g.tolerance) {
    sayMessage("try-again", messages.intersectionMiss(context()));
    return;
  }
  marker.value = { x: target.px, y: target.py };
  setTimeout(() => (marker.value = null), 280);
  plotPoint();
}

function plotPoint() {
  const c = context();
  const si = seriesIndex.value;
  plotted.value = plotted.value.map((n, i) => (i === si ? n + 1 : n));
  hideGuides();
  guidedStep.value = "x";

  if (plotted.value[si] < c.n) {
    sayMessage("", g.guided ? messages.pointDone(c) : messages.pointPlotted(c));
    return;
  }
  sayMessage("", messages.connectBegin(context({ i: c.n - 1 })));
}

function join(si, index) {
  if (phase.value !== "connect" || si !== seriesIndex.value) return;
  const order = connected.value[si];
  if (order.includes(index)) return;

  const prepend = order.length > 0 && index === order[0] - 1;
  const append = order.length === 0 || index === order[order.length - 1] + 1;
  const c = context({ i: series[si].points.length - 1 });

  if (!prepend && !append) {
    errorPoint.value = { si, index };
    setTimeout(() => (errorPoint.value = null), 550);
    sayMessage("try-again", messages.connectBad(c));
    return;
  }

  const next = prepend ? [index, ...order] : [...order, index];
  connected.value = connected.value.map((o, i) => (i === si ? next : o));

  if (next.length < series[si].points.length) {
    sayMessage("", messages.connectOk(c));
  } else if (si < series.length - 1) {
    const done = messages.seriesDone?.(c);
    if (done) sayMessage("success", done);
  } else {
    message.value = null; // the completion card takes over
  }
}

const linePoints = (si) =>
  connected.value[si]
    .map((i) => series[si].points[i].px + "," + series[si].points[i].py)
    .join(" ");

// removing an axis card puts the plotting back to the start
function resetPlot() {
  plotted.value = series.map(() => 0);
  connected.value = series.map(() => []);
  guidedStep.value = "x";
  hideGuides();
}

watch(axesDone, (done, before) => {
  if (before && !done) resetPlot();
});

/* ---------- reset ---------- */

function reset() {
  calculated.value = g.tables.map(() => false);
  resetPlot();
  message.value = null;
  previousPlacements = {};
}

/* ---------- axis-slot text scales with the graph ---------- */

const wrap = ref(null);
const fontSize = ref("");
let observer = null;

watch(wrap, (el) => {
  observer?.disconnect();
  if (!el || typeof ResizeObserver !== "function") return;
  observer = new ResizeObserver(() => {
    fontSize.value = Math.max(9, Math.min(14, el.clientWidth * 0.021)) + "px";
  });
  observer.observe(el);
});
onBeforeUnmount(() => observer?.disconnect());

function onKey(event, handler) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handler();
  }
}

// the last step: lets the page show the end-of-lesson card
const predictionCheck = ref(null);
const predictionComplete = computed(
  () => complete.value && (predictionCheck.value?.isComplete ?? false),
);

defineExpose({ complete, predictionComplete });
</script>

<template>
  <Activity
    :name="g.key + '-progress'"
    :complete="complete"
    :state="state"
    @reset="reset"
  >
    <!-- ---------- step 1: the tables ---------- -->
    <div :class="multi ? 'plant-tables-grid spaced-block' : null">
      <div
        v-for="(table, ti) in g.tables"
        :key="table.heading"
        class="partb-data-card linegraph-data-card"
        :class="[g.cardClass, { 'plant-condition-card': multi }]"
      >
        <span class="challenge-step-label">{{
          table.stepLabel ?? "Step 1 · Calculate the averages"
        }}</span>
        <h3>{{ table.heading }}</h3>
        <p v-html="table.description"></p>

        <div class="partb-table-wrap">
          <table
            class="practice-table partb-data-table partc-data-table linegraph-data-table"
            :aria-label="table.aria"
          >
            <thead>
              <tr>
                <th rowspan="2" scope="col">{{ table.xHeader }}</th>
                <th colspan="4" scope="colgroup">{{ table.groupHeader }}</th>
              </tr>
              <tr>
                <th v-for="trial in table.trials" :key="trial" scope="col">
                  {{ trial }}
                </th>
                <th scope="col">Average</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, ri) in table.rows"
                :key="row[0]"
                :class="rowClass(ti, ri)"
              >
                <td v-for="(value, ci) in row" :key="ci">{{ value }}</td>
                <td
                  class="partb-average-cell"
                  :class="{ calculated: calculated[ti] }"
                >
                  <span>{{
                    calculated[ti] ? formatNumber(series[ti].points[ri].y) : "—"
                  }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="reset-button-container">
          <button
            type="button"
            class="general-button"
            :disabled="calculated[ti]"
            @click="calculate(ti)"
          >
            Calculate averages
          </button>
        </div>

        <div
          class="challenge-feedback"
          :class="tableFeedback(table, ti).variant"
          role="status"
          aria-live="polite"
        >
          <strong>{{ tableFeedback(table, ti).title }}</strong>{{
            tableFeedback(table, ti).text
          }}
        </div>
      </div>
    </div>

    <!-- ---------- steps 2-4: label, plot and join ---------- -->
    <div v-if="allCalculated" ref="stage" class="partb-construction-stage">
      <DragDrop
        ref="axes"
        :name="g.key + '-axes'"
        class="partb-construction-grid"
        strict
        @incorrect="onAxisIncorrect"
        @change="onAxisChange"
      >
        <div class="graph-control-card partb-control-panel">
          <span class="challenge-step-label">{{ labels[0] }}</span>

          <div v-show="!axesDone">
            <p v-html="g.axisIntro"></p>
            <div
              class="partb-label-bank"
              data-dd-tray
              aria-label="Line graph axis label and unit cards"
            >
              <DragItem
                v-for="card in g.cards"
                :key="card.name"
                tag="button"
                class="axis-card"
                :class="{ 'linegraph-unit-card': card.unit }"
                :name="card.name"
              >
                {{ card.text }}
              </DragItem>
            </div>
          </div>

          <div v-if="plotPrompt" class="partb-builder-prompt">
            <strong>{{ plotPrompt.title }}</strong>
            <span>{{ plotPrompt.text }}</span>
          </div>

          <div v-if="connectPrompt" class="partb-builder-prompt">
            <strong>{{ connectPrompt.title }}</strong>
            <span>{{ connectPrompt.text }}</span>
          </div>

          <div
            v-if="!complete"
            class="challenge-feedback"
            :class="feedback.variant"
            role="status"
            aria-live="polite"
          >
            <strong>{{ feedback.title }}</strong>{{ feedback.text }}
          </div>

          <div v-else class="challenge-complete">
            <strong>{{ g.completeMessage.title }}</strong>{{
              g.completeMessage.text
            }}
          </div>

          <div class="reset-button-container">
            <button
              type="button"
              class="general-button reset-btn"
              @click="emit('reset')"
            >
              Reset line graph activity
            </button>
          </div>
        </div>

        <div class="graph-stage-card partb-graph-card">
          <div class="graph-stage-heading">
            <div>
              <h3>{{ g.graphTitle }}</h3>
              <p>{{ labels[1] }}</p>
            </div>
            <span v-if="labels[2]" class="graph-badge">{{ labels[2] }}</span>
          </div>

          <div
            v-if="multi"
            class="partd-legend"
            aria-label="Watering condition key"
          >
            <span
              v-for="s in series"
              :key="s.key"
              class="partd-legend-item"
              :class="{
                'is-active':
                  (phase === 'plot' || phase === 'connect') &&
                  s.key === current.key,
              }"
            >
              <span
                class="partd-swatch"
                :class="s.swatch"
                aria-hidden="true"
              ></span>
              {{ s.label }}
            </span>
          </div>

          <div ref="wrap" class="graph-svg-wrap" :style="{ fontSize }">
            <svg
              :id="g.svgId"
              ref="svg"
              class="graph-svg"
              viewBox="0 0 760 460"
              role="img"
              :aria-label="g.svgAria"
              @click="onSvgClick"
              @pointermove="onPointerMove"
              @pointerleave="onPointerLeave"
            >
              <rect x="0" y="0" width="760" height="460" rx="18" fill="white" />

              <g aria-hidden="true">
                <line
                  v-for="tick in yTicks"
                  :key="'grid' + tick.value"
                  class="graph-grid-line"
                  :x1="plot.left"
                  :x2="plot.right"
                  :y1="tick.y"
                  :y2="tick.y"
                />
              </g>

              <!-- y-axis numbers (buttons when guided) -->
              <g>
                <template v-for="tick in yTicks" :key="'y' + tick.value">
                  <template v-if="tick.labelled">
                    <g
                      v-if="g.guided"
                      class="partb-y-choice"
                      :class="{
                        active: activeY === tick.value,
                        'try-again':
                          flash?.axis === 'y' && flash.value === tick.value,
                      }"
                      tabindex="0"
                      role="button"
                      :aria-label="`Choose ${tick.value} on the y-axis`"
                      @click="chooseY(tick.value)"
                      @keydown="onKey($event, () => chooseY(tick.value))"
                    >
                      <rect
                        class="partb-y-hit"
                        x="68"
                        :y="tick.y - 14"
                        width="48"
                        height="28"
                        rx="6"
                      />
                      <text
                        class="tick-label"
                        x="103"
                        :y="tick.y + 4"
                        text-anchor="end"
                      >
                        {{ tick.value }}
                      </text>
                    </g>
                    <text
                      v-else
                      class="tick-label"
                      x="103"
                      :y="tick.y + 4"
                      text-anchor="end"
                    >
                      {{ tick.value }}
                    </text>
                  </template>
                </template>
              </g>

              <!-- x-axis values (buttons when guided) -->
              <g>
                <template v-for="(point, i) in series[0].points" :key="'x' + i">
                  <g
                    v-if="g.guided"
                    class="partb-x-choice"
                    :class="{
                      active: activeX === point.x,
                      complete: phase !== 'waiting' && i < plotted[0],
                      'try-again':
                        flash?.axis === 'x' && flash.value === point.x,
                    }"
                    tabindex="0"
                    role="button"
                    :aria-label="`Choose ${point.x} on the x-axis`"
                    @click="chooseX(point.x)"
                    @keydown="onKey($event, () => chooseX(point.x))"
                  >
                    <rect
                      class="partb-x-hit"
                      :x="point.px - 40"
                      y="371"
                      width="80"
                      height="44"
                      rx="6"
                    />
                    <text
                      class="tick-label"
                      :x="point.px"
                      y="394"
                      text-anchor="middle"
                    >
                      {{ point.x }}
                    </text>
                  </g>
                  <text
                    v-else
                    class="tick-label"
                    :x="point.px"
                    y="394"
                    text-anchor="middle"
                  >
                    {{ point.x }}
                  </text>
                </template>
              </g>

              <line
                class="graph-axis"
                :x1="plot.left"
                :y1="plot.bottom"
                :x2="g.axisEnd.x"
                :y2="plot.bottom"
              />
              <line
                class="graph-axis"
                :x1="plot.left"
                :y1="plot.bottom"
                :x2="plot.left"
                :y2="g.axisEnd.y"
              />

              <text
                class="axis-label partb-final-axis-label"
                :class="{ visible: axisReady('x') }"
                :x="g.xLabelX"
                y="420"
                text-anchor="middle"
              >
                {{ g.xLabel }}
              </text>
              <text
                class="axis-label partb-final-axis-label"
                :class="{ visible: axisReady('y') }"
                x="34"
                y="205"
                text-anchor="middle"
                transform="rotate(-90 34 205)"
              >
                {{ g.yLabel }}
              </text>

              <line
                class="partb-guide"
                :class="{ visible: guideX !== null }"
                :x1="guideX ?? 0"
                :x2="guideX ?? 0"
                :y1="plot.top"
                :y2="plot.bottom"
              />
              <line
                class="partb-guide"
                :class="{ visible: guideY !== null }"
                :x1="plot.left"
                :x2="plot.right"
                :y1="guideY ?? 0"
                :y2="guideY ?? 0"
              />
              <circle
                v-if="g.guided"
                class="partb-intersection-point"
                :class="{ visible: marker }"
                :cx="marker?.x ?? 0"
                :cy="marker?.y ?? 0"
                r="8"
              />

              <polyline
                v-for="(s, si) in series"
                :key="'line' + si"
                class="linegraph-path"
                :class="s.className"
                :points="linePoints(si)"
              />
              <g v-for="(s, si) in series" :key="'points' + si">
                <template v-for="(point, i) in s.points" :key="i">
                  <circle
                    v-if="phase !== 'waiting' && i < plotted[si]"
                    class="linegraph-point"
                    :class="[
                      s.pointClass,
                      {
                        connectable: phase === 'connect' && si === seriesIndex,
                        connected: connected[si].includes(i),
                        'connect-error':
                          errorPoint?.si === si && errorPoint.index === i,
                      },
                    ]"
                    :cx="point.px"
                    :cy="point.py"
                    r="8"
                    :tabindex="
                      phase === 'connect' && si === seriesIndex ? 0 : null
                    "
                    :role="
                      phase === 'connect' && si === seriesIndex
                        ? 'button'
                        : null
                    "
                    :aria-label="
                      messages.aria({ ...context(), series: s, pt: point }) +
                      (phase === 'connect' && si === seriesIndex
                        ? '. Click to connect this point.'
                        : '')
                    "
                    @click.stop="join(si, i)"
                    @keydown="onKey($event, () => join(si, i))"
                  />
                </template>
              </g>
            </svg>

            <!-- HTML drop slots laid over the axis-label positions (see .axis-slot in lesson4.css) -->
            <DropSlot
              name="x-variable"
              :answer="g.slots.xVariable"
              class="axis-slot"
              :class="{ 'axis-complete': axisReady('x') }"
              style="left: 34.21%; top: 89.13%; width: 26.97%; height: 9.13%"
              aria-label="Drop the x-axis variable here"
            >
              Variable
            </DropSlot>
            <DropSlot
              name="x-unit"
              :answer="g.slots.xUnit"
              class="axis-slot"
              :class="{ 'axis-complete': axisReady('x') }"
              style="left: 63.82%; top: 89.13%; width: 9.21%; height: 9.13%"
              aria-label="Drop the x-axis unit here"
            >
              Unit
            </DropSlot>
            <DropSlot
              name="y-variable"
              :answer="g.slots.yVariable"
              class="axis-slot axis-slot-rot"
              :class="{ 'axis-complete': axisReady('y') }"
              style="left: 4.47%; top: 56.09%; width: 25%; height: 9.57%"
              aria-label="Drop the y-axis variable here"
            >
              Variable
            </DropSlot>
            <DropSlot
              name="y-unit"
              :answer="g.slots.yUnit"
              class="axis-slot axis-slot-rot"
              :class="{ 'axis-complete': axisReady('y') }"
              style="left: 4.47%; top: 20.65%; width: 11.84%; height: 9.57%"
              aria-label="Drop the y-axis unit here"
            >
              Unit
            </DropSlot>
          </div>
        </div>
      </DragDrop>
    </div>

    <!-- ---------- step 5: interpret ---------- -->
    <PredictionCheck
      v-if="complete"
      ref="predictionCheck"
      :name="g.key + '-prediction'"
      :prediction="g.prediction.text"
      :answer="g.prediction.answer"
      :incorrect-title="g.prediction.incorrectTitle"
      :incorrect-text="g.prediction.incorrectText"
    />
  </Activity>
</template>

<style>
/* Moved from styles/lesson4_styles/lesson4.css. Not scoped: some rules style child components' content. */

/* Keep the badge on the right without pushing the title off-centre */
.graph-stage-heading .graph-badge {
  position: absolute;
  top: 0;
  right: 0;
}
.graph-badge {
  flex: 0 0 auto;
  padding: 6px 10px;
  background: var(--soft-yellow);
  border: 2px solid var(--charcoal);
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.challenge-complete {
  margin-top: 14px;
  padding: 14px 16px;
  background: var(--soft-green);
  border: 2px solid var(--charcoal);
  border-radius: 14px;
  font-weight: 700;
  line-height: 1.45;
}

/* Slots whose position is set inline (lesson4-2): -rot ones are centred on that point and turned to read upwards. */
.axis-slot-rot {
  transform: translate(-50%, -50%) rotate(-90deg);
}

.partc-data-table tr.partc-current-row td {
  background: var(--soft-yellow);
  font-weight: 800;
}

.plant-tables-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  align-items: start;
}

.plant-condition-card {
  min-width: 0;
  margin: 0;
}

.plant-condition-card .partb-data-table {
  width: 100%;
  min-width: 0;
  table-layout: fixed;
}

.plant-condition-card .partb-data-table th,
.plant-condition-card .partb-data-table td {
  padding: 7px 5px;
  font-size: 0.78rem;
  line-height: 1.22;
}

.partd-swatch.plant-water100 {
  background: var(--purple);
}

.partd-swatch.plant-water300 {
  background: var(--green);
}

#lineGraphPlantsSvg .linegraph-point.plant-point-100 {
  fill: var(--lavender);
  stroke: var(--purple);
}

#lineGraphPlantsSvg .linegraph-point.plant-point-300 {
  fill: var(--mint);
  stroke: var(--green);
}

#lineGraphPlantsSvg .linegraph-point.plant-point-100.connected {
  fill: var(--purple);
  stroke: var(--purple);
}

#lineGraphPlantsSvg .linegraph-point.plant-point-300.connected {
  fill: var(--green);
  stroke: var(--green);
}

#lineGraphPlantsSvg .linegraph-point.connect-error {
  fill: var(--soft-orange);
  stroke: var(--orange);
}

@media (max-width: 899px) {
  .plant-tables-grid {
    grid-template-columns: 1fr;
  }
}
</style>
