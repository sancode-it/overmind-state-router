import { type UniversalControllerClass, Provider } from 'cerebral'
import { getChangedProps } from 'cerebral/internal'
import {
  computeShouldChange,
  flattenConfig,
  hasChangedPath,
  getRoutesBySignal,
  verifyOptions,
} from './utils'
import type { Addressbar } from 'addressbar-ts'
import type {
  FlatConfig,
  FlatRoutes,
  Mapper,
  RawRouterOptions,
  Route,
  RouterOptions,
} from './types'
import { Provider as FunctionTreeProvider } from 'function-tree'

export default class Router {
  controller: UniversalControllerClass
  addressbar: Addressbar
  mapper: Mapper
  options: RouterOptions
  activeRoute: { path?: string; payload?: any }
  stateGetter: any
  providers: { [key: string]: FunctionTreeProvider<{}> }
  routesConfig: FlatRoutes

  routesBySignal: { [key: string]: string }
  constructor(
    controller: UniversalControllerClass,
    addressbar: Addressbar,
    mapper: Mapper,
    options: RawRouterOptions
  ) {
    this.controller = controller
    this.addressbar = addressbar
    this.mapper = mapper
    this.options = verifyOptions(options)
    this.activeRoute = {}
    const getState: (path?: string) => any = this.controller.getState
    this.stateGetter = getState.bind(this.controller)

    this.providers = {
      router: Provider({
        getUrl: this.getUrl.bind(this),
        getPath: this.getPath.bind(this),
        getValues: this.getValues.bind(this),
        getOrigin: this.getOrigin.bind(this),
        setUrl: this.setUrl.bind(this),
        goTo: this.goTo.bind(this),
        redirect: this.redirect.bind(this),
        redirectToSignal: this.redirectToSignal.bind(this),
        reload: this.reload.bind(this),
      }),
    }

    if (this.options.baseUrl === '' && this.options.onlyHash) {
      // autodetect baseUrl
      this.options.baseUrl = addressbar.pathname
    }
    this.options.baseUrl =
      this.options.baseUrl + (this.options.onlyHash ? '#' : '')

    controller.on('initialized', () => {
      this.routesConfig = flattenConfig(this.options.routes)
      this.routesBySignal = getRoutesBySignal(this.routesConfig)

      addressbar.on('change', this.onUrlChange.bind(this))
      controller.on('start', this.onSignalStart.bind(this))
      controller.on('flush', this.onFlush.bind(this))

      if (!options.preventAutostart) {
        this.onUrlChange()
      }
    })
  }

  addRoutes(routes: Route[]) {
    this.options.routes = [...routes, ...this.options.routes]
    this.routesConfig = flattenConfig(this.options.routes)
    this.routesBySignal = getRoutesBySignal(this.routesConfig)
  }

  getRoutablePart(url: string) {
    let path = url.replace(this.addressbar.origin, '')
    if (path[0] !== '/') {
      path = '/' + path
    }
    if (this.options.onlyHash && path.indexOf('#') === -1) {
      // treat hash absense as root route
      path = path + '#/'
    }
    return (
        this.options.baseUrl !== undefined &&
          path.indexOf(this.options.baseUrl) === 0
      ) ?
        path.replace(this.options.baseUrl, '')
      : null
  }

  onUrlChange(event?: { target: { value: any }; preventDefault: () => any }) {
    const url = this.getRoutablePart(
      event ? event.target.value : this.addressbar.value
    )
    if (url === null) return

    let match: FlatConfig
    let routePath: string
    let values: { [key: string]: any }
    try {
      const mapped = this.mapper.map(url, this.routesConfig) || {}
      match = mapped.match
      routePath = mapped.route
      values = mapped.values
    } catch (err) {
      throw new Error('Could not parse url (' + err + ').')
    }

    if (!match) {
      if (this.options.allowEscape) return

      event && event.preventDefault()
      console.warn(
        `Cerebral router - No route matched ${url}, navigation was prevented. Please verify url or catch unmatched routes with a "/*" route.`
      )
      return
    }

    event && event.preventDefault()
    const { computedRMapping, map, propsMapping, signal, stateMapping } = match

    // remove undefined values from payload
    // TODO: can be replaced with next line when fixed in url-mapper
    // let payload = values
    let payload = Object.keys(values).reduce((cleanedPayload, key) => {
      if (values[key] !== undefined) {
        cleanedPayload[key] = values[key]
      }
      return cleanedPayload
    }, {})

    const getters = { props: payload, state: this.stateGetter }

    if (stateMapping || computedRMapping) {
      this.controller.runSignal(
        'router.routed',
        [
          ({ state, resolve }) => {
            if (map && stateMapping) {
              stateMapping.forEach((key: string | number) => {
                const value = values[key] || state.get(resolve.path(map[key]))
                state.set(
                  resolve.path(map[key]),
                  value === undefined ? null : value
                )
              })
            }
            if (computedRMapping) {
              Object.keys(computedRMapping).forEach((path) => {
                const { tracker } = computedRMapping[path]
                tracker.run(this.stateGetter, values)

                const value = tracker.value
                state.set(path, value === undefined ? null : value)
              })
            }
          },
        ],
        {}
      )
    }

    if (map && propsMapping) {
      payload = propsMapping.reduce(
        (mappedPayload: { [key: string]: any }, key: string | number) => {
          mappedPayload[map[key].getPath(getters)] = values[key] || null
          return mappedPayload
        },
        {}
      )
    }

    const prevSignal = (
      this.routesConfig[this.activeRoute.path as string] || {}
    ).signal
    if (
      signal &&
      (prevSignal !== signal ||
        getChangedProps(payload || {}, this.activeRoute.payload || {}))
    ) {
      this.controller.getSignal(signal)(payload)
    }

    this.activeRoute = { path: routePath, payload }
  }

  onSignalStart(execution: { name: string }, payload: any) {
    const path: string = this.routesBySignal[execution.name]
    if (!path) return

    const { map } = this.routesConfig[path]
    const getters = { props: payload, state: this.stateGetter }

    // resolve mappings on current props and state
    const url = this.mapper.stringify(
      path,
      map ?
        Object.keys(map || {}).reduce((resolved, key) => {
          const value = map[key].getValue(getters)

          if (this.options.filterFalsy && !value) {
            return resolved
          }

          resolved[key] = value
          return resolved
        }, {})
      : payload
    )

    this.setUrl(decodeURI(url))

    this.activeRoute = { path, payload }
  }

  onFlush(changed: { [key: string]: { path: string[] } }) {
    const { path, payload } = this.activeRoute
    const { map, stateMapping, computedMapping } =
      this.routesConfig[path as string] || {}
    if (!stateMapping && !computedMapping) return
    const getters = { props: payload, state: this.stateGetter }
    let shouldUpdate = false

    const resolvedMap = Object.keys(map || {}).reduce((resolved, key) => {
      let value: any

      if (computedMapping && computedMapping[key]) {
        const trackerHandle = computedMapping[key]
        const { needsInit, tracker } = trackerHandle

        if (needsInit || computeShouldChange(tracker, changed)) {
          trackerHandle.needsInit = false
          tracker.run(this.stateGetter, payload)
          shouldUpdate = true
        }

        value = tracker.value
      } else if (map) {
        const path = map[key].getPath(getters)
        value = map[key].getValue(getters)

        shouldUpdate =
          shouldUpdate ||
          ((stateMapping.indexOf(key) >= 0 &&
            hasChangedPath(changed, path)) as boolean)
      }

      if (!this.options.filterFalsy || value) {
        // Cerebral state only supports null and url-mapper only supports
        // undefined: so we map from one to the other here.
        resolved[key] = value === null ? undefined : value
      }

      return resolved
    }, {})

    if (shouldUpdate) {
      this.setUrl(
        this.mapper.stringify(path as string, Object.assign({}, resolvedMap))
      )
    }
  }

  setUrl(url: any) {
    this.addressbar.value = this.options.baseUrl + url || '/'
  }

  getUrl() {
    return this.addressbar.value
  }

  getPath() {
    const value = this.addressbar.value
    return value
      .replace(this.addressbar.origin + this.options.baseUrl, '')
      .split('?')[0]
  }

  getValues() {
    const value = this.addressbar.value
    const url = this.getRoutablePart(value)
    const mapped = this.mapper.map(url as string, this.routesConfig) || {}

    return mapped.values
  }

  getOrigin() {
    return this.addressbar.origin
  }

  goTo(url: any) {
    this.addressbar.value = this.options.baseUrl + url
    this.onUrlChange()
  }

  redirect(url: any) {
    this.addressbar.value = {
      value: this.options.baseUrl + url,
      replace: true,
    }

    this.onUrlChange()
  }

  redirectToSignal(signalName: string | number, payload: any) {
    const route = this.routesBySignal[signalName]
    if (!route) {
      console.warn(
        `redirectToSignal: signal '${signalName}' not bound to route.`
      )
    }
    this.controller.getSignal(signalName as string)(payload)
  }

  reload() {
    this.redirect(this.getUrl())
  }
}
