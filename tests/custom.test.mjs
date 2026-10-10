import assert from 'node:assert/strict'
import { test } from 'node:test'

test('custom history is inspectable without changing standard personal bests', async () => {
  const values = new Map()
  globalThis.localStorage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) }
  const { saveRun, loadHistory, loadPbs, formatMode } = await import('../src/history.js?custom-isolation')
  const standard = { id: 'standard', mode: 'time-60w-60s', wpm: 40, acc: 95, created_at: '2026-10-10T00:00:00Z' }
  saveRun(standard)
  const before = values.get('keysmash-pb-v1')
  const result = saveRun({ ...standard, id: 'practice', mode: 'custom-15s', wpm: 500 })
  assert.equal(result.isBest, false)
  assert.equal(result.previous, null)
  assert.equal(values.get('keysmash-pb-v1'), before)
  assert.deepEqual(Object.keys(loadPbs()), ['time-60w-60s'])
  assert.equal(loadHistory()[0].id, 'practice')
  assert.equal(formatMode('custom-15s'), 'Custom practice / 15s')
})
