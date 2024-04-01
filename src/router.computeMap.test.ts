import { beforeEach, describe, expect, test } from 'vitest'
import { Compute } from 'cerebral'
import { props, state } from 'cerebral/tags'
import { makeTest, triggerUrlChange } from './test/helper'
import Router from '.'
import addressbar from 'addressbar-ts'

describe('Compute in map', () => {
  beforeEach(() => {
    addressbar.value = '/'
    addressbar.removeAllListeners('change')
  })

  test('should use computed to update url prop on state changes', () => {
    const controller = makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/:page',
            map: {
              page: Compute(
                state`group`,
                state`project`,
                (group, project) => group + '-' + project
              ),
            },
          },
        ],
      }),
      {
        test: [
          ({ state }) => {
            state.set('group', 'cerebral')
            state.set('project', 'router')
          },
        ],
        noop: [],
      }
    )

    triggerUrlChange('/foo-bar') // make route active
    controller.getSignal('test')() // trigger state changes
    expect(addressbar.value).toBe('http://localhost:3000/cerebral-router')
  })
})

describe('Compute in rmap', () => {
  beforeEach(() => {
    addressbar.value = '/'
    addressbar.removeAllListeners('change')
  })

  test('should use computed to update state on url changes', () => {
    const controller = makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/:page',
            rmap: {
              project: Compute(props`page`, (page: string) =>
                page ? page.split('-')[1] : null
              ),
            },
          },
        ],
      })
    )

    triggerUrlChange('/foo-bar')
    expect(controller.getState('project')).toBe('bar')
  })
})
