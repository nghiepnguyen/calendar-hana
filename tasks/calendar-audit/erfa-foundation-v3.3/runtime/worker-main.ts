import { runParity } from './harness'

self.onmessage = null
postMessage(runParity())
