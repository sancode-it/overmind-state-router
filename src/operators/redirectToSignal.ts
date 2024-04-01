export default function redirectToSignalFactory(signal: string, payload: any) {
  function redirectToSignal({ router, resolve }) {
    router.redirectToSignal(resolve.value(signal), resolve.value(payload))
  }

  return redirectToSignal
}
