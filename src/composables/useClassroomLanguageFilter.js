/*
  Classroom language filter: one list of blocked words/phrases, loaded once per
  page from /cypher.txt (Caesar-shifted so it is not readable in the repo).

  In a component:

    const { ready, loading, containsProfanity } = useClassroomLanguageFilter()

  ready    true once the list has loaded (answers are refused until then)
  loading  true while it is loading (disable inputs, set aria-busy)

  Importing this file starts loading the list straight away (main.js does).
*/
import { ref } from 'vue'

const ready = ref(false)
const loading = ref(false)
let list = []
let loadPromise = null

/* The list is shifted 3 letters; undo that. */
function caesarCipher(text, shift) {
  return text
    .split('')
    .map((character) => {
      if (!/[a-z]/i.test(character)) return character

      const code = character.charCodeAt(0)
      const base = code >= 65 && code <= 90 ? 65 : 97

      return String.fromCharCode(((code - base + shift + 26) % 26) + base)
    })
    .join('')
}

/* Undo common substitutions before checking: @ -> a, 3 -> e, 1 -> i, 0 -> o ... */
function normalise(text) {
  return String(text)
    .toLowerCase()
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function load() {
  loading.value = true

  try {
    const response = await fetch(import.meta.env.BASE_URL + 'cypher.txt')

    if (!response.ok) {
      throw new Error('Could not fetch cypher.txt. HTTP status: ' + response.status)
    }

    list = caesarCipher(await response.text(), -3)
      .split(/\r?\n/)
      .map((entry) => {
        const trimmed = entry.trim()
        const hasWildcard = trimmed.endsWith('*')
        const cleaned = normalise(hasWildcard ? trimmed.slice(0, -1) : trimmed)

        return hasWildcard ? cleaned + '*' : cleaned
      })
      .filter(Boolean)

    ready.value = true
  } catch (error) {
    ready.value = false
    console.error('Classroom language filter failed to load:', error)
  } finally {
    loading.value = false
  }
}

/* True when the text contains a blocked word or phrase. */
function containsProfanity(text) {
  if (!ready.value) {
    console.warn('Profanity check attempted before the list was ready.')
    return false
  }

  const normalised = normalise(text)
  if (normalised === '') return false

  const words = normalised.split(/\s+/).filter(Boolean)

  return list.some((blocked) => {
    // trailing * = block any word that starts with this
    if (blocked.endsWith('*')) {
      const start = blocked.slice(0, -1)
      return words.some((word) => word.startsWith(start))
    }

    // multi-word phrase
    if (blocked.includes(' ')) return normalised.includes(blocked)

    return words.includes(blocked)
  })
}

/* Standard feedback on an input whose text was blocked. */
function showBlockedLanguageFeedback(input) {
  input.value = ''
  input.setCustomValidity('Please use appropriate classroom language.')
  input.reportValidity()
  input.focus()

  window.setTimeout(() => input.setCustomValidity(''), 2000)
}

export function useClassroomLanguageFilter() {
  if (!loadPromise) loadPromise = load()

  return { ready, loading, containsProfanity, showBlockedLanguageFeedback }
}

useClassroomLanguageFilter() // start loading as soon as this file is imported

