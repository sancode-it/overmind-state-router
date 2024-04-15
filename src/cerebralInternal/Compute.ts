class ResolveValue {
  // "getValue" should receive a context to extract the value
  getValue(context?: any) {
    console.log('getValue not implemented', context)
    throw new Error(
      'Extending ResolveValue requires you to add a "getValue" method'
    )
  }
}

class Tag extends ResolveValue {
  type
  getter
  strings
  values
  constructor(type, getter, strings, values) {
    super()
    this.type = type
    this.getter = getter
    this.strings = strings
    this.values = values
  }

  getPath(context) {
    return this.strings.reduce((currentPath, string, idx) => {
      const valueTemplate = this.values[idx]

      if (valueTemplate instanceof ResolveValue) {
        return currentPath + string + valueTemplate.getValue(context)
      }

      return (
        currentPath +
        string +
        (valueTemplate !== undefined ? valueTemplate : '')
      )
    }, '')
  }

  getValue(context) {
    return this.getter(this.getPath(context), context)
  }
}

export class ComputeClass extends ResolveValue {
  args: any[]
  value: any
  constructor(args: any[]) {
    super()
    this.args = args
    this.value = null
  }

  getValue(context: any) {
    const computeGet = function (tag) {
      return tag.getValue(context)
    }
    const result = this.args.reduce(
      (details, arg, index) => {
        if (arg instanceof Tag) {
          const path = arg.getPath(context)

          if (path.indexOf('.*') > 0) {
            const value = arg.getValue(context)

            details.results.push(value ? Object.keys(value) : [])
          } else {
            details.results.push(arg.getValue(context))
          }

          return details
        } else if (arg instanceof ResolveValue) {
          details.results.push(arg.getValue())

          return details
        } else if (typeof arg === 'function') {
          details.results.push(
            arg(
              ...details.results.slice(details.previousFuncIndex, index),
              computeGet
            )
          )
          details.previousFuncIndex = index

          return details
        }

        details.results.push(arg)

        return details
      },
      {
        results: [],
        previousFuncIndex: 0,
      }
    )

    return result.results[result.results.length - 1]
  }
}
