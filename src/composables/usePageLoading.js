/*
  Page loading state and the per-page <html> attributes.

  pageLoading: true while the next page's code is downloading (first visit to
  a lesson), shown by App.vue as a <LoadSpinner>. It only turns on after a
  short delay, so pages that are already loaded don't flash a spinner.

  applyPage(route): puts the route's name on <html data-page> (page-scoped
  styles, see src/styles/pages/) and its meta.theme on <html data-theme>.
  App.vue calls it when the new page starts to enter, after the old page has
  finished its leave transition, so the old page keeps its styles while it
  fades out. The very first page is applied straight away.
*/
import { ref } from "vue";
import { START_LOCATION } from "vue-router";

export const pageLoading = ref(false);

const SPINNER_DELAY = 0; // ms

// Resolves when the page being navigated to starts entering; the router's
// scrollBehavior waits for it, so the old page doesn't jump to the top while it
// fades out.
let enterPage = () => {};
let entered = Promise.resolve();
export const pageEntered = () => entered;

export function applyPage(route) {
  enterPage();
  const html = document.documentElement;
  html.dataset.page = route.name;
  // colour theme for the page (see src/styles/themes.css)
  if (route.meta.theme) html.dataset.theme = route.meta.theme;
  else delete html.dataset.theme;
}

export function trackPageLoading(router) {
  let timer = null;
  const stop = () => {
    clearTimeout(timer);
    pageLoading.value = false;
  };

  router.beforeEach((to, from) => {
    if (to.path !== from.path)
      entered = new Promise((resolve) => (enterPage = resolve));
    clearTimeout(timer);
    timer = setTimeout(() => (pageLoading.value = true), SPINNER_DELAY);
  });

  router.afterEach((to, from) => {
    stop();
    if (from === START_LOCATION) applyPage(to);
  });

  router.onError(() => {
    stop();
    enterPage();
  });
}
