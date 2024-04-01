import { afterEach } from 'vitest'

interface CustomLocation extends Location {
  lastChangedWith: string
}

globalThis.location = {
  ...location,
  origin: 'http://localhost:3000',
  href: 'http://localhost:3000/initial',
  lastChangedWith: 'initial',
} as CustomLocation

globalThis.history = {
  ...history,
  length: 0,
  scrollRestoration: 'auto',
  state: null,
  back: () => {},
  forward: () => {},
  go: () => {},
}
globalThis.history = {
  length: 0,
  scrollRestoration: 'auto',
  state: null,
  back: () => {},
  forward: () => {},
  go: () => {},
  pushState(_: any, __: string, value: string | URL | null | undefined) {
    globalThis.location.href = globalThis.location.origin + value
    ;(globalThis.location as CustomLocation).lastChangedWith = 'pushState'
  },
  replaceState(_: any, __: string, value: string | URL | null | undefined) {
    globalThis.location.href = globalThis.location.origin + value
    ;(globalThis.location as CustomLocation).lastChangedWith = 'replaceState'
  },
}
globalThis.addEventListener = () => {}
globalThis.CustomEvent = (() => {}) as any
globalThis.dispatchEvent = () => false
globalThis.document = {} as Document

globalThis.warnings = []
console.warn = function (message: string) {
  globalThis.warnings.push(message)
}

afterEach(() => {
  globalThis.warnings = []
})
