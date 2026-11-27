/*
  URL of a file in public/ (images, videos, worksheets, downloads...).

    asset("images/lesson1/l1-default.png")
      -> "/images/lesson1/l1-default.png"          locally
      -> "/prim7/images/lesson1/l1-default.png"    on GitHub Pages (base "/prim7/")

  Use it for every public/ file referenced from a template or script, instead of
  "../images/..." or "/images/..." (those break when the site isn't served
  from "/"). In CSS, write url(/images/...): Vite adds the base path itself.
*/
export function asset(path) {
  return import.meta.env.BASE_URL + path.replace(/^\/+/, "");
}
