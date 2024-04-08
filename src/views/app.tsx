import { createRoot } from 'react-dom/client'
import { titleBar } from './titleBar'
import '../index.css'

const root = createRoot(document.body);
root.render(
  <>
    {titleBar()}
    <main>
      <h2>Hello from React!</h2>
    </main>
  </>
);
