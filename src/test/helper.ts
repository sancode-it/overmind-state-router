// MOCKING
import { BaseControllerClass, Controller, Module } from 'cerebral'
import addressbar from 'addressbar-ts'
import { RouterModule } from '../types'

const devtools = {
  init() {},
  send() {},
  sendExecutionData() {},
}

export function makeTest(
  router: RouterModule,
  signals?: any
): BaseControllerClass {
  return Controller(
    Module({
      state: {
        hello: 'world',
      },
      modules: {
        router,
      },
      signals,
    }),
    { devtools }
  )
}

export function triggerUrlChange(url) {
  let defaultPrevented = false

  addressbar.emit('change', {
    preventDefault() {
      defaultPrevented = true
    },
    target: { value: addressbar.origin + url },
  })
  if (!defaultPrevented) {
    addressbar.value = url
  }
}
