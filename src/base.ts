import { Module, type UniversalControllerClass } from 'cerebral'
import addressbar from 'addressbar-ts'
import Router from './router'
import { BaseRouterOptions, RouterModule } from './types'

export default function (options: BaseRouterOptions) {
  if (!options.mapper || typeof options.mapper.map !== 'function') {
    throw new Error('Overmind State Router - mapper option must be provided.')
  }

  let router: Router

  const routerModule: RouterModule = Module(({ controller }) => {
    return (router = new Router(
      controller as UniversalControllerClass,
      addressbar,
      options.mapper,
      options
    ))
  })

  routerModule.getSignalUrl = function getSignalUrl(signalPath, payload) {
    return (
      options.baseUrl +
      options.mapper.stringify(router.routesBySignal[signalPath], payload || {})
    )
  }

  routerModule.addRoutes = function addRoutes(routes) {
    return router.addRoutes(routes)
  }

  return routerModule
}
