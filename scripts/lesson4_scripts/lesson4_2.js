

(function initialiseLesson4_2() {
  /* ==================================================
     NUMBER LINE ACTIVITY
     Moved from the inline <script> in lesson4-2.html.
     Distance/species exploration with the panel + graph.
     ================================================== */

  const MIN_DISTANCE = 0;
  const MAX_DISTANCE = 20;
  const STEP = 5;
  const CLOSE_MS = 260; // keep in sync with .stage-panel transition duration

  // Runs once per instance, so multiple copies of this activity can
  // live on the same page without clashing.
  function initNumberLineActivity(activity) {
    const stage = activity.querySelector(".line-stage");
    if (!stage) return;

    const points = Array.from(activity.querySelectorAll(".line-point"));
    const templates = Array.from(activity.querySelectorAll(".panel-content"));
    const panel = activity.querySelector(".stage-panel");
    const panelBody = panel.querySelector(".panel-body");
    const panelClose = panel.querySelector(".panel-close");
    const person = activity.querySelector(".person-marker");
    const note = activity.querySelector(".activity-note");

    const nextButton = document.getElementById("number-line-next");
    const resetButton = document.getElementById("reset-activity-button");
    const chartWrap = activity.querySelector(".bar-stack-chart");
    const barRow = activity.querySelector(".bar-stack-row");
    const yAxis = activity.querySelector(".y-axis");
    const graphToggleButton = activity.querySelector(".graph-toggle-button");
    const countersHiddenButton = activity.querySelector(".hide-counters-button");
    const graphBuildPrompt = activity.querySelector(".graph-build-prompt");
    const graphBuildInstruction = activity.querySelector(".graph-build-instruction");
    const findAllPrompt = activity.querySelector(".find-all-prompt");
    const findAllButton = activity.querySelector(".find-all-button");

    const graphCompleteFeedback = activity.querySelector(".graph-complete-feedback");
    
    const speciesButtons = Array.from(
      document.getElementById("number-line-animal-buttons")
              .querySelectorAll(".species-select-button")
    );

    const SVG_NS = "http://www.w3.org/2000/svg";

    // null = nothing chosen yet; person sits at its resting 0 m position
    // but no panel is open and the badge shows the initial prompt.
    let selected = null;
    let closeTimer = null;
    let personArriveHandler = null;

    /* ---------------------------------------------------------------
       Spotlight-style animal hotspots, scattered across each distance's
       backdrop photo (in the <template> markup). Because a fresh clone
       of the template is inserted every time a panel opens, "found"
       state has to be tracked outside the DOM (keyed by a stable id
       assigned once here) so it survives closing and reopening a panel.

       The user picks ONE species with the buttons above the number
       line; only hotspots for that species stay clickable anywhere
       (everything else just dims out as a distractor). The chart below
       shows, for the selected species only, how many were found at
       each distance point (0/5/10/15/20 m) — one cylinder-stack column
       per distance. Once every hotspot for the selected species has
       been found, a short Step 3 prompt appears. Students first reveal
       the data points, then click those points from left to right to
       connect the line: distance on the x-axis, count found on the y-axis.
    --------------------------------------------------------------- */
    const barColours = ["#ffd747", "#7c4dff", "#5cc8ff", "#b7e9a8", "#ff8a65", "#c792ea", "#4fd1c5"];
    const CYLINDER_UNIT_HEIGHT = 10;
    const CYLINDER_DIAMETER = 80;
    // How much taller the chart gets, per animal, once "Hide counters"
    // is on — everything (row height, y-axis ticks, plotted points)
    // reads from this same multiplier so the line graph just gets
    // roomier without drifting out of sync with the axis.
    const STRETCH_FACTOR = 4;
    const DISTANCES = [];
    const TARGET_SPECIES = speciesButtons.map(
      (btn) => btn.dataset.species
    );
    for (let d = MIN_DISTANCE; d <= MAX_DISTANCE; d += STEP) DISTANCES.push(String(d));

    const hotspotSpecies = new Map(); // hotspotId -> species name
    const hotspotFound = new Map(); // hotspotId -> boolean
    const hotspotDistance = new Map(); // hotspotId -> distance string
    const highlightedHotspotIds = new Set(); // hotspotId -> revealed by "Find all", not yet actually found
    const speciesColours = new Map(); // species name -> colour
    let nextHotspotSeq = 0;
    let selectedSpecies = null;
    let isGraphMode = false;
    let isCountersHidden = false;
    let activeUnitHeight = CYLINDER_UNIT_HEIGHT;

    // Start loading the large survey backdrops before a student opens a
    // distance panel. The actual hotspots remain hidden until the matching
    // backdrop has loaded, so the animal positions cannot flash first.
    const preloadedNumberLineImages = [];

    function preloadNumberLineImage(src) {
      if (!src) return;
      const image = new Image();
      image.decoding = "async";
      image.src = src;
      preloadedNumberLineImages.push(image);
    }

    preloadNumberLineImage("../images/lesson4/number_line_activity/Rockplatform.png");
    templates.forEach((template) => {
      const background = template.content.querySelector(".stage-bg");
      if (background) preloadNumberLineImage(background.getAttribute("src"));
    });

    speciesButtons.forEach((btn, i) => {
      speciesColours.set(btn.dataset.species, barColours[i % barColours.length]);
    });

    templates.forEach((template) => {
      const distance = template.dataset.distance;
      template.content.querySelectorAll(".animal-hotspot").forEach((hotspot) => {
        const id = "nl-hotspot-" + (nextHotspotSeq += 1);
        hotspot.dataset.hotspotId = id;

        const name = hotspot.dataset.animal;
        hotspotSpecies.set(id, name);
        hotspotFound.set(id, false);
        hotspotDistance.set(id, distance);

        if (!speciesColours.has(name)) {
          speciesColours.set(name, barColours[speciesColours.size % barColours.length]);
        }
      });
    });

    // How many hotspots of `name` exist at `distance` (its ceiling for that column).
    function maxAtDistance(name, distance) {
      let total = 0;
      hotspotSpecies.forEach((species, id) => {
        if (species === name && hotspotDistance.get(id) === distance) total += 1;
      });
      return total;
    }

    // How many of `name` have been found at `distance` so far.
    function foundAtDistance(name, distance) {
      let total = 0;
      hotspotSpecies.forEach((species, id) => {
        if (species === name && hotspotDistance.get(id) === distance && hotspotFound.get(id)) total += 1;
      });
      return total;
    }

    function totalsFor(name) {
      let found = 0;
      let max = 0;
      hotspotSpecies.forEach((species, id) => {
        if (species !== name) return;
        max += 1;
        if (hotspotFound.get(id)) found += 1;
      });
      return { found, max };
    }

    function overallMaxForSpecies(name) {
      return Math.max(1, ...DISTANCES.map((d) => maxAtDistance(name, d)));
    }

    function buildYAxis(maxUnits) {
      if (!yAxis) return;

      // Reuse existing tick elements rather than wiping and rebuilding
      // them every render: a brand-new element has no "before" state,
      // so the CSS transition on `bottom` has nothing to animate from
      // and the tick just snaps into place. Updating an existing
      // element's `bottom` instead lets it glide smoothly in step with
      // the axis height transition.
      const existingTicks = Array.from(yAxis.querySelectorAll(".y-axis-tick"));

      for (let i = 0; i <= maxUnits; i += 1) {
        const bottom = i * activeUnitHeight + "px";
        let tick = existingTicks[i];
        if (!tick) {
          tick = document.createElement("div");
          tick.className = "y-axis-tick";
          yAxis.appendChild(tick);
        }
        tick.style.bottom = bottom;
        tick.textContent = String(i);
      }

      // Drop any leftover ticks from a taller previous axis.
      for (let i = maxUnits + 1; i < existingTicks.length; i += 1) {
        existingTicks[i].remove();
      }
    }

    function createCylinder(parent, colour) {
      // Simple flat "coin" rectangle, shaded with a gradient to read as
      // subtly 3D without the cost/complexity of the old rotated-strip
      // cylinder. Same footprint (width = diameter, height = unit height)
      // as before, so the surrounding layout math is unaffected.
      const block = document.createElement("div");
      block.className = "cylinder";

      const diameter = CYLINDER_DIAMETER;
      const height = CYLINDER_UNIT_HEIGHT;

      parent.style.setProperty("--cylinder-diameter", diameter + "px");
      parent.style.setProperty("--cylinder-height", height + "px");
      
      block.style.width = diameter + "px";
      block.style.height = height + "px";
      block.style.setProperty("--colour", colour);

      parent.appendChild(block);
    }

    // Persistent SVG overlay for the line graph: created once, then
    // re-appended into barRow after every innerHTML rebuild (rather
    // than recreated) so it isn't thrown away along with the columns.
    const lineOverlaySvg = document.createElementNS(SVG_NS, "svg");
    lineOverlaySvg.classList.add("line-graph-overlay");

    // Instead of drawing the whole line automatically, every point is
    // plotted but the line between them only grows as the user clicks
    // points — click one, then another, and a segment connects them,
    // in the order they were clicked (not necessarily left to right).
    // connectedOrder holds that click order as a list of distances.
    const graphConnections = new Map();

    TARGET_SPECIES.forEach((name) => {
      graphConnections.set(name, []);
    });

    // A "Find all" escape hatch appears once a student has opened every
    // quadrat while searching for the selected species, and a further two
    // minutes have then passed without finding them all — covers a student
    // who can't locate every hotspot but shouldn't be stuck unable to
    // progress. The timer only starts once all 5 quadrats are visited (not
    // from when the species is picked), and keeps running in the
    // background if the student swaps to a different species — swapping
    // back to this one later shows the button immediately if it's already
    // due.
    const FIND_ALL_DELAY_MS = 2 * 60 * 1000;
    const speciesSearchStartedAt = new Map(); // species name -> Date.now() timestamp
    const speciesSearchTimeout = new Map(); // species name -> setTimeout handle
    const speciesVisitedDistances = new Map(); // species name -> Set of distance strings

    function ensureSpeciesSearchTimer(name) {
      if (speciesSearchStartedAt.has(name)) return;
      speciesSearchStartedAt.set(name, Date.now());
      speciesSearchTimeout.set(name, window.setTimeout(() => {
        speciesSearchTimeout.delete(name);
        updateProgressAndGraphButton();
      }, FIND_ALL_DELAY_MS));
    }

    function clearSpeciesSearchTimers() {
      speciesSearchTimeout.forEach((handle) => window.clearTimeout(handle));
      speciesSearchTimeout.clear();
      speciesSearchStartedAt.clear();
      speciesVisitedDistances.clear();
    }

    function hasExaminedAllQuadrats(name) {
      const visited = speciesVisitedDistances.get(name);
      return Boolean(visited) && DISTANCES.every((d) => visited.has(d));
    }

    function searchTimeElapsed(name) {
      const startedAt = speciesSearchStartedAt.get(name);
      return startedAt ? Date.now() - startedAt : 0;
    }

    function getConnectedOrder() {
      if (!selectedSpecies) return [];
      return graphConnections.get(selectedSpecies) || [];
    }
    const pointsByDistance = new Map();

    // Circles persist across renders (keyed by distance) instead of
    // being destroyed and recreated every time renderLineOverlay runs.
    // A brand-new SVG element has no "before" cx/cy for the browser to
    // transition from, so it just snaps straight to its final spot;
    // reusing the same element lets the CSS transition on cx/cy glide
    // it there instead, in step with the chart's height transition.
    const circlesByDistance = new Map();

    // Connecting-line segments persist the same way, keyed by the pair
    // of distances they join.
    const linesByKey = new Map();

    // Every attempt so far to animate the overlay (points/segments/tick
    // marks) on its own timer — a CSS transition, or a hand-rolled
    // requestAnimationFrame tween — ended up either detached from or
    // lagging the actual chart, because renderLineOverlay() gets called
    // repeatedly *during* the chart's own --row-height transition (see
    // the ResizeObserver below), and restarting a fixed-duration
    // animation against a new target on every one of those calls never
    // settles into one smooth motion — it either fights the previous
    // leg (drifting/"detached") or, restarted from wherever it
    // currently sits, needs a fresh full duration to cover only a
    // sliver of remaining distance each time ("lag behind").
    //
    // The fix: don't run a separate animation at all. Instead, while
    // the chart's height transition is running, sample the *real*,
    // already-correctly-interpolated layout every animation frame (via
    // getBoundingClientRect, same as always) and place the overlay
    // elements at exactly that position, with no transition of their
    // own. Since the browser is doing 100% of the actual interpolation
    // natively, reading and mirroring it every frame can't drift or
    // lag — there's nothing being approximated.
    let overlayTrackFrame = null;
    const OVERLAY_TRACK_MS = 750; // a little past the .7s height transition

    function trackOverlayDuringTransition(columnEntries) {
      if (overlayTrackFrame) cancelAnimationFrame(overlayTrackFrame);
      const start = performance.now();

      function step(now) {
        applyOverlayGeometry(columnEntries);
        overlayTrackFrame =
          now - start < OVERLAY_TRACK_MS ? requestAnimationFrame(step) : null;
      }

      overlayTrackFrame = requestAnimationFrame(step);
    }

    // The little x-axis tick mark under each column (only shown in
    // graph mode) used to be a ::after pseudo-element on .stack-group,
    // but .stack-group is torn down and rebuilt fresh by renderChart()
    // every render, so the pseudo-element always started from scratch
    // with no "before" position to transition from. Drawing it here
    // instead, as a persistent SVG line inside the same overlay that
    // already holds the points/segments, lets it glide like they do.
    const xAxisTicksByDistance = new Map();

    // currentPolyline/currentColumnEntries track the graph currently on
    // screen so redrawPolyline() and checkGraphComplete() (called from
    // the per-point click handlers) don't need it threaded through.
    let currentColumnEntries = [];

    const TICK_WIDTH = 3;

    // Pure geometry pass: measure current layout and place the already-
    // existing overlay elements (never creates/removes anything). Cheap
    // enough to call every animation frame from trackOverlayDuringTransition.
    function applyOverlayGeometry(columnEntries) {
      pointsByDistance.clear();
      if (!chartWrap || !columnEntries.length) return;

      const wrapRect = barRow.getBoundingClientRect();
      const tickTargetsByDistance = new Map();

      columnEntries.forEach(({ group, column, count, distance }) => {
        const groupRect = group.getBoundingClientRect();
        const columnRect = column.getBoundingClientRect();

        const x =
          groupRect.left -
          wrapRect.left +
          groupRect.width / 2;

        const groundY = columnRect.bottom - wrapRect.top;

        const y = groundY - count * activeUnitHeight;

        pointsByDistance.set(distance, { x, y });
        tickTargetsByDistance.set(distance, { x: x - TICK_WIDTH / 2, y: groundY });
      });

      tickTargetsByDistance.forEach((target, distance) => {
        const tick = xAxisTicksByDistance.get(distance);
        if (!tick) return;
        tick.setAttribute("x", target.x);
        tick.setAttribute("y", target.y);
      });

      pointsByDistance.forEach((p, distance) => {
        const circle = circlesByDistance.get(distance);
        if (!circle) return;
        circle.setAttribute("cx", p.x);
        circle.setAttribute("cy", p.y);
      });

      redrawPolyline();
    }

    // Structural pass: creates/removes the persistent circle/tick/line
    // elements to match the current data (called once per actual data
    // change — a hotspot found, species switched, mode toggled — not
    // every frame), then measures and places everything, and finally
    // keeps re-measuring for the duration of the chart's own height
    // transition so the overlay tracks it exactly instead of jumping
    // straight to the final position.
    function renderLineOverlay(columnEntries) {
      currentColumnEntries = columnEntries;
      if (!chartWrap || !columnEntries.length) {
        pointsByDistance.clear();
        return;
      }

      const distances = columnEntries.map((entry) => entry.distance);
      const distanceSet = new Set(distances);
      const connectedOrder = getConnectedOrder();

      distances.forEach((distance) => {
        if (!xAxisTicksByDistance.has(distance)) {
          const tick = document.createElementNS(SVG_NS, "rect");
          tick.classList.add("x-axis-tick-mark");
          tick.setAttribute("width", TICK_WIDTH);
          tick.setAttribute("height", 10);
          xAxisTicksByDistance.set(distance, tick);
          lineOverlaySvg.appendChild(tick);
        }

        let circle = circlesByDistance.get(distance);
        if (!circle) {
          circle = document.createElementNS(SVG_NS, "circle");
          circle.classList.add("line-graph-point");
          circle.setAttribute("r", 7);
          circle.setAttribute("tabindex", "0");
          circle.setAttribute("role", "button");
          circle.setAttribute("aria-label", distance + " metres point");
          circle.addEventListener("click", () => connectGraphPoint(circle, distance));
          circle.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              connectGraphPoint(circle, distance);
            }
          });
          circlesByDistance.set(distance, circle);
          lineOverlaySvg.appendChild(circle);
        }
        circle.classList.toggle("is-connected", connectedOrder.includes(distance));
        circle.classList.toggle(
          "is-next",
          isGraphMode &&
            connectedOrder.length < DISTANCES.length &&
            distance === DISTANCES[connectedOrder.length]
        );
      });

      // Drop ticks/circles for distances that no longer apply (only
      // relevant if DISTANCES itself ever changes at runtime).
      xAxisTicksByDistance.forEach((tick, distance) => {
        if (!distanceSet.has(distance)) {
          tick.remove();
          xAxisTicksByDistance.delete(distance);
        }
      });
      circlesByDistance.forEach((circle, distance) => {
        if (!distanceSet.has(distance)) {
          circle.remove();
          circlesByDistance.delete(distance);
        }
      });

      applyOverlayGeometry(columnEntries);
      trackOverlayDuringTransition(columnEntries);
    }

    const chartResizeObserver = new ResizeObserver(() => {
      if (isGraphMode && currentColumnEntries.length) {
        applyOverlayGeometry(currentColumnEntries);
      }
    });

    chartResizeObserver.observe(barRow);

    function redrawPolyline() {
      const connectedOrder = getConnectedOrder();
      const neededKeys = new Set();

      // Check every adjacent pair of graph points.
      for (let i = 0; i < DISTANCES.length - 1; i += 1) {
        const leftDistance = DISTANCES[i];
        const rightDistance = DISTANCES[i + 1];

        const leftSelected = connectedOrder.includes(leftDistance);
        const rightSelected = connectedOrder.includes(rightDistance);

        // Draw a line only if both neighbouring points have been selected.
        if (leftSelected && rightSelected) {
          const p1 = pointsByDistance.get(leftDistance);
          const p2 = pointsByDistance.get(rightDistance);

          if (!p1 || !p2) continue;

          const key = leftDistance + "->" + rightDistance;
          neededKeys.add(key);

          // Reuse an existing segment rather than recreating it. Its
          // endpoints are just set directly here — this whole function
          // runs on every sampled frame of the chart's height transition
          // (see applyOverlayGeometry/trackOverlayDuringTransition), so
          // the smooth motion comes from being re-measured and re-drawn
          // every frame, not from animating this one call's values.
          let line = linesByKey.get(key);
          if (!line) {
            line = document.createElementNS(SVG_NS, "line");
            line.setAttribute("class", "line-graph-path");
            linesByKey.set(key, line);
            // Put the line behind the circles.
            lineOverlaySvg.insertBefore(line, lineOverlaySvg.firstChild);
          }

          line.setAttribute("x1", p1.x);
          line.setAttribute("y1", p1.y);
          line.setAttribute("x2", p2.x);
          line.setAttribute("y2", p2.y);
        }
      }

      // Remove any segment that's no longer connected.
      linesByKey.forEach((line, key) => {
        if (!neededKeys.has(key)) {
          line.remove();
          linesByKey.delete(key);
        }
      });

      checkGraphComplete();
    }

    function refreshGraphPointGuidance() {
      const connectedOrder = getConnectedOrder();
      const nextDistance = connectedOrder.length < DISTANCES.length
        ? DISTANCES[connectedOrder.length]
        : null;

      circlesByDistance.forEach((circle, distance) => {
        circle.classList.toggle("is-connected", connectedOrder.includes(distance));
        circle.classList.toggle(
          "is-next",
          isGraphMode && nextDistance !== null && distance === nextDistance
        );
      });
    }

    // Students connect the graph in x-axis order. This keeps the interaction
    // simple and makes the line appear in the same left-to-right direction
    // that they read the distance scale.
    function connectGraphPoint(circle, distance) {
      if (!selectedSpecies || !isGraphMode) return;

      const connectedOrder = getConnectedOrder();
      const expectedDistance = DISTANCES[connectedOrder.length];

      if (connectedOrder.includes(distance)) return;

      if (distance !== expectedDistance) {
        circle.classList.remove("is-shake");
        void circle.getBoundingClientRect();
        circle.classList.add("is-shake");
        window.setTimeout(() => circle.classList.remove("is-shake"), 320);

        if (graphBuildInstruction) {
          graphBuildInstruction.textContent =
            "Connect the points from left to right. Click " + expectedDistance + " m next.";
        }
        return;
      }

      connectedOrder.push(distance);
      graphConnections.set(selectedSpecies, connectedOrder);

      refreshGraphPointGuidance();
      redrawPolyline();
      updateProgressAndGraphButton();
    }

    // Every point connected == the graph is done. Shows/hides the
    // completion banner below the "Count by distance" activity-card.
    function checkGraphComplete() {
      const anyGraphComplete = TARGET_SPECIES.some((name) => {
        const connections = graphConnections.get(name) || [];
        return connections.length === DISTANCES.length;
      });

      const currentGraphComplete = Boolean(
        selectedSpecies &&
        (graphConnections.get(selectedSpecies) || []).length === DISTANCES.length
      );

      if (graphCompleteFeedback) {
        graphCompleteFeedback.hidden = !currentGraphComplete;
      }

      nextButton.hidden = !anyGraphComplete;

      return currentGraphComplete;
    }

    // Clears the click-to-connect progress and hides the completion
    // banner — called anywhere the underlying counts/species change
    // and any drawn connections stop making sense.
    function resetGraphConnections() {
      if (selectedSpecies) {
        graphConnections.set(selectedSpecies, []);
      }

      if (graphCompleteFeedback) {
        graphCompleteFeedback.hidden = true;
      }

      nextButton.hidden = true;
    }

    function resetAllGraphConnections() {
      TARGET_SPECIES.forEach((name) => {
        graphConnections.set(name, []);
      });

      if (graphCompleteFeedback) {
        graphCompleteFeedback.hidden = true;
      }

      nextButton.hidden = true;
    }

    function updateProgressAndGraphButton() {
      // Queried fresh each call: panelBody is emptied and refilled from a
      // <template class="panel-content"> every time the panel opens for a
      // new distance, so any .species-progress element found earlier is
      // stale/detached by the time this runs.
      const progressEl = panelBody.querySelectorAll(".species-progress");

      if (!selectedSpecies) {
        for (const speciesProgress of progressEl) {
          speciesProgress.hidden = true;
        }

        if (graphBuildPrompt) graphBuildPrompt.hidden = true;
        if (findAllPrompt) findAllPrompt.hidden = true;
        if (graphToggleButton) {
          graphToggleButton.disabled = true;
          graphToggleButton.hidden = false;
          graphToggleButton.textContent = "Show data points";
        }
        if (countersHiddenButton) {
          countersHiddenButton.hidden = true;
          countersHiddenButton.classList.remove("is-active");
          countersHiddenButton.textContent = "Hide counters";
        }
        return;
      }

      const { found, max } = totalsFor(selectedSpecies);
      const allFound = max > 0 && found === max;
      const connectedOrder = getConnectedOrder();
      const graphComplete = connectedOrder.length === DISTANCES.length;

      const stuckLongEnough =
        !allFound &&
        hasExaminedAllQuadrats(selectedSpecies) &&
        searchTimeElapsed(selectedSpecies) >= FIND_ALL_DELAY_MS;
      if (findAllPrompt) findAllPrompt.hidden = !stuckLongEnough;

      const quadrantFound = selected !== null ? foundAtDistance(selectedSpecies, String(selected)) : 0;
      const quadrantMax = selected !== null ? maxAtDistance(selectedSpecies, String(selected)) : 0;

      for (const speciesProgress of progressEl) {
        const title = speciesProgress.querySelector(".species-progress-title");
        const count = speciesProgress.querySelector(".species-progress-count");
        speciesProgress.hidden = false;
        title.textContent = selectedSpecies + ": found ";
        count.textContent = quadrantFound + " of " + quadrantMax;

        count.animate([
          { opacity: 0, transform: "translateY(0) scale(0.5)" },
          { opacity: 1, transform: "translateY(-6px)" },
          { transform: "translateY(2px) scale(1)" },
          { transform: "translateY(0)" },
        ], { duration: 500 });
      }

      if (graphBuildPrompt) graphBuildPrompt.hidden = !allFound;

      if (!allFound) {
        if (graphToggleButton) {
          graphToggleButton.disabled = true;
          graphToggleButton.hidden = false;
          graphToggleButton.textContent = "Show data points";
        }
        if (countersHiddenButton) countersHiddenButton.hidden = true;
        return;
      }

      if (!isGraphMode) {
        if (graphBuildInstruction) {
          graphBuildInstruction.textContent =
            "You found every " + selectedSpecies + ". Now show those five counts as data points.";
        }
        if (graphToggleButton) {
          graphToggleButton.disabled = false;
          graphToggleButton.hidden = false;
          graphToggleButton.textContent = "Show data points";
        }
        if (countersHiddenButton) countersHiddenButton.hidden = true;
        return;
      }

      if (graphToggleButton) graphToggleButton.hidden = true;

      if (graphComplete) {
        if (graphBuildInstruction) {
          graphBuildInstruction.textContent =
            "Great — the counters and the line show the same data. Hide the counters to see the line more clearly.";
        }
        if (countersHiddenButton) {
          countersHiddenButton.hidden = false;
          countersHiddenButton.textContent = isCountersHidden ? "Show counters" : "Hide counters";
        }
      } else {
        const nextDistance = DISTANCES[connectedOrder.length];
        if (graphBuildInstruction) {
          graphBuildInstruction.textContent =
            "Click the highlighted points from left to right to connect the line. Start with " + nextDistance + " m.";
        }
        if (countersHiddenButton) countersHiddenButton.hidden = true;
      }
    }

    // Persistent per-distance {group, column, label, units} so renderChart()
    // can update an existing column's height/count in place instead of
    // destroying and recreating it every render. A destroyed-and-rebuilt
    // element has no "before" state, so nothing about it (its own height
    // transition, or anything laid out relative to it, like the label
    // sitting below it) can ever animate — that's what was making the
    // labels and everything else in the chart jump instead of glide.
    const columnEntriesByDistance = new Map();
    let lastRenderedSpecies = undefined;

    function updateSelectedDistanceHighlight() {
      columnEntriesByDistance.forEach((entry, distance) => {
        entry.group.classList.toggle(
          "is-current-distance",
          selected !== null && String(selected) === String(distance)
        );
      });
    }

    function resetColumnEntries() {
      barRow.innerHTML = "";
      columnEntriesByDistance.clear();
    }

    function renderChart() {
      if (!barRow) return;

      if (!selectedSpecies) {
        resetColumnEntries();
        if (chartWrap) {
          chartWrap.classList.add("is-empty");
          chartWrap.classList.remove("is-graph-mode", "counters-hidden");
          chartWrap.style.removeProperty("--row-height");
        }
        const placeholder = document.createElement("p");
        placeholder.className = "stack-placeholder";
        placeholder.textContent = "Select a distance, then choose an animal on the left. Its counts will appear here.";
        barRow.appendChild(placeholder);
        if (yAxis) yAxis.innerHTML = "";
        lastRenderedSpecies = null;
        updateProgressAndGraphButton();
        return;
      }

      if (chartWrap) chartWrap.classList.remove("is-empty");

      // A fresh species has a completely different dataset (and colour),
      // so there's nothing meaningful to animate between the two — start
      // its columns from scratch rather than trying to reuse the last
      // species' cylinders (which would otherwise keep their old colour).
      if (selectedSpecies !== lastRenderedSpecies) {
        resetColumnEntries();
        lastRenderedSpecies = selectedSpecies;
      }

      const colour = speciesColours.get(selectedSpecies) || barColours[0];
      const maxUnits = overallMaxForSpecies(selectedSpecies);
      
      activeUnitHeight = isGraphMode && isCountersHidden
          ? CYLINDER_UNIT_HEIGHT * STRETCH_FACTOR
          : CYLINDER_UNIT_HEIGHT;

      const rowHeight = Math.max(1, maxUnits) * activeUnitHeight;

      if (chartWrap) {
        chartWrap.style.setProperty("--row-height", rowHeight + "px");
      }

      buildYAxis(maxUnits);

      const columnEntries = [];

      DISTANCES.forEach((distance) => {
        const count = foundAtDistance(selectedSpecies, distance);

        let entry = columnEntriesByDistance.get(distance);
        if (!entry) {
          const group = document.createElement("div");
          group.className = "stack-group";
          group.dataset.distance = distance;

          const column = document.createElement("div");
          column.className = "bar-stack-column";

          const label = document.createElement("div");
          label.className = "bar-stack-label";

          group.appendChild(column);
          group.appendChild(label);
          barRow.appendChild(group);

          entry = { group, column, label, units: [] };
          columnEntriesByDistance.set(distance, entry);
        }

        // Add only the newly-found units (each still gets its pop-in
        // animation) and drop any that are no longer found, instead of
        // rebuilding the whole stack.
        while (entry.units.length < count) {
          const i = entry.units.length;
          const unit = document.createElement("div");
          unit.className = "stack-unit";
          unit.style.animationDelay = i * 0.05 + "s";
          createCylinder(unit, colour);
          entry.column.appendChild(unit);
          entry.units.push(unit);
        }
        while (entry.units.length > count) {
          entry.units.pop().remove();
        }

        entry.label.innerHTML = distance + " m<span>" + count + "</span>";
        entry.group.classList.toggle(
          "is-current-distance",
          selected !== null && String(selected) === String(distance)
        );

        columnEntries.push({
          group: entry.group,
          column: entry.column,
          count,
          distance
        });
      });

      barRow.appendChild(lineOverlaySvg);
      renderLineOverlay(columnEntries);
      updateProgressAndGraphButton();
    }

    function revealAnimalStageWhenReady(container) {
      const animalStage = container.querySelector(".animal-stage");
      const background = animalStage && animalStage.querySelector(".stage-bg");
      if (!animalStage || !background) return;

      animalStage.classList.remove("is-ready", "has-load-error");
      animalStage.setAttribute("aria-busy", "true");

      const reveal = () => {
        const finish = () => {
          window.requestAnimationFrame(() => {
            animalStage.classList.add("is-ready");
            animalStage.removeAttribute("aria-busy");
          });
        };

        if (typeof background.decode === "function") {
          background.decode().catch(() => {}).then(finish);
        } else {
          finish();
        }
      };

      const fail = () => {
        animalStage.classList.add("has-load-error");
        animalStage.removeAttribute("aria-busy");
      };

      if (background.complete) {
        if (background.naturalWidth > 0) reveal();
        else fail();
        return;
      }

      background.addEventListener("load", reveal, { once: true });
      background.addEventListener("error", fail, { once: true });
    }

    // Sets up the tint overlay (masked to that hotspot's own sprite, so
    // any image works), restores found/unfound state, and dims out any
    // hotspot that isn't the currently-selected species, onto whichever
    // clone of the template was just inserted into panelBody.
    function wireUpHotspots(container) {
      container.querySelectorAll(".animal-hotspot").forEach((hotspot) => {
        const id = hotspot.dataset.hotspotId;
        const name = hotspotSpecies.get(id);
        const sprite = hotspot.querySelector("img");
        const overlay = hotspot.querySelector(".animal-overlay");

        if (sprite && overlay) {
          overlay.style.maskImage = 'url("' + sprite.getAttribute("src") + '")';
          overlay.style.webkitMaskImage = 'url("' + sprite.getAttribute("src") + '")';
          const colour = speciesColours.get(name);
          if (colour) overlay.style.background = colour;
        }

        hotspot.classList.toggle("found", Boolean(hotspotFound.get(id)));
        hotspot.classList.toggle("highlighted", highlightedHotspotIds.has(id));
        hotspot.classList.toggle("is-inactive", !selectedSpecies || name !== selectedSpecies);
      });
    }

    // Delegated listener: panelBody's contents are replaced every time
    // a new distance is opened, so this is attached once on the parent
    // rather than re-bound on every clone.
    if (panelBody) {
      panelBody.addEventListener("click", (event) => {
        const hotspot = event.target.closest(".animal-hotspot");
        if (!hotspot || !panelBody.contains(hotspot)) return;

        const id = hotspot.dataset.hotspotId;
        const name = hotspotSpecies.get(id);
        if (!selectedSpecies || name !== selectedSpecies) return;

        const nowFound = !hotspotFound.get(id);
        hotspotFound.set(id, nowFound);
        hotspot.classList.toggle("found", nowFound);

        // The counts (and so the point positions) just changed, so any
        // graph construction based on the previous counts no longer means
        // anything. Return to the counter view and let the student reveal
        // the points again once this species is complete.
        isGraphMode = false;
        isCountersHidden = false;
        if (chartWrap) chartWrap.classList.remove("is-graph-mode", "counters-hidden");
        resetGraphConnections();
        renderChart();
      });
    }

    function selectSpecies(name) {
      selectedSpecies = name;
      isGraphMode = false;
      isCountersHidden = false;
      resetGraphConnections();
      if (chartWrap) chartWrap.classList.remove("is-graph-mode", "counters-hidden");
      if (graphToggleButton) {
        graphToggleButton.hidden = false;
        graphToggleButton.textContent = "Show data points";
      }
      if (countersHiddenButton) {
        countersHiddenButton.hidden = true;
        countersHiddenButton.classList.remove("is-active");
        countersHiddenButton.textContent = "Hide counters";
      }

      speciesButtons.forEach((btn) => {
        const isActive = btn.dataset.species === name;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
      });

      if (panelBody) wireUpHotspots(panelBody);
      renderChart();
    }

    speciesButtons.forEach((btn) => {
      btn.addEventListener("click", () => selectSpecies(btn.dataset.species));
    });

    // Lets a student who has genuinely checked every quadrat but still
    // can't spot every hotspot move on anyway: marks the rest of that
    // species found so the chart and connect-the-points step unlock.
    function revealAllForSpecies(name) {
      hotspotSpecies.forEach((species, id) => {
        // if (species === name) hotspotFound.set(id, true);
        // Put HIGHLIGHT ALL code here
        if (species === name) highlightedHotspotIds.add(id);
      });

      isGraphMode = false;
      isCountersHidden = false;
      if (chartWrap) chartWrap.classList.remove("is-graph-mode", "counters-hidden");
      resetGraphConnections();

      if (speciesSearchTimeout.has(name)) {
        window.clearTimeout(speciesSearchTimeout.get(name));
        speciesSearchTimeout.delete(name);
      }

      if (panelBody) wireUpHotspots(panelBody);
      renderChart();
    }

    if (findAllButton) {
      findAllButton.addEventListener("click", () => {
        if (!selectedSpecies) return;
        revealAllForSpecies(selectedSpecies);
      });
    }

    if (graphToggleButton) {
      graphToggleButton.addEventListener("click", () => {
        if (graphToggleButton.disabled || isGraphMode) return;

        // This is intentionally one-way: first reveal the plotted points,
        // then let the student construct the line. We don't call this
        // "Show line graph" before a line actually exists.
        isGraphMode = true;
        isCountersHidden = false;
        resetGraphConnections();

        if (chartWrap) {
          chartWrap.classList.add("is-graph-mode");
          chartWrap.classList.remove("counters-hidden");
        }
        if (countersHiddenButton) {
          countersHiddenButton.hidden = true;
          countersHiddenButton.classList.remove("is-active");
          countersHiddenButton.textContent = "Hide counters";
        }

        renderChart();
      });
    }

    if (countersHiddenButton) {
      countersHiddenButton.addEventListener("click", () => {
        if (countersHiddenButton.disabled || countersHiddenButton.hidden) return;
        isCountersHidden = !isCountersHidden;
        countersHiddenButton.classList.toggle("is-active", isCountersHidden);
        countersHiddenButton.textContent = isCountersHidden ? "Show counters" : "Hide counters";
        if (chartWrap) chartWrap.classList.toggle("counters-hidden", isCountersHidden);
        renderChart();
      });
    }

    function resetAnimalTracking() {
      hotspotFound.forEach((_value, id) => hotspotFound.set(id, false));
      highlightedHotspotIds.clear();
      if (panelBody) {
        panelBody.querySelectorAll(".animal-hotspot.found").forEach((h) => h.classList.remove("found"));
        panelBody.querySelectorAll(".animal-hotspot.highlighted").forEach((h) => h.classList.remove("highlighted"));
      }

      selectedSpecies = null;
      isGraphMode = false;
      isCountersHidden = false;
      resetAllGraphConnections()
      clearSpeciesSearchTimers();
      if (chartWrap) {
        chartWrap.classList.remove("is-graph-mode", "counters-hidden");
        chartWrap.classList.add("is-empty");
        chartWrap.style.removeProperty("--row-height");
      }
      if (graphBuildPrompt) graphBuildPrompt.hidden = true;
      if (findAllPrompt) findAllPrompt.hidden = true;
      if (graphToggleButton) {
        graphToggleButton.hidden = false;
        graphToggleButton.textContent = "Show data points";
      }
      if (countersHiddenButton) {
        countersHiddenButton.hidden = true;
        countersHiddenButton.classList.remove("is-active");
        countersHiddenButton.textContent = "Hide counters";
      }
      speciesButtons.forEach((btn) => {
        btn.classList.remove("is-active");
        btn.setAttribute("aria-pressed", "false");
        btn.disabled = true;
      });

      if (panelBody) wireUpHotspots(panelBody);
      renderChart();
    }

    renderChart();

    function percentFor(distance) {
      return ((distance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)) * 100;
    }

    function clamp(distance) {
      return Math.min(MAX_DISTANCE, Math.max(MIN_DISTANCE, distance));
    }

    function personLeftForPoint(point, fallbackDistance) {
      if (!point) return percentFor(fallbackDistance);

      const stageRect = stage.getBoundingClientRect();
      const pointRect = point.getBoundingClientRect();
      if (!stageRect.width || !pointRect.width) return percentFor(fallbackDistance);

      const pointCentre = pointRect.left + pointRect.width / 2;
      return ((pointCentre - stageRect.left) / stageRect.width) * 100;
    }

    // Makes the panel visually "grow" from whichever point was selected,
    // even though its final size/position is a big box centered above
    // the stage rather than a small popover tied to that point.
    function setPanelOriginToPoint(point) {
      const stageRect = stage.getBoundingClientRect();
      const pointRect = point.getBoundingClientRect();
      const panelWidth = panel.offsetWidth || 1;
      const panelLeftEdge = stageRect.left + (stageRect.width - panelWidth) / 2;
      const pointCenterX = pointRect.left + pointRect.width / 2;
      let originX = ((pointCenterX - panelLeftEdge) / panelWidth) * 100;
      originX = Math.max(0, Math.min(100, originX));
      panel.style.transformOrigin = originX + "% 100%";
    }

    function fillPanelContent(distance) {
      const template = templates.find((t) => t.dataset.distance === String(distance));
      panelBody.innerHTML = "";
      if (template) {       
        panelBody.appendChild(template.content.cloneNode(true));
        wireUpHotspots(panelBody);
        revealAnimalStageWhenReady(panelBody);
      }
    }

    function openPanelFor(distance, point) {
      setPanelOriginToPoint(point);
      fillPanelContent(distance);

      if (selectedSpecies) {
        let visited = speciesVisitedDistances.get(selectedSpecies);
        if (!visited) {
          visited = new Set();
          speciesVisitedDistances.set(selectedSpecies, visited);
        }
        visited.add(String(distance));

        // The 2-minute countdown only begins once every quadrat has been
        // opened for this species — not from when the species was picked.
        if (hasExaminedAllQuadrats(selectedSpecies)) {
          ensureSpeciesSearchTimer(selectedSpecies);
        }
      }

      updateProgressAndGraphButton();
      panel.classList.add("is-open");
    }

    function showPanelFor(distance, point) {
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
      if (panel.classList.contains("is-open")) {
        // Shrink back toward the previously selected point first, then
        // grow again from the newly selected one.
        panel.classList.remove("is-open");
        closeTimer = window.setTimeout(() => {
          openPanelFor(distance, point);
          closeTimer = null;
        }, CLOSE_MS);
      } else {
        openPanelFor(distance, point);
      }
    }

    function closePanel() {
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
      panelBody.innerHTML = "";
      panel.classList.remove("is-open");
    }

    function moveTo(distance, focusPoint) {
      const target = clamp(distance);
      const value = String(target);
      const point = points.find((p) => p.dataset.distance === value);
      if (!point) return;

      selected = target;
      updateSelectedDistanceHighlight();
      
      speciesButtons.forEach((btn) => {
        btn.disabled = false;
      });

      points.forEach((p) => {
        p.classList.remove("is-selected");
        p.setAttribute("aria-expanded", "false");
      });
      point.classList.add("is-selected");
      point.setAttribute("aria-expanded", "true");

      note.textContent = "You selected " + target + " metres.";

      // Hand off to the person-marker state machine - it decides whether
      // this needs a walk, an instant placement, or nothing at all.
      movePerson(target, point);
      if (focusPoint) point.focus();
    }

    function closeAll() {
      closePanel();
      points.forEach((p) => {
        p.classList.remove("is-selected");
        p.setAttribute("aria-expanded", "false");
      });
      note.textContent = "Select a point to look for the animals at that distance.";
    }

    function step(direction) {
      // Treat "no selection yet" as resting at 0 m, since that's where
      // the person visually starts.
      const base = selected === null ? 0 : selected;
      moveTo(base + direction * STEP, true);
    }

    const PersonMove = Object.freeze({
      IDLE: 0,
      STANDING: 1,
      WALKING: 2,
      PLACING: 3,
    });

    const PERSON_IMAGE_BASE = "../images/lesson4/number_line_activity/";

    const PERSON_IMAGES = {
      [PersonMove.IDLE]: "person.png",
      [PersonMove.STANDING]: "person_standing.gif",
      [PersonMove.WALKING]: "person_walking.gif",
      [PersonMove.PLACING]: "person_investigating.gif",
    };

    Object.values(PERSON_IMAGES).forEach((filename) => {
      preloadNumberLineImage(PERSON_IMAGE_BASE + filename);
    });

    const STANDING_GIF_DURATION_MS = 1300; // sum of person_standing.gif's frame delays
    const INVESTIGATE_GIF_DURATION_MS = 1300; // sum of person_investigating.gif's frame delays

    // --- Person-marker state machine -----------------------------------
    // States: IDLE (the very first resting state, at 0 m, before anything
    // has been clicked) -> STANDING (plays its gif once, then hands off)
    // -> WALKING (mid-transition) -> PLACING (arrived, panel open) ->
    // click a new point -> STANDING -> WALKING -> PLACING -> ...
    // Rules baked into movePerson():
    //   - IDLE + click the point already stood on (0 m, at the very
    //     start) -> straight to PLACING, no walk.
    //   - PLACING + click the *same* point that's open -> no state change.
    //   - Any other click -> STANDING (waits for its gif to finish) ->
    //     WALKING -> PLACING.
    let personState = PersonMove.IDLE;
    let currentDistance = 0; // updated the instant a walk starts, not on arrival - always "where the marker is currently headed"
    let lastDirection = 1;   // which way the marker is currently facing
    let personStandingTimer = null;

    function clearPendingPersonTimers() {
      if (personArriveHandler) {
        person.removeEventListener("transitionend", personArriveHandler);
        personArriveHandler = null;
      }
      if (personStandingTimer) {
        window.clearTimeout(personStandingTimer);
        personStandingTimer = null;
      }
    }

    function enterIdle() {
      clearPendingPersonTimers();
      personState = PersonMove.IDLE;
      person.src = PERSON_IMAGE_BASE + PERSON_IMAGES[PersonMove.IDLE];
    }

    function enterStanding(target, point) {
      clearPendingPersonTimers();
      personState = PersonMove.STANDING;
      person.src = PERSON_IMAGE_BASE + PERSON_IMAGES[PersonMove.STANDING];

      // Let the standing gif play through once before moving on to the walk.
      personStandingTimer = window.setTimeout(() => {
        personStandingTimer = null;
        enterWalking(target, point);
      }, STANDING_GIF_DURATION_MS);
    }

    function enterWalking(target, point) {
      // Retargeting mid-walk (or arriving from STANDING/IDLE) shouldn't
      // leave a stale "arrived" callback from a previous target pending.
      clearPendingPersonTimers();
      personState = PersonMove.WALKING;

      // Math.sign(0) is 0, which would zero out the scaleX() flip below -
      // when the target hasn't actually moved, keep facing whichever way
      // the person was last facing instead of collapsing to width 0.
      // currentDistance is compared against BEFORE being updated below, so
      // retargeting mid-walk (currentDistance still holds the *previous*
      // target, not the original starting point) gives the direction of
      // the leg actually being walked right now, not the very first one.
      const rawDirection = Math.sign(target - currentDistance);
      const direction = rawDirection !== 0 ? rawDirection : (lastDirection || 1);
      lastDirection = direction;
      currentDistance = target;

      person.src = PERSON_IMAGE_BASE + PERSON_IMAGES[PersonMove.WALKING];
      person.style.transform = `translateX(-50%) scaleX(${direction})`;
      person.style.left = personLeftForPoint(point, target) + "%";

      personArriveHandler = (event) => {
        if (event.propertyName !== "left") return;
        person.removeEventListener("transitionend", personArriveHandler);
        personArriveHandler = null;
        enterPlacing(target, point);
      };
      person.addEventListener("transitionend", personArriveHandler);
    }

    function enterPlacing(target, point) {
      personState = PersonMove.PLACING;
      currentDistance = target;
      person.src = PERSON_IMAGE_BASE + PERSON_IMAGES[PersonMove.PLACING];
      window.setTimeout(() => {
        showPanelFor(target, point);
      }, INVESTIGATE_GIF_DURATION_MS);
    }

    // Entry point - call this whenever the user picks a distance (a
    // number-line click, or a reset). Walks the state machine described
    // above; target is a distance in metres (0-20), not a pixel offset.
    function movePerson(target, point) {
      if (personState === PersonMove.PLACING && target === currentDistance) {
        if (!panel.classList.contains("is-open")) showPanelFor(target, point);
        return;
      }

      if (personState === PersonMove.IDLE && target === currentDistance) {
        enterPlacing(target, point); // the very first click, already at this point - skip the walk
        return;
      }

      if (personState === PersonMove.IDLE || personState === PersonMove.WALKING) {
        // Already IDLE-to-first-click, or already mid-walk: just (re)walk
        // straight to the new target - no need to replay the standing gif.
        enterWalking(target, point);
        return;
      }

      enterStanding(target, point);
    }

    // Hard reset - snaps back to 0 m instantly (no walk animation), back
    // to IDLE (not STANDING - that state only ever occurs when leaving a
    // PLACING), and cancels anything in flight. Used on page load and by
    // the reset button.
    function resetPerson() {
      enterIdle();
      currentDistance = 0;
      const firstPoint = points.find((point) => point.dataset.distance === String(MIN_DISTANCE));
      person.style.left = personLeftForPoint(firstPoint, MIN_DISTANCE) + "%";
      person.style.transform = "translateX(-50%)";
    }

    points.forEach((point) => {
      point.setAttribute("aria-expanded", "false");
      point.addEventListener("click", () => {
        moveTo(Number(point.dataset.distance), false);
      });
    });

    panelClose.addEventListener("click", closeAll);

    // backArrow.addEventListener("click", () => step(-1));
    // forwardArrow.addEventListener("click", () => step(1));

    if (resetButton) {
      resetButton.addEventListener("click", () => {
        closeAll();
        resetAnimalTracking();

        speciesButtons.forEach((btn) => {
          btn.disabled = true;
        });

        // closeAll() only clears the selection/panel — also put the
        // person marker back at its resting 0 m spot (snapping, not
        // walking, and back to the idle image) and re-disable the
        // back arrow, matching the very first render of the page.
        selected = null;
        resetPerson();
      });
    }

    // Initial state: person at 0 m, standing image, nothing open, back arrow disabled.
    resetPerson();
  }

  /* ==================================================
     PAGE INITIALISATION
     ================================================== */

  // Preserve the current working-page behaviour. Set to false before release
  // when students should unlock Parts A-D progressively.
  const DEV_MODE = false;

  const sectionIds = [
      { id: "marine-snail-context", label: "Victorian Marine Snails" },
      { id: "number-line-activity", label: "Explore How a Line Graph Works" },
      { id: "line-graph-elephant", label: "Turn a Data Table into a Line Graph" },
      { id: "line-graph-conniwinks", label: "Build a Line Graph" },
      { id: "line-graph-yeast", label: "Practise Applying the Principles" },
      { id: "line-graph-plants", label: "Plotting Time on the x-axis" },
  ];

  const teacherBackLink = {
      label: "← Back to Part A",
      href: "lesson4.html",
  };

  document.addEventListener("DOMContentLoaded", function() {
    if (typeof initialiseTeacherMenu === "function") {
      initialiseTeacherMenu(sectionIds, "marine-snail-context", teacherBackLink);
    }

    if (DEV_MODE && typeof teacherShowAll === "function") {
      teacherShowAll();
    }

    initNumberLineActivity(document.getElementById("number-line-activity"));
  });
})();
