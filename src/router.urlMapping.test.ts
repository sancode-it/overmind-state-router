import { beforeEach, describe, expect, test } from 'vitest'
import addressbar from 'addressbar-ts'
import { props, state } from 'cerebral/tags'
import Router from '.'
import { makeTest, triggerUrlChange } from './test/helper'

describe('urlMapping', () => {
  beforeEach(() => {
    addressbar.value = '/'
    addressbar.removeAllListeners('change')
  })

  test('should map param to state', () => {
    const controller = makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/:page',
            map: { page: state`page`, hello: state`hello` },
          },
        ],
      }),
      {
        test: [],
      }
    )
    triggerUrlChange('/foo?hello=bar')
    expect(controller.getState('page')).toBe('foo')
    expect(controller.getState('hello')).toBe('bar')
  })

  test('should use default state', () => {
    const controller = makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/:page',
            map: { page: state`page`, hello: state`hello` },
          },
        ],
      }),
      {
        test: [],
      }
    )
    triggerUrlChange('/foo')
    expect(controller.getState('hello')).toBe('world')
  })

  test('should map query to state', () => {
    const controller = makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/',
            map: { modal: state`modal` },
          },
        ],
      }),
      {
        test: [],
      }
    )
    triggerUrlChange('/?modal=foo')
    expect(controller.getState('modal')).toBe('foo')
  })

  test('should map param to props', () => {
    makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/:page',
            signal: 'test',
            map: { page: props`page` },
          },
        ],
      }),
      {
        test: [
          ({ props }) => {
            expect(props.page).toBe('foo')
          },
        ],
      }
    )
    triggerUrlChange('/foo')
  })

  test('should map query to props', () => {
    makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/',
            signal: 'test',
            map: { modal: props`modal` },
          },
        ],
      }),
      {
        test: [
          ({ props }) => {
            expect(props.modal).toBe('foo')
          },
        ],
      }
    )
    triggerUrlChange('/?modal=foo')
  })

  test('should ignore queries not mapped', () => {
    makeTest(
      Router({
        preventAutostart: true,
        routes: [
          {
            path: '/',
            signal: 'test',
            map: { modal: props`modal` },
          },
        ],
      }),
      {
        test: [
          ({ props }) => {
            expect(props).toEqual({ modal: 'foo' })
          },
        ],
      }
    )
    triggerUrlChange('/?modal=foo&mip=mop')
  })

  test('should throw when missing signal on props mapping', () => {
    expect(() => {
      makeTest(
        Router({
          preventAutostart: true,
          routes: [
            {
              path: '/',
              map: { modal: props`modal` },
            },
          ],
        }),
        {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          test: [({ props }) => {}],
        }
      )
    }).toThrow(
      'Cerebral router - route / has props mappings but no signal was defined.'
    )
  })
})
