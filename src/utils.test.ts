import { describe, expect, test } from 'vitest'
import { Compute } from 'cerebral'
import { DependencyTracker } from 'cerebral/es/internal'
import { state, props } from 'cerebral/tags'
import { computeShouldChange, flattenConfig } from './utils'
import { FlatRoutes } from './types'

describe('flattenConfig', () => {
  test('should throw on object config', () => {
    const config = {
      '/some/url': 'some.signal',
      '/other/url': 'other.signal',
    }
    expect(() => {
      flattenConfig(config as any)
    }).toThrow('Cerebral router - routes must be defined as an array.')
  })

  test('should handle array config', () => {
    const config = [
      { path: '/some/url', signal: 'some.signal' },
      { path: '/other/url', signal: 'other.signal' },
    ]
    expect(flattenConfig(config)).toEqual({
      '/some/url': {
        signal: 'some.signal',
      },
      '/other/url': {
        signal: 'other.signal',
      },
    })
  })

  test('should handle nested array config', () => {
    const config = [
      {
        path: '/foo',
        signal: 'foo.signal',
        routes: [
          { path: '/bing', signal: 'bing.signal' },
          {
            path: '/bar',
            signal: 'bar.signal',
            routes: [{ path: '/baz', signal: 'baz.signal' }],
          },
        ],
      },
      { path: '/other/url', signal: 'other.signal' },
    ]
    expect(flattenConfig(config)).toEqual({
      '/foo': {
        signal: 'foo.signal',
      },
      '/foo/bing': {
        signal: 'bing.signal',
      },
      '/foo/bar': {
        signal: 'bar.signal',
      },
      '/foo/bar/baz': {
        signal: 'baz.signal',
      },
      '/other/url': {
        signal: 'other.signal',
      },
    })
  })

  test('should parse map and rmap parameters', () => {
    const config: FlatRoutes = flattenConfig([
      {
        path: '/settings/:tab',
        // the 'focus' parameter is expected in the query
        map: { tab: props`tab`, focus: props`focus` },
        signal: 'some.signal',
      },
      {
        path: '/view/:view',
        map: { view: state`app.view` },
        signal: 'app.viewRouted',
      },
      {
        path: '/other/url',
        signal: 'other.signal',
      },
      {
        path: '/Compute/map',
        map: { view: Compute(() => true) },
        signal: 'other.signal',
      },
      {
        path: '/:foo',
        rmap: { 'some.path': Compute(props`foo`, (foo) => foo + 'x') },
      },
    ])

    const configKeys: { [key: string]: string[] } = {}
    Object.keys(config).forEach((key) => {
      configKeys[key] = Object.keys(config[key])
    })

    expect(configKeys).toEqual({
      '/settings/:tab': ['signal', 'map', 'propsMapping'],
      '/view/:view': ['signal', 'map', 'stateMapping'],
      '/other/url': ['signal'],
      '/Compute/map': ['signal', 'map', 'computedMapping'],
      '/:foo': ['signal', 'rmap', 'computedRMapping'],
    })
  })
})

describe('computeShouldChange', () => {
  test('should compare changes with Compute state track map', () => {
    const tracker = new DependencyTracker(Compute(state`foo.bar`, () => ''))
    tracker.run(() => '', {})
    expect(
      [
        [{ path: ['foo', 'bar'] }, { path: ['bar'] }],
        [{ path: ['foo'] }, { path: ['bar'] }],
        [{ path: ['foo.bing'] }],
      ].map((changed, idx) => idx + '-' + computeShouldChange(tracker, changed))
    ).toEqual(['0-true', '1-true', '2-false'])
  })

  test('should compare changes with ** in state path', () => {
    const tracker = new DependencyTracker(Compute(state`foo.**`, () => ''))
    tracker.run(() => '', {})
    expect(
      [
        [{ path: ['foo', 'bar'] }, { path: ['bar'] }],
        [{ path: ['foo'] }, { path: ['bar'] }],
        [{ path: ['bong'] }],
      ].map((changed, idx) => idx + '-' + computeShouldChange(tracker, changed))
    ).toEqual(['0-true', '1-true', '2-false'])
  })
})
