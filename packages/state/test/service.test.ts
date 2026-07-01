import { describe, expect, it } from 'vitest'
import { apply, observe } from '@cordisjs/muon'
import { deepClone, DEFAULT_STATE } from '../src/index'

describe('state default shape & muon roundtrip', () => {
  it('dEFAULT_STATE has app and conversation namespaces', () => {
    expect(DEFAULT_STATE.app).toBeDefined()
    expect(DEFAULT_STATE.conversation).toBeDefined()
  })

  it('observe captures mutation, apply replays it', () => {
    const a = deepClone(DEFAULT_STATE)
    const m = observe(a, (d) => {
      d.app.theme = 'light'
    })
    expect(m).not.toBeNull()
    const b = deepClone(DEFAULT_STATE)
    apply(b, m!)
    expect(b.app.theme).toBe('light')
  })
})
