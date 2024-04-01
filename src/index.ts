import urlMapper from 'url-mapper'
import baseRouter from './base'
import { Mapper, RawRouterOptions } from './types'

const defaultMapper: Mapper = urlMapper({ query: true })

export default function (options: RawRouterOptions) {
  return baseRouter(Object.assign(options, { mapper: defaultMapper }))
}
