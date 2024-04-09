import { createRoot } from 'react-dom/client'
import TitleBar from './titleBar'
import '../index.css'

const root = createRoot(document.body);
root.render(
  <>
    <TitleBar />
    <main>
      <h2>Hello from React!</h2>
    </main>
  </>
);
