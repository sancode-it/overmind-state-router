import { dependencyMatch, DependencyTracker } from './cerebralInternal'
import {
  FlatConfig,
  FlatRoutes,
  RawRouterOptions,
  Route,
  RouterOptions,
} from './types'

export function flattenConfig(config: Route[], prev = '') {
  if (!Array.isArray(config)) {
    throw new Error(`Cerebral router - routes must be defined as an array.`)
  }
  return config.reduce(
    (flattened: FlatRoutes, { map, path, routes, rmap, signal }: Route) => {
      if (routes) {
        Object.assign(flattened, flattenConfig(routes, prev + path))
      }

      const currentPath = prev + path
      const conf: FlatConfig = { signal }
      if (map) {
        conf.map = map
        console.log('map', map)
        const stateMapping = Object.keys(map).filter(
          (key) => map[key].type === 'state'
        )
        if (stateMapping.length) {
          conf.stateMapping = stateMapping
        }

        const computedKeys = Object.keys(map).filter(
          (key) =>
            Object.getPrototypeOf(map[key]).constructor.name === 'Compute'
        )
        if (computedKeys.length) {
          conf.computedMapping = computedKeys.reduce((mapping, key) => {
            const tracker = new DependencyTracker(map[key])
            // We have to wait until we have access to controller before
            // doing the first run.
            mapping[key] = { tracker, needsInit: true }
            return mapping
          }, {})
        }

        const propsMapping = Object.keys(map).filter(
          (key) => map[key].type === 'props'
        )
        if (propsMapping.length) {
          conf.propsMapping = propsMapping
          if (!signal) {
            throw new Error(
              `Cerebral router - route ${currentPath} has props mappings but no signal was defined.`
            )
          }
        }
      }

      const computedRmapKeys =
        rmap && Object.keys(rmap).length ?
          Object.keys(rmap).filter(
            (key) =>
              Object.getPrototypeOf(rmap[key]).constructor.name === 'Compute'
          )
        : []

      if (rmap && computedRmapKeys.length) {
        conf.rmap = rmap
        conf.computedRMapping = computedRmapKeys.reduce((mapping, key) => {
          const tracker = new DependencyTracker(rmap[key])
          // We have to wait until we have access to controller before
          // doing the first run.
          mapping[key] = { tracker, needsInit: true }
          return mapping
        }, {})
      }

      flattened[currentPath] = conf

      return flattened
    },
    {}
  )
}

export function getRoutesBySignal(config: FlatRoutes) {
  return Object.keys(config).reduce((routableSignals, path) => {
    const { signal: signalName } = config[path]

    if (!signalName) {
      return routableSignals
    }

    if (routableSignals[signalName]) {
      throw new Error(
        `Cerebral router - The signal ${signalName} has already been bound to route ${path}. Create a new signal and reuse actions instead if needed.`
      )
    }

    routableSignals[signalName] = path

    return routableSignals
  }, {})
}

export function hasChangedPath(
  changes: { [key: string]: { path: string[] } },
  path: string
) {
  for (const change in changes) {
    if (changes[change].path.join('.') === path) {
      return true
    }
  }
}

export function computeShouldChange(
  tracker: { stateTrackMap: any },
  changed: any
) {
  return dependencyMatch(changed, tracker.stateTrackMap).length > 0
}

function ensureBaseUrl(url?: string) {
  if (!url) {
    return ''
  }

  return url[0] === '/' ? url : '/' + url
}

export function verifyOptions(options: RawRouterOptions): RouterOptions {
  return Object.assign(options, {
    baseUrl: ensureBaseUrl(options.baseUrl),
  })
}
