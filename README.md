# overmind-state-router

## Install

```sh
npm install overmind-state-router
```

## Description

The overmind-state-router does not affect your view layer. A url change triggers a signal that puts your application in the correct state. Your view just reacts to this state, like any other state change.

## Instantiate

```js
import { Controller, Module } from 'cerebral'
import Router from overmind-state-router

const router = Router({
  // Define routes and point to signals
  routes: [
    {
      path: '/',
      signal: 'app.homeRouted'
    }
  ],

  // Only react to hash urls
  onlyHash: false,

  // Set a base url, if your app lives on a subpath
  baseUrl: null,

  // Will allow none matching routes on same origin to run as normal
  allowEscape: false,

  // Will make the router not run the initial route
  preventAutostart: false
})
const app = Module({
  modules: { router }
})

const controller = Controller(app)
```

## getOrigin

```js
function myAction({ router }) {
  // If url is "http://localhost:3000/items?foo=bar", returns "http://localhost:3000"
  router.getOrigin()
}
```

## getPath

```js
function myAction({ router }) {
  // If url is "http://localhost:3000/items?foo=bar", returns "/items"
  router.getPath()
}
```

## getSignalUrl

Allows you to convert a signal to its corresponding url. This is useful when you actually want to produce the url for a hyperlink etc. To do this you need to create the router in its own file:

```js
/* router.js */

import Router from overmind-state-router

export default Router({
  routes: [
    {
      path: '/items/:itemKey',
      signal: 'items.itemRouted'
    }
  ]
})
```

And attaching it to the controller:

```js
/* controller.js */

import { Controller } from 'cerebral'
import router from './modules/router'
import items from './modules/items'

export default Controller({
  modules: { items, router }
})
```

You will be able to use the same router instance to produce url based on registered signals:

```js
import router from './router'

export default connect(
  {
    item: state`items.list.${props`itemKey`}`
  },
  function ListItem({ itemKey, item, itemRouted }) {
    return (
      <li key={itemKey}>
        <a href={router.getSignalUrl('items.itemRouted', { itemKey })}>
          {item.name}
        </a>
      </li>
    )
  }
)
```

## getUrl

```js
function myAction({ router }) {
  // If url is "http://localhost:3000/items?foo=bar", returns "/items?foo=bar"
  router.getUrl()
}
```

## getValues

```js
function myAction({ router }) {
  // If url is "http://localhost:3000/items/123?foo=bar", returns "{itemId: '123', foo: 'bar'}"
  router.getValues()
}
```

## goTo

### `goTo` action

```js
function myAction({ router }) {
  // Go to a new url
  router.goTo('/items')
}
```

### `goTo` operator

```js
import { goTo } from '@cerebral/router/operators'

export default [goTo('/items')]
```

### `goTo` operator with dynamic URL

```js
import { state, string } from 'cerebral/tags'
import { goTo } from '@cerebral/router/operators'

export default [goTo(string`/${state`app.currentView`}`)]
```

## redirect

### `redirect` action

```js
function myAction({ router }) {
  // Go to a new url, replacing current url
  router.redirect('/items')
}
```

### `redirect` operator

```js
import { redirect } from '@cerebral/router/operators'

export default [redirect('/items')]
```

### `redirect` operator with dynamic URL

```js
import { state, string } from 'cerebral/tags'
import { redirect } from '@cerebral/router/operators'

export default [redirect(string`/${state`app.currentView`}`)]
```

## redirectToSignal

### `redirectToSignal` action

```js
function myAction({ router }) {
  // Trigger a signal bound to router
  router.redirectToSignal('app.itemsRouted', { foo: 'bar' })
}
```

### `redirectToSignal` operator

```js
import { redirectToSignal } from '@cerebral/router/operators'

export default [redirectToSignal('app.itemsRouted', props`payload`)]
```

## reload

### `reload` action

```js
function myAction({ router }) {
  // reload the current route
  router.reload()
}
```

### `reload` operator

```js
import { reload } from '@cerebral/router/operators'

export default [reload]
```

## routes

```js
import { Controller } from 'cerebral'
import Router from overmind-state-router

const controller = Controller({
  modules: {
    router: Router({
      routes: [
        {
          path: '/',
          signal: 'app.homeRouted'
        },
        {
          // Params are passed as props to the signal.
          // Query parameters are also passed as props
          path: '/projects/:projectId',
          signal: 'app.projectRouted'
        }
      ]
    })
  }
})
```

When a mapped signal triggers it will trigger with a payload if either **params** are defined on the route or the url has a **query**. For example _/projects/123?showUser=true_ will produce the following payload to the signal, available on the **props** :

```js
{
  projectId: '123',
  showUser: true
}
```

## setUrl

```js
function myAction({ router }) {
  // If url is "http://localhost:3000", changes to "http://localhost:3000/foo"
  router.setUrl('/foo')
}
```

### EXPERIMENTAL

We are currently working on functionality that allows you to bind urls to your state, also allowing you to create more complex relationships between your application state and the url. This API is very likely to change, but please feel free to try it out and give us feedback.

#### mapping

The `map` property let's you create a mapping between state and
url parameters. This works both ways: when you change the state,
it sets the url from state and when the url changes, it triggers
the state changes.

This automatic mapping is only active if the current url
is active. Note also that when you use state mapping, the 'signal'
is optional.

```js
import { Controller } from 'cerebral'
import Router from overmind-state-router

const controller = Controller({
  modules: {
    router: Router({
      routes: [
        {
          path: '/projects/:projectId',
          map: { projectId: state`app.currentProjectId` },
          signal: 'app.projectRouted'
        },
        {
          path: '/settings/:tab',
          // whitelist 'focus' query parameter
          // and 'tab' url parameter
          map: { tab: props`tab`, focus: props`focus` },
          signal: 'app.settingsRouted'
        }
      ]
    })
  }
})
```

#### computed mapping

You can use a `Compute` value here to run a computed in order to prepare
the value passed to build the url.

```js
map: {
  urlKey: Compute(/* ... */)
}
```

If you use a `Compute` the router cannot map back from the url key to the
state and you need to define a reverse map with `rmap`:

```js
rmap: {
  'some.state': Compute(props`urlKey`, (urlKey) => /* ... */),
  'other.state': Compute(props`urlKey`, (urlKey) => /* ... */)
}
```

```js
import { Controller } from 'cerebral'
import Router from overmind-state-router
import { props, state } from 'cerebral/tags'

const controller = Controller({
  modules: {
    router: Router({
      routes: [
        {
          path: '/settings/:opts  ',
          // This maps a complex app state to the `opts` param in
          // url query.
          map: {
            opts: Compute(
              state`projectId`,
              state`user.lang`,
              (projectId, lang) => ({ projectId, lang })
            )
          },
          // This parses the url query `opts` into two state values.
          // It does a 'reverse map' hence the 'rmap' name.
          rmap: {
            projectId: Compute(
              state`projectId`,
              props`opts`,
              (projectId, opts) => opts.projectId || projectId
            ),
            'user.lang': Compute(
              state`validLangs`,
              props`opts`,
              (validLangs, opts) => (validLangs[opts.lang] ? opts.lang : 'en')
            )
          }
        }
      ],
      query: true
    })
  }
})
```

#### Dynamically add routes

Apps that use code splitting for security reasons may not want to define all routes until after the user has been verified.

The `addRoutes()` method allows routes to be added after the app has been initialized.

Define your initial set of routes as normal:

```js
import Router from overmind-state-router

export default Router({
  routes: [
    { path: '/', signal: 'homeRouted' },
    { path: '/login', signal: 'loginRouted' }
  ]
})
```

Then later you can call `addRoutes`:

```js
import router from './router'

router.addRoutes([
  { path: '/now-you-see-me', signal: 'hiddenModule.hiddenRouted' }
])
```

When used together with code splitting and `controller.addModule()` you can dynamically add functionality to a running cerebral application.

The only gotcha is that you might need to refresh the current route when reloading the app. Due to the order of events, the router may fire before the routes have loaded.

```js
// app init signal
import { reload } from '@cerebral/router/operators'
import checkAuthToken from '../actions/checkAuthToken'
import addExtraRoutes from '../actions/addExtraRoutes'

export default [
  checkAuthToken,
  {
    valid: [
      addExtraRoutes,
      reload // ensure that the route which was added after app was loaded is called
    ],
    invalid: []
  }
]
```
