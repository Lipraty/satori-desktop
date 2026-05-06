import './process-polyfill'

import { LinkIpcClient } from '@plugin/link-ipc'
import * as messages from '@plugin/client-messages'
import * as config from '@plugin/client-config'
import * as person from '@plugin/client-person'
import { client, root } from '@satoriapp/webui'
import type {} from '@satoriapp/link' // module augmentation

async function bootstrap() {
  const fibers = await Promise.all([
    root.plugin(LinkIpcClient, {}),
    root.plugin(messages),
    root.plugin(config),
    root.plugin(person),
  ])
  await Promise.all(fibers.map(f => f.await()))
  client.mount('#app')
  await client.router.router.isReady()
  if (!client.router.router.currentRoute.value.matched.length) {
    await client.router.router.replace('/')
  }

  const stop = () => {
    window.removeEventListener('beforeunload', stop)
    void root.fiber.dispose()
  }
  window.addEventListener('beforeunload', stop)

  root.on('link/status', (status) => {
    console.warn('[link] status →', status)
  })
}

void bootstrap().catch((error) => {
  console.error('[bootstrap] failed', error)
})
