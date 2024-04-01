import { describe, expect, test, beforeEach } from 'vitest'
import addressbar from 'addressbar-ts'
import Router from '.'
import { makeTest, triggerUrlChange } from './test/helper'

describe('onlyHash', () => {
  beforeEach(() => {
    addressbar.value = '/'
    addressbar.removeAllListeners('change')
  })

  test('should handle only hash urls', () => {
    let count = 0
    const controller = makeTest(
      Router({
        onlyHash: true,
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

    triggerUrlChange('/#/')
    triggerUrlChange('/#/?query=')
    triggerUrlChange('/#/#hash')
    triggerUrlChange('/#/?query=#hash')
    triggerUrlChange('/')
    expect(count).toBe(5)

    expect(() => {
      controller.getSignal('home')({
        foo: 'bar',
      })
    }).not.toThrow()

    expect(() => {
      controller.getSignal('home')()
    }).not.toThrow()

    triggerUrlChange('/#/foo')
    triggerUrlChange('/foo#/')
    expect(globalThis.warnings.length).toBe(1)
    expect(addressbar.value).toBe(addressbar.origin + '/foo#/')
  })

  test('should work with baseUrl', () => {
    let count = 0
    const controller = makeTest(
      Router({
        onlyHash: true,
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
        home: [
          () => {
            count++
          },
        ],
      }
    )

    triggerUrlChange('/base#/')
    triggerUrlChange('/base#/?query=')
    triggerUrlChange('/base#/#hash')
    triggerUrlChange('/base#/?query=#hash')
    triggerUrlChange('/base')
    expect(count).toBe(5)

    expect(() => {
      controller.getSignal('home')({
        foo: 'bar',
      })
    }).not.toThrow()

    expect(() => {
      controller.getSignal('home')()
    }).not.toThrow()

    triggerUrlChange('/base#/foo')
    triggerUrlChange('/base/foo#/')
    expect(globalThis.warnings.length).toBe(1)
    expect(addressbar.value).toBe(addressbar.origin + '/base/foo#/')
  })

  test('should work with autodetected baseUrl', () => {
    addressbar.value = addressbar.origin + '/base/'
    let count = 0
    const controller = makeTest(
      Router({
        onlyHash: true,
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

    triggerUrlChange('/base/#/')
    triggerUrlChange('/base/#/?query=')
    triggerUrlChange('/base/#/#hash')
    triggerUrlChange('/base/#/?query=#hash')
    triggerUrlChange('/base/')
    expect(count).toBe(5)

    expect(() => {
      controller.getSignal('home')({
        foo: 'bar',
      })
    }).not.toThrow()

    expect(() => {
      controller.getSignal('home')()
    }).not.toThrow()

    triggerUrlChange('/base/#/foo')
    triggerUrlChange('/base/foo#/')
    expect(globalThis.warnings.length).toBe(1)
    expect(addressbar.value).toBe(addressbar.origin + '/base/foo#/')
  })
})
