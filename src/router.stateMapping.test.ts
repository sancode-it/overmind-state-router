import { beforeEach, describe, expect, test } from 'vitest'
import addressbar from 'addressbar-ts'
import { state } from 'cerebral/tags'
import Router from '.'
import { makeTest, triggerUrlChange } from './test/helper'

describe('stateMapping', () => {
  beforeEach(() => {
    addressbar.value = '/'
    addressbar.removeAllListeners('change')
  })

  test('should update url on state changes', () => {
    const controller = makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/:page',
            map: { page: state`page` },
          },
        ],
      }),
      {
        test: [
          ({ state }) => {
            state.set('page', 'bar')
          },
        ],
      }
    )

    triggerUrlChange('/foo') // make route active
    controller.getSignal('test')() // trigger state changes
    expect(addressbar.value).toBe('http://localhost:3000/bar')
  })

  test('should update url query on state changes', () => {
    const controller = makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/:page',
            map: { page: state`page`, focus: state`focus` },
          },
        ],
      }),
      {
        test: [
          ({ state }) => {
            state.set('page', 'bar')
            state.set('focus', 'someField')
          },
        ],
      }
    )

    triggerUrlChange('/foo') // make route active
    controller.getSignal('test')() // trigger state changes
    expect(addressbar.value).toBe('http://localhost:3000/bar?focus=someField')
  })

  test('should update url on null state', () => {
    const controller = makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/:page?',
            map: { page: state`page` },
          },
        ],
      }),
      {
        test: [
          ({ state, props }) => {
            state.set('page', props.page)
          },
        ],
      }
    )

    triggerUrlChange('/foo') // make route active
    controller.getSignal('test')({ page: 'bar' }) // trigger state changes
    expect(addressbar.value).toBe('http://localhost:3000/bar')
    controller.getSignal('test')({ page: null }) // trigger state changes
    expect(addressbar.value).toBe('http://localhost:3000/')
  })
})
