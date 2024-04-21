import { createRoot } from 'react-dom/client'
import { App } from './client/App'

export * from './client/App'

const root = createRoot(document.getElementById('root'))

root.render(App())
