declare class DependencyTracker {
  propsTrackMap: {}
  stateTrackMap: {}
  propsTrackFlatMap: {}
  stateTrackFlatMap: {}
  computed: any
  value: null
  constructor(computed: any)
  run(stateGetter: (arg0: any) => any, props: any): boolean
  match(stateChanges: any, propsChanges: any): boolean
}
export default DependencyTracker
