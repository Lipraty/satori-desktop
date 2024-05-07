// import { Context } from "..";
import { NavBar } from "./components/NavBar"
import { TitleBar } from "./components/TitleBar"

export const App = () => {
  console.log('app')
  return (
    <>
      <TitleBar title='Satori App for Desktop' />
      <div className="container">
        <NavBar />
        <main>
          <h1>Hello, world!</h1>
          <p>Welcome to satori app!</p>
        </main>
      </div>
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
