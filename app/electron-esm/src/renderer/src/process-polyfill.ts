declare global {
  interface Window { process?: NodeJS.Process }
}

if (typeof globalThis.process === 'undefined' || typeof globalThis.process?.on !== 'function') {
  Object.assign(globalThis, {
    process: {
      env: {},
      platform: 'browser',
      on: () => {},
      off: () => {},
      emit: () => false,
      exitCode: 0,
      stderr: { isTTY: false },
      stdout: { isTTY: false },
    },
  })
}

export {}
