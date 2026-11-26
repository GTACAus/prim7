// Global styles first, so they come before every component style (like the old <link>s did).
import "./styles/base.css";
import "./styles/print.css";
import { createApp } from "vue";
import { createPinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import { pageEntered, trackPageLoading } from "./composables/usePageLoading.js";
import "./styles/themes.css";
// Page stylesheets shared by two lessons. Loaded here (not by the lessons) so
// they always come before the lessons' own CSS, whichever page loads first; their
// :root:is([data-page]) wrapper keeps them winning the ties they used to win.
import "./styles/pages/data-tables.css";
import "./styles/pages/graphs.css";
// classroom language filter: start loading the word list straight away
import "./composables/useClassroomLanguageFilter.js";

// Each page is a view. Links between pages are <RouterLink>s (Button's `to`),
// so moving between pages doesn't reload: CSS loaded for one page stays in the
// document, which is why every page's styles are scoped.
// A route's name is put on <html data-page="..."> so a page's stylesheet can be
// scoped to it: [data-page="lesson5"] { ... } (see src/styles/pages/).
// meta drives the page header in App.vue: header:false hides it, save shows
// "Save my work" instead of Home
const routes = [
  {
    path: "/",
    name: "home",
    meta: {
      header: false,
    },
    component: () => import("./views/HomeView.vue"),
  },
  {
    path: "/pretask",
    name: "pretask",
    meta: {
      save: true,
    },
    component: () => import("./views/PretaskView.vue"),
  },
  {
    path: "/plant-experiment",
    name: "plant-experiment",
    meta: { theme: "simple" },
    component: () => import("./views/PlantExperiment.vue"),
  },
  {
    path: "/lesson1",
    name: "lesson1",
    component: () => import("./views/Lesson1View.vue"),
  },
  {
    path: "/lesson2",
    name: "lesson2",
    component: () => import("./views/Lesson2View.vue"),
  },
  {
    path: "/lesson3",
    name: "lesson3",
    component: () => import("./views/Lesson3View.vue"),
  },
  {
    path: "/lesson4",
    name: "lesson4",
    component: () => import("./views/Lesson4View.vue"),
  },
  {
    path: "/lesson5",
    name: "lesson5",
    meta: {},
    component: () => import("./views/Lesson5View.vue"),
  },
  {
    path: "/lesson6",
    name: "lesson6",
    component: () => import("./views/Lesson6View.vue"),
  },
  {
    path: "/lesson7",
    name: "lesson7",
    meta: {
      theme: "dark",
      stylesheets: [
        "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Oxanium:wght@400;500;600;700;800&family=Share+Tech+Mono&display=swap",
      ],
    },
    component: () => import("./views/Lesson7View.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // A new page starts at the top, once the old page has faded out and the new
  // one starts to enter (App.vue's transition). Links within a page (e.g.
  // "Return to Top", href="#") are left to the browser. A lesson then restores
  // its own saved position (Page.vue).
  async scrollBehavior(to, from) {
    if (to.path === from.path) return false;
    await pageEntered();
    return { top: 0 };
  },
});

const stylesheetLoads = new Map();

function loadStylesheet(href) {
  const existingLoad = stylesheetLoads.get(href);
  if (existingLoad) return existingLoad;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;

  const load = new Promise((resolve, reject) => {
    link.addEventListener("load", resolve, { once: true });
    link.addEventListener(
      "error",
      () => {
        stylesheetLoads.delete(href);
        link.remove();
        reject(new Error(`Failed to load stylesheet: ${href}`));
      },
      { once: true },
    );
    document.head.appendChild(link);
  });

  stylesheetLoads.set(href, load);
  return load;
}

router.beforeEach(async (to) => {
  await Promise.all((to.meta.stylesheets ?? []).map(loadStylesheet));
});

// the loading spinner and the page's data-page / data-theme (usePageLoading.js)
trackPageLoading(router);

createApp(App).use(createPinia()).use(router).mount("#app");
