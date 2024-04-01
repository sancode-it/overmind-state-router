import { beforeEach, describe, expect, test } from 'vitest'
import addressbar from 'addressbar-ts'
import Router from '.'
import { makeTest, triggerUrlChange } from './test/helper'

describe('provider', () => {
  beforeEach(() => {
    addressbar.value = '/'
    addressbar.removeAllListeners('change')
  })

  test('should expose `getUrl`', () => {
    addressbar.value = addressbar.origin + '/test'
    const controller = makeTest(
      Router({
        baseUrl: '/test',
        onlyHash: true,
        preventAutostart: true,
        routes: [
          {
            path: '/',
            signal: 'test',
          },
        ],
      }),
      {
        test: [
          function action({ router }) {
            expect(addressbar.value).toBe(
              'http://localhost:3000/test#/?param=something'
            )
            expect(router.getUrl()).toBe(
              'http://localhost:3000/test#/?param=something'
            )
          },
        ],
      }
    )
    controller.getSignal('test')({ param: 'something' })
  })

  test('should expose `getPath`', () => {
    addressbar.value = addressbar.origin + '/test'
    const controller = makeTest(
      Router({
        baseUrl: '/test',
        onlyHash: true,
        preventAutostart: true,
        routes: [
          {
            path: '/',
            signal: 'test',
          },
        ],
      }),
      {
        test: [
          function action({ router }) {
            expect(addressbar.value).toBe(
              'http://localhost:3000/test#/?param=something'
            )
            expect(router.getPath()).toBe('/')
          },
        ],
      }
    )
    controller.getSignal('test')({ param: 'something' })
  })

  test('should expose `getOrigin`', () => {
    addressbar.value = addressbar.origin + '/test'
    const controller = makeTest(
      Router({
        baseUrl: '/test',
        onlyHash: true,
        preventAutostart: true,
        routes: [
          {
            path: '/',
            signal: 'test',
          },
        ],
      }),
      {
        test: [
          function action({ router }) {
            expect(addressbar.value).toBe(
              'http://localhost:3000/test#/?param=something'
            )
            expect(router.getOrigin()).toBe('http://localhost:3000')
          },
        ],
      }
    )
    controller.getSignal('test')({ param: 'something' })
  })

  test('should expose `getValues`', () => {
    addressbar.value = addressbar.origin + '/test'
    const controller = makeTest(
      Router({
        baseUrl: '/test',
        onlyHash: true,
        preventAutostart: true,
        routes: [
          {
            path: '/:page',
            signal: 'test',
          },
        ],
      }),
      {
        test: [
          function action({ router }) {
            expect(addressbar.value).toBe(
              'http://localhost:3000/test#/foo?param=something'
            )
            expect(router.getValues()).toEqual({
              page: 'foo',
              param: 'something',
            })
          },
        ],
      }
    )
    controller.getSignal('test')({ page: 'foo', param: 'something' })
  })

  test('should expose `redirect`', (done) => {
    makeTest(
      Router({
        routes: [
          {
            path: '/',
            signal: 'doRedirect',
          },
          {
            path: '/existing/:string/:bool/:num',
            signal: 'existing',
          },
        ],
      }),
      {
        doRedirect: [
          ({ router }) => router.redirect('/existing/foo/:true/:42'),
        ],
        existing: [
          ({ props }) => {
            expect(props.string).toBe('foo')
            expect(props.bool).toBe(true)
            expect(props.num).toBe(42)
            expect(addressbar.pathname).toBe('/existing/foo/:true/:42')
            done
          },
        ],
      }
    )
  })

  test('should replaceState on `redirect` by default', () => {
    makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/foo',
            signal: 'doRedirect',
          },
          {
            path: '/existing',
            signal: 'existing',
          },
        ],
      }),
      {
        doRedirect: [({ router }) => router.redirect('/existing')],
        existing: [
          ({ props }) => {
            expect(props.string).toBe('foo')
            expect(props.bool).toBe(true)
            expect(props.num).toBe(42)
            expect(addressbar.pathname).toBe('/existing/foo/:true/:42')
          },
        ],
      }
    )
  })

  test('should expose `goTo`', (done) => {
    makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/foo',
            signal: 'doRedirect',
          },
          {
            path: '/existing',
            signal: 'existing',
          },
        ],
      }),
      {
        doRedirect: [({ router }) => router.goTo('/existing')],
        existing: [
          () => {
            expect(addressbar.pathname).toBe('/existing')
            expect((window.location as any).lastChangedWith).toBe('pushState')
            done
          },
        ],
      }
    )
    triggerUrlChange('/foo')
  })

  test('should expose `redirectToSignal`', (done) => {
    const controller = makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/',
            signal: 'home',
          },
          {
            path: '/foo/:id',
            signal: 'detail',
          },
        ],
      }),
      {
        home: [],
        createClicked: [
          function createEntity({ router }) {
            const entityId = 42
            router.redirectToSignal('detail', { id: entityId })
          },
        ],
        detail: [
          function checkAction({ props }) {
            expect(props.id).toBe(42)
            expect(addressbar.pathname).toBe('/foo/:42')
            done
          },
        ],
      }
    )

    controller.getSignal('createClicked')()
  })

  test('should expose `reload`', () => {
    let called = 0
    const controller = makeTest(
      Router({
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
            called++
          },
        ],
        reload: [({ router }) => router.reload()],
      }
    )
    controller.getSignal('reload')()
    expect(called).toBe(2)
  })

  test('should warn if trying `redirectToSignal` to signal not bound to route', () => {
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
        home: [],
        createClicked: [
          function createEntity({ router }) {
            const entityId = 42
            router.redirectToSignal('detail', { id: entityId })
          },
        ],
        detail: [],
      }
    )

    controller.getSignal('createClicked')()
    expect(globalThis.warnings.length).toBe(1)
  })
})
