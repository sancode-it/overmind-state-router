import { beforeEach, describe, expect, test } from 'vitest'
import addressbar from 'addressbar-ts'
import Router from '.'
import { makeTest, triggerUrlChange } from './test/helper'

describe('Router', () => {
  beforeEach(() => {
    addressbar.value = '/'
    addressbar.removeAllListeners('change')
  })

  test('should be able to define routes as config', () => {
    let count = 0
    makeTest(
      Router({
        routes: [
          {
            path: '/',
            signal: 'test',
          },
        ],
      }),
      {
        test: [
          () => {
            count++
          },
        ],
      }
    )
    expect(count).toBe(1)
  })
})

test('should not trigger if preventAutostart option was provided', () => {
  let count = 0
  makeTest(
    Router({
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
        () => {
          count++
        },
      ],
    }
  )
  expect(count).toBe(0)
})

test('should support nested route definitions', () => {
  let count = 0
  makeTest(
    Router({
      routes: [
        {
          path: '/',
          signal: 'foo',
        },
        {
          path: '/bar',
          signal: 'bar',
          routes: [{ path: '/baz', signal: 'baz' }],
        },
      ],
    }),
    {
      foo: [
        () => {
          count++
        },
      ],
      bar: [
        () => {
          count++
        },
      ],
      baz: [
        () => {
          count++
        },
      ],
    }
  )
  triggerUrlChange('/bar')
  triggerUrlChange('/bar/baz')
  expect(count).toBe(3)
})

test('should throw on missing signal', () => {
  makeTest(
    Router({
      preventAutostart: true,
      routes: [
        {
          path: '/',
          signal: 'test',
        },
      ],
    }),
    {}
  )

  expect(() => {
    triggerUrlChange('/')
  }).toThrow(
    'Cerebral - The signal on path "test" does not exist, please check path'
  )
})

test('should throw on duplicate signal', () => {
  expect(() => {
    makeTest(
      Router({
        routes: [
          {
            path: '/',
            signal: 'test',
          },
          {
            path: '/foo',
            signal: 'test',
          },
        ],
      }),
      {
        test: [],
      }
    )
  }).toThrow(
    'Cerebral router - The signal test has already been bound to route /foo. ' +
      'Create a new signal and reuse actions instead if needed.'
  )
})

test('should update addressbar for routable signal call', () => {
  const controller = makeTest(
    Router({
      preventAutostart: true,
      routes: [
        {
          path: '/',
          signal: 'home',
        },
        {
          path: '/test',
          signal: 'test',
        },
      ],
    }),
    {
      home: [],
      test: [],
    }
  )
  controller.getSignal('test')()

  expect(addressbar.pathname).toBe('/test')
})

test('should preserve addressbar value for signal triggered by route', () => {
  const controller = makeTest(
    Router({
      preventAutostart: true,
      routes: [
        {
          path: '/',
          signal: 'home',
        },
        {
          path: '/test',
          signal: 'test',
        },
      ],
    }),
    {
      test: [],
    }
  )
  controller.getSignal('test')()
  triggerUrlChange('/test?foo=bar')
  expect(addressbar.value).toBe(addressbar.origin + '/test?foo=bar')
})

test('should not update addressbar for regular signal call', () => {
  addressbar.value = addressbar.origin + '/test'
  let count = 0
  const controller = makeTest(
    Router({
      routes: [
        {
          path: '/test',
          signal: 'test',
        },
      ],
    }),
    {
      test: [],
      foo: [
        () => {
          count++
        },
      ],
    }
  )
  controller.getSignal('foo')()
  expect(addressbar.pathname).toBe('/test')
  expect(count).toBe(1)
})

test('should prevent navigation and warn when no signals was matched', () => {
  makeTest(
    Router({
      baseUrl: '/base',
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
    }
  )

  triggerUrlChange('/missing')
  expect(globalThis.warnings.length).toBe(0)

  triggerUrlChange('/base/missing')
  expect(globalThis.warnings.length).toBe(1)
})

test('should manage input of baseUrl without /', () => {
  makeTest(
    Router({
      baseUrl: 'base',
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
    }
  )

  triggerUrlChange('/missing')
  expect(globalThis.warnings.length).toBe(0)

  triggerUrlChange('/base/missing')
  expect(globalThis.warnings.length).toBe(1)
})

test('should not prevent navigation when no signals was matched if allowEscape option was provided', () => {
  makeTest(
    Router({
      baseUrl: '/base',
      allowEscape: true,
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
    }
  )

  triggerUrlChange('/missing')
  expect(globalThis.warnings.length).toBe(0)

  triggerUrlChange('/base/missing')
  expect(globalThis.warnings.length).toBe(0)
})

test('should expose getSignalUrl method on router instance', () => {
  const router = Router({
    baseUrl: '/base',
    allowEscape: true,
    preventAutostart: true,
    routes: [
      {
        path: '/',
        signal: 'home',
      },
      {
        path: '/items/:item',
        signal: 'item',
      },
    ],
  })
  // Instantiate router
  makeTest(router)

  expect(router.getSignalUrl).toBeDefined()
  expect(router.getSignalUrl!('home')).toBe('/base/')
  expect(router.getSignalUrl!('item', { item: 'foo' })).toBe('/base/items/foo')
})
