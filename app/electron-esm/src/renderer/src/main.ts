import { LinkIpcClient } from '@plugin/link-ipc'
import messages from '@plugin/client-messages'
import network from '@plugin/client-network'
import person from '@plugin/client-person'
import settings from '@plugin/client-settings'
import { root } from '@satoriapp/webui'
import type {} from '@satoriapp/link' // module augmentation

async function bootstrap() {
  root.plugin(LinkIpcClient)
  root.plugin(messages)
  root.plugin(network)
  root.plugin(person)
  root.plugin(settings)

  await root.start()

  const stopRoot = () => {
    window.removeEventListener('beforeunload', stopRoot)
    void root.stop().catch((error) => {
      root.logger('bootstrap').warn('failed to stop root: %s', error instanceof Error ? error.message : String(error))
    })
  }

  window.addEventListener('beforeunload', stopRoot)

  root.on('link/status', (status) => {
    root.logger('link').info('status → %s', status)
  })

  try {
    const pong = await root.link.action<unknown, { ok: boolean, timestamp: number }>('ping', {
      source: root.platform,
      ts: Date.now(),
    })
    root.logger('link').info('ping ok — server ts %d', pong.timestamp)
  }
  catch (err) {
    root.logger('link').warn('ping failed: %s', err instanceof Error ? err.message : String(err))
  }
}

void bootstrap().catch((error) => {
  console.error('[bootstrap] failed', error)
})
