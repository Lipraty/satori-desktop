#!/usr/bin/env node
import { spawn } from 'node:child_process'
import process from 'node:process'

process.env.FORCE_COLOR = 1

function isJunkOutput(output) {
  return [
    /\d+-\d+-\d+ \d+:\d+:\d+\.\d+ Electron(?: Helper)?\[\d+:\d+\] /,
    /\[\d+:\d+\/|\d+\.\d+:ERROR:CONSOLE\(\d+\)\]/,
    /ALSA lib [a-z]+\.c:\d+:\([a-z_]+\)/,
    /\+\[IMK.*\]/,
  ].some(pattern => pattern.test(output))
}

function filterJunkOutput(data) {
  const output = data.toString()
  if (!isJunkOutput(output)) {
    process.stdout.write(output)
  }
}

const [,, ...args] = process.argv

if (args.length === 0) {
  console.error('Usage: electron-filter [command] [args...]')
  process.exit(1)
}

const subprocess = spawn(args[0], args.slice(1), { stdio: ['inherit', 'pipe', 'pipe'] })

subprocess.stdout.on('data', filterJunkOutput)
subprocess.stderr.on('data', filterJunkOutput)

subprocess.on('close', (code) => {
  process.exit(code)
})
