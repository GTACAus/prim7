// Global styles first, so they come before every component style (like the old <link>s did).
import "./styles/base.css";
import "./styles/print.css";
import { createApp } from "vue";
import { createPinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import "./styles/themes.css";
// classroom language filter: start loading the word list straight away
import "./composables/useClassroomLanguageFilter.js";

// Each page is a view. Links between pages are plain absolute paths (e.g. /lesson4)
// and do a full page load, so a page's global styles and scripts never leak into the next.
// meta drives the page header in App.vue: header:false hides it, save shows
// "Save my work" instead of Home, backHref / backLabel add a button back to the
// previous lesson.
const routes = [
  {
    path: "/",
    meta: {
      header: false,
    },
    component: () => import("./views/HomeView.vue"),
  },
  {
    path: "/pretask",
    meta: {
      save: true,
    },
    component: () => import("./views/PretaskView.vue"),
  },
  {
    path: "/plant-experiment",
    component: () => import("./views/PlantExperiment.vue"),
  },
  {
    path: "/lesson1",
    component: () => import("./views/Lesson1View.vue"),
  },
  {
    path: "/lesson2",
    component: () => import("./views/Lesson2View.vue"),
  },
  {
    path: "/lesson3",
    component: () => import("./views/Lesson3View.vue"),
  },
  {
    path: "/lesson4",
    meta: {
      backHref: "/lesson3",
      backLabel: "Lesson 3",
    },
    component: () => import("./views/Lesson4View.vue"),
  },
  {
    path: "/lesson5",
    meta: {},
    component: () => import("./views/Lesson5View.vue"),
  },
  {
    path: "/lesson6",
    meta: {
      backHref: "/lesson5",
      backLabel: "Lesson 5",
    },
    component: () => import("./views/Lesson6View.vue"),
  },
  {
    path: "/lesson7",
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
  // colour theme for the page (see src/styles/themes.css)
  if (to.meta.theme) document.documentElement.dataset.theme = to.meta.theme;
  else delete document.documentElement.dataset.theme;
  await Promise.all((to.meta.stylesheets ?? []).map(loadStylesheet));
});

createApp(App).use(createPinia()).use(router).mount("#app");
