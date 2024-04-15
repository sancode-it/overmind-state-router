import { ModuleClass } from 'cerebral'
import { ComputeClass } from './cerebralInternal'

export interface Route {
  path: string
  signal?: string
  routes?: Route[]

  // EXPERIMENTAL: NOT PART OF OFFICIAL API
  map?: { [key: string]: any }
  rmap?: { [key: string]: any }
}

export interface RawRouterOptions {
  routes: Route[]
  baseUrl?: string
  allowEscape?: boolean
  onlyHash?: boolean
  preventAutostart?: boolean
  query?: boolean

  // EXPERIMENTAL: NOT PART OF OFFICIAL API
  filterFalsy?: boolean
}

export interface RouterOptions extends RawRouterOptions {
  baseUrl: NonNullable<RawRouterOptions['baseUrl']>
}

export interface BaseRouterOptions extends RawRouterOptions {
  mapper: Mapper
}

export interface Mapper {
  parse: (route: string, url: string) => { [key: string]: any }
  stringify: (route: string, values: { [key: string]: any }) => string
  map: (
    url: string,
    routes: { [key: string]: any }
  ) => { route: string; match: any; values: { [key: string]: any } }
}

export interface Provider {
  redirect: (url: string) => void
}

export interface RouterModule extends ModuleClass {
  getSignalUrl?: (signalPath: string, payload?: any) => string
  addRoutes?: (routes: any) => void
}
export interface FlatConfig {
  signal: string | undefined
  map?: { [key: string]: any }
  stateMapping?: any
  computedMapping?: any
  propsMapping?: any
  rmap?: { [key: string]: ComputeClass }
  computedRMapping?: any
}

export interface FlatRoutes {
  [key: string]: FlatConfig
}
