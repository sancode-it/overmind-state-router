import { beforeEach, describe, expect, test } from 'vitest'
import addressbar from 'addressbar-ts'
import Router from '.'
import { makeTest, triggerUrlChange } from './test/helper'

describe('matching', () => {
  beforeEach(() => {
    addressbar.value = addressbar.origin + '/'
    addressbar.removeAllListeners('change')
  })

  test('should match root route', () => {
    let count = 0
    const controller = makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/',
            signal: 'home',
          },
        ],
      }),
      {
        home: [
          () => {
            count++
          },
        ],
      }
    )

    triggerUrlChange('/')
    triggerUrlChange('/?query=')
    triggerUrlChange('/#hash')
    triggerUrlChange('/?query=#hash')
    expect(count).toBe(4)

    expect(() => {
      controller.getSignal('home')({
        foo: 'bar',
      })
    }).not.toThrow()

    expect(() => {
      controller.getSignal('home')()
    }).not.toThrow()

    triggerUrlChange('/path')
    triggerUrlChange('/path?query=')
    triggerUrlChange('/path/#/')
    expect(globalThis.warnings.length).toBe(3)
  })

  test('should match simple route', () => {
    let count = 0
    const controller = makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/foo',
            signal: 'home',
          },
        ],
      }),
      {
        home: [
          () => {
            count++
          },
        ],
      }
    )

    triggerUrlChange('/foo')
    triggerUrlChange('/foo?query=')
    triggerUrlChange('/foo#hash')
    triggerUrlChange('/foo?query=#hash')
    expect(count).toBe(4)

    expect(() => {
      controller.getSignal('home')({
        foo: 'bar',
      })
    }).not.toThrow()

    expect(() => {
      controller.getSignal('home')()
    }).not.toThrow()

    triggerUrlChange('/foo/path')
    triggerUrlChange('/foo/path?query=')
    triggerUrlChange('/foo/path/#/')
    expect(globalThis.warnings.length).toBe(3)
  })

  test('should match deep route', () => {
    let count = 0
    const controller = makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/foo/bar/baz/42',
            signal: 'home',
          },
        ],
      }),
      {
        home: [
          () => {
            count++
          },
        ],
      }
    )

    triggerUrlChange('/foo/bar/baz/42')
    triggerUrlChange('/foo/bar/baz/42?query=')
    triggerUrlChange('/foo/bar/baz/42#hash')
    triggerUrlChange('/foo/bar/baz/42?query=#hash')
    expect(count).toBe(4)

    expect(() => {
      controller.getSignal('home')({
        foo: 'bar',
      })
    }).not.toThrow()

    expect(() => {
      controller.getSignal('home')()
    }).not.toThrow()

    triggerUrlChange('/foo/bar/baz/')
    triggerUrlChange('/foo/bar/baz/43')
    triggerUrlChange('/foo/bar/baz/42/foo')
    triggerUrlChange('/#/foo/bar/baz/42')
    expect(globalThis.warnings.length).toBe(4)
  })

  test('should match params route', () => {
    let count = 0
    const controller = makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/foo/:param',
            signal: 'home',
          },
        ],
      }),
      {
        home: [
          () => {
            count++
          },
        ],
      }
    )

    triggerUrlChange('/foo/foo')
    triggerUrlChange('/foo/bar')
    triggerUrlChange('/foo/bar?query=')
    triggerUrlChange('/foo/bar#hash')
    triggerUrlChange('/foo/bar?query=#hash')
    expect(count).toBe(5)

    expect(() => {
      controller.getSignal('home')({
        param: 'bar',
      })
    }).not.toThrow()

    expect(() => {
      controller.getSignal('home')()
    }).toThrow('Expected "param" to be a string')

    triggerUrlChange('/bar')
    triggerUrlChange('/#/bar')
    expect(globalThis.warnings.length).toBe(2)
  })

  test('should match several params route', () => {
    let count = 0
    const controller = makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/foo/:param/:param2',
            signal: 'home',
          },
        ],
      }),
      {
        home: [
          () => {
            count++
          },
        ],
      }
    )

    triggerUrlChange('/foo/foo/bar')
    triggerUrlChange('/foo/bar/bar')
    triggerUrlChange('/foo/foo/bar?query=')
    triggerUrlChange('/foo/foo/bar#hash')
    triggerUrlChange('/foo/foo/bar?query=#hash')
    expect(count).toBe(5)

    expect(() => {
      controller.getSignal('home')({
        param: 'bar',
        param2: 'foo',
      })
    }).not.toThrow()

    expect(() => {
      controller.getSignal('home')()
    }).toThrow('Expected "param" to be a string')

    expect(() => {
      controller.getSignal('home')({
        param: 'bar',
      })
    }).toThrow('Expected "param2" to be a string')

    triggerUrlChange('/foo/bar')
    triggerUrlChange('/#/foo/bar/hih')
    expect(globalThis.warnings.length).toBe(2)
  })

  test('should match regexp route', () => {
    let count = 0
    const controller = makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/foo/:param([\\w+-?]+)-test/:param2(:\\d+)',
            signal: 'home',
          },
        ],
      }),
      {
        home: [
          () => {
            count++
          },
        ],
      }
    )

    triggerUrlChange('/foo/foo-test/:42')
    triggerUrlChange('/foo/foo-bar-test/:42')
    triggerUrlChange('/foo/foo-test/:42?query=')
    triggerUrlChange('/foo/foo-test/:42#hash')
    triggerUrlChange('/foo/foo-test/:42?query=#hash')
    expect(count).toBe(5)

    expect(() => {
      controller.getSignal('home')({
        param: 'foo',
        param2: 42,
      })
    }).not.toThrow()

    expect(() => {
      controller.getSignal('home')()
    }).toThrow('Expected "param" to be a string')

    expect(() => {
      controller.getSignal('home')({
        param: 'foo',
        param2: 'bar',
      })
    }).toThrow('Expected "param2" to match "\\:\\d+", but got "bar"')

    triggerUrlChange('/foo/footest/:42')
    triggerUrlChange('/foo/foo-test/bar')
    triggerUrlChange('/foo/#/foo-test/:42')
    expect(globalThis.warnings.length).toBe(3)
  })

  test('should match catch route', () => {
    let count = 0
    const controller = makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/(.*)',
            signal: 'home',
          },
        ],
      }),
      {
        home: [
          () => {
            count++
          },
        ],
      }
    )
    triggerUrlChange('/')
    triggerUrlChange('/foo')
    triggerUrlChange('/foo/bar/baz')
    expect(count).toBe(3)

    expect(() => {
      controller.getSignal('home')({
        0: 'bar',
      })
    }).not.toThrow()

    expect(() => {
      controller.getSignal('home')()
    }).toThrow('Expected "0" to be a string')
  })
})
