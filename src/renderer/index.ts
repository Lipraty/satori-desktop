import { createRoot } from 'react-dom/client'
import { App } from './client/App'
import './global.scss'

const root = createRoot(document.getElementById('root'))

root.render(App())
