export default function goToFactory(url: string) {
  function goTo({ router, resolve }) {
    router.goTo(resolve.value(url))
  }

  return goTo
}
