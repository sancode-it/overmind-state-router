export default function redirectFactory(url: string) {
  function redirect({ router, resolve }) {
    router.redirect(resolve.value(url))
  }

  return redirect
}
