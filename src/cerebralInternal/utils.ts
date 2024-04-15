function isComplexObject(obj) {
  return typeof obj === 'object' && obj !== null
}

function throwError(message) {
  throw new Error(`Cerebral - ${message}`)
}

function extractAllChildMatches(children) {
  return Object.keys(children).reduce((matches, key) => {
    if (children[key].children) {
      return matches
        .concat(children[key])
        .concat(extractAllChildMatches(children[key].children))
    }

    return matches.concat(children[key])
  }, [])
}

export function dependencyMatch(changes, dependencyMap) {
  let currentMatches: Array<any> = []

  for (let changeIndex = 0; changeIndex < changes.length; changeIndex++) {
    let currentDependencyMapLevel = dependencyMap
    for (
      let pathKeyIndex = 0;
      pathKeyIndex < changes[changeIndex].path.length;
      pathKeyIndex++
    ) {
      if (!currentDependencyMapLevel) {
        break
      }

      if (currentDependencyMapLevel['**']) {
        currentMatches.push(currentDependencyMapLevel['**'])
      }

      if (pathKeyIndex === changes[changeIndex].path.length - 1) {
        const dependency =
          currentDependencyMapLevel[changes[changeIndex].path[pathKeyIndex]]
        if (dependency) {
          currentMatches.push(dependency)

          if (dependency.children) {
            if (changes[changeIndex].forceChildPathUpdates) {
              currentMatches = currentMatches.concat(
                extractAllChildMatches(dependency.children)
              )
            } else {
              if (dependency.children['**']) {
                currentMatches.push(dependency.children['**'])
              }

              if (dependency.children['*']) {
                currentMatches.push(dependency.children['*'])
              }
            }
          }
        }

        if (currentDependencyMapLevel['*']) {
          currentMatches.push(currentDependencyMapLevel['*'])
        }
      }

      if (!currentDependencyMapLevel[changes[changeIndex].path[pathKeyIndex]]) {
        currentDependencyMapLevel = null
        break
      }

      currentDependencyMapLevel =
        currentDependencyMapLevel[changes[changeIndex].path[pathKeyIndex]]
          .children
    }
  }

  return currentMatches
}

export function getWithPath(obj) {
  return (path) => {
    return path.split('.').reduce((currentValue, key, index) => {
      if (index > 0 && currentValue === undefined) {
        throwError(
          `You are extracting with path "${path}", but it is not valid for this object`
        )
      }

      return currentValue[key]
    }, obj)
  }
}

export function ensureStrictPath(path, value) {
  if (isComplexObject(value) && path.indexOf('*') === -1) {
    return `${path}.**`
  }

  return path
}

export function getChangedProps(propsA = {}, propsB = {}) {
  const propsAKeys: string[] = Object.keys(propsA)
  const propsBKeys: string[] = Object.keys(propsB)
  const changedProps: { path: string[] }[] = []

  for (let i = 0; i < propsAKeys.length; i++) {
    if (propsA[propsAKeys[i]] !== propsB[propsAKeys[i]]) {
      changedProps.push({ path: [propsAKeys[i]] })
    }
  }

  for (let i = 0; i < propsBKeys.length; i++) {
    if (propsA[propsBKeys[i]] !== propsB[propsBKeys[i]]) {
      changedProps.push({ path: [propsBKeys[i]] })
    }
  }

  return changedProps
}
