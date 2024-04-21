// import { Context } from "..";
import { TitleBar } from "./components/TitleBar"

export const App = () => {
  console.log('app')
  return (
    <>
      <TitleBar title='Satori App for Desktop' />
      <main>
        <h1>Hello, world!</h1>
        <p>Welcome to satori app!</p>
      </main>
    </>
  )
}

// export function apply(ctx: Context) {
//   ctx.page({
//     $root: true,
//     path: '/',
//     component: App
//   })
// }
