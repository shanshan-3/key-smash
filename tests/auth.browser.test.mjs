import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const authOrigin = 'https://auth-fixture.supabase.co'
const user = { id: '11111111-1111-4111-8111-111111111111', email: 'returning@example.test', aud: 'authenticated', role: 'authenticated' }
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
let server, origin, browser, socket, profile
let sequence = 0
const pending = new Map()
let refreshFailure = null
let codeUsed = false
let fixtureGhost = null
const savedRuns = []

function fixtureSession() {
  const expires = Math.floor(Date.now() / 1000) + 3600
  const part = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return { access_token: `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ exp: expires, sub: user.id, role: 'authenticated' })}.fixture`, refresh_token: 'fixture-refresh', expires_at: expires, expires_in: 3600, token_type: 'bearer', user }
}

function callbackPath(type = 'oauth') {
  const session = fixtureSession()
  const params = new URLSearchParams({ access_token: session.access_token, refresh_token: session.refresh_token, expires_in: String(session.expires_in), token_type: session.token_type, type })
  return `/auth/callback#${params}`
}

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Chrome command timed out: ${method}`)) }, 15000)
    pending.set(id, { resolve: (value) => { clearTimeout(timeout); resolve(value) }, reject: (error) => { clearTimeout(timeout); reject(error) } })
    socket.send(JSON.stringify({ id, method, params }))
  })
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
  return result.result.value
}

async function waitFor(expression) {
  for (let attempt = 0; attempt < 200; attempt++) {
    if (await evaluate(`Boolean(${expression})`)) return
    await delay(100)
  }
  throw new Error(`Browser did not reach expected state: ${expression}`)
}

async function loadPage(method, params) {
  assert.ok(socket, 'Browser must be connected before navigation')
  let onMessage, timeout
  const loaded = new Promise((resolve, reject) => {
    timeout = setTimeout(() => reject(new Error('Page navigation timed out')), 20000)
    onMessage = ({ data }) => { if (JSON.parse(data).method === 'Page.domContentEventFired') resolve() }
    socket.addEventListener('message', onMessage)
  })
  try {
    await send(method, params)
    await loaded
  } finally {
    clearTimeout(timeout)
    socket.removeEventListener('message', onMessage)
  }
}

const navigate = (path) => loadPage('Page.navigate', { url: origin + path })
const reload = () => loadPage('Page.reload', {})

async function click(text) {
  await waitFor(`[...document.querySelectorAll('button')].some((button) => button.textContent.trim() === ${JSON.stringify(text)} && !button.disabled)`)
  await evaluate(`[...document.querySelectorAll('button')].find((button) => button.textContent.trim() === ${JSON.stringify(text)}).click()`)
}

async function expectSignedIn() {
  await waitFor(`document.querySelector('footer')?.textContent.includes(${JSON.stringify(user.email)}) && [...document.querySelectorAll('button')].some((button) => button.textContent.trim() === 'Profile')`)
  assert.equal(await evaluate("!![...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Profile')"), true)
}

async function expectGuest() {
  await waitFor("document.querySelector('.typing-input') && [...document.querySelectorAll('button')].some((button) => button.textContent.trim() === 'Log in')")
}

async function resetGuest() {
  refreshFailure = null
  await navigate('/')
  await waitFor("!!document.querySelector('.typing-input')")
  await evaluate('localStorage.clear()')
  await navigate('/')
  await expectGuest()
}

async function startBrowser() {
  await unlink(join(profile, 'DevToolsActivePort')).catch(() => {})
  browser = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
  let launchLog = ''
  browser.stderr.on('data', (data) => { launchLog = (launchLog + data).slice(-2000) })
  const launchFailure = new Promise((_, reject) => browser.once('error', reject))
  const connect = async () => {
    let port
    for (let attempt = 0; attempt < 200; attempt++) {
      try {
        port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0])
        const targets = await (await fetch(`http://127.0.0.1:${port}/json`, { signal: AbortSignal.timeout(1000) })).json()
        const target = targets.find((candidate) => candidate.type === 'page')
        if (target) {
          socket = new WebSocket(target.webSocketDebuggerUrl)
          await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
          break
        }
      } catch { await delay(100) }
    }
    assert.ok(socket, `Chrome remote debugging must start (exit ${browser.exitCode}): ${launchLog}`)
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data)
      if (message.id) {
        const request = pending.get(message.id)
        pending.delete(message.id)
        if (request) {
          if (message.error) request.reject(new Error(message.error.message))
          else request.resolve(message.result)
        }
      } else if (message.method === 'Fetch.requestPaused') {
        respond(message.params).catch((error) => {
          // Navigation can cancel a paused request before the fixture response arrives.
          if (!/Invalid InterceptionId/.test(error.message)) { console.error(error.message); browser?.kill() }
        })
      }
    })
    await send('Page.enable')
    await send('Fetch.enable', { patterns: [{ urlPattern: `${authOrigin}/*` }] })
  }
  await Promise.race([connect(), launchFailure])
}

async function stopBrowser() {
  if (!browser) return
  const exited = new Promise((resolve) => browser.once('exit', resolve))
  await send('Browser.close').catch(() => {})
  await Promise.race([exited, delay(5000)])
  socket?.close()
  socket = null
  if (browser.exitCode === null) { browser.kill(); await exited }
  browser = null
  await delay(300)
}

async function respond({ requestId, request }) {
  const url = new URL(request.url)
  let body = {}
  let status = 200
  const headers = [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Access-Control-Allow-Headers', value: '*' }, { name: 'Access-Control-Allow-Methods', value: '*' }]
  if (request.method === 'OPTIONS') body = ''
  else if (url.pathname.endsWith('/user')) body = user
  else if (url.pathname.endsWith('/authorize')) {
    status = 302
    headers.push({ name: 'Location', value: origin + callbackPath() })
  } else if (url.pathname.endsWith('/token')) {
    if (refreshFailure === 'offline') {
      await evaluate('window.authClockOffset += 31000')
      status = 503
      body = { message: 'Service temporarily unavailable' }
    } else if (url.searchParams.get('grant_type') === 'pkce') {
      const payload = JSON.parse(request.postData || '{}')
      if (codeUsed || payload.auth_code !== 'fixture-once' || payload.code_verifier !== 'fixture-verifier') {
        status = 400
        body = { error_code: 'invalid_grant', msg: 'Login code expired or reused' }
      } else { codeUsed = true; body = fixtureSession() }
    } else if (refreshFailure === 'revoked') { status = 400; body = { error_code: 'refresh_token_not_found', msg: 'Refresh token revoked' } }
    else body = fixtureSession()
  } else if (url.pathname.endsWith('/logout')) { status = 204; body = '' }
  else if (url.pathname.endsWith('/profiles')) body = [{ handle: null, published: false }]
  else if (url.pathname.endsWith('/get_profile_ghost') && fixtureGhost) body = fixtureGhost
  else if (url.pathname.endsWith('/results') && request.method === 'POST') { savedRuns.push(JSON.parse(request.postData)); body = [] }
  else if (url.pathname.includes('/rest/v1/')) body = []
  await send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: headers, body: Buffer.from(status === 204 ? '' : JSON.stringify(body)).toString('base64') })
}

before(async () => {
  process.env.VITE_SUPABASE_URL = authOrigin
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fixture'
  server = await createServer({ root: process.env.KEYSMASH_TEST_ROOT, server: { host: '127.0.0.1', port: 0, watch: null } })
  await server.listen()
  origin = `http://127.0.0.1:${server.httpServer.address().port}`
  profile = await mkdtemp(join(tmpdir(), 'keysmash-persistent-login-'))
  await startBrowser()
})

after(async () => {
  await stopBrowser()
  await server?.close()
})

test('a rejected login callback explains the failure and leaves guest typing available', async () => {
  await navigate('/auth/callback#error=access_denied&error_description=Login%20cancelled')
  await waitFor("document.querySelector('.typing-input') && document.querySelector('dialog')?.open")
  const message = await evaluate("document.querySelector('dialog [role=status]')?.textContent")
  assert.match(message, /cancelled|expired|failed/i)
  assert.equal(await evaluate("!![...document.querySelectorAll('button')].find((button) => button.textContent === 'Log in')"), true)
})

test('Google login survives refresh, profile navigation, and closing and reopening the browser', async () => {
  await resetGuest()
  await click('Log in')
  await click('Continue with Google')
  await expectSignedIn()
  assert.equal(await evaluate('location.pathname + location.hash'), '/')
  assert.equal(await evaluate("document.querySelector('dialog').open"), false)
  await reload()
  await expectSignedIn()
  await click('Profile')
  await click('View profile')
  await waitFor("location.pathname === '/profile' && document.querySelector('footer')")
  assert.match(await evaluate('document.body.textContent'), /returning@example\.test/)
  await stopBrowser()
  await startBrowser()
  await navigate('/profile#history')
  await expectSignedIn()
  assert.equal(await evaluate('location.pathname'), '/profile')
  savedRuns.length = 0
  await click('Type')
  await waitFor("!!document.querySelector('.typing-input')")
  await evaluate("(() => { const input = document.querySelector('.typing-input'); const text = document.querySelector('.typing-text').textContent.slice(0, 5); const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, text); input.dispatchEvent(new Event('input', { bubbles: true })); })()")
  await evaluate('window.authRunClock = Date.now; Date.now = () => window.authRunClock() + 121000')
  await waitFor("document.querySelector('.results')?.textContent.includes('Cloud copy saved')")
  await evaluate('Date.now = window.authRunClock')
  assert.equal(savedRuns.at(-1)?.user_id, user.id, 'The restored account owns the completed standard run')
})

test('logout stays effective after reopening the browser and a missing callback requests a new link', async () => {
  await click('Profile')
  await click('Log out')
  await expectGuest()
  await stopBrowser()
  await startBrowser()
  await navigate('/')
  await expectGuest()
  await navigate('/auth/callback?code=expired-link')
  await waitFor("document.querySelector('dialog')?.open")
  assert.match(await evaluate("document.querySelector('dialog [role=status]')?.textContent"), /expired|new link/i)
  await expectGuest()
})

test('email magic-link login survives refresh and restoring the browser session', async () => {
  await resetGuest()
  await click('Log in')
  await evaluate(`(() => { const input = document.querySelector('#login-email'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(user.email)}); input.dispatchEvent(new Event('input', { bubbles: true })); })()`)
  await click('Send login link')
  await waitFor("document.querySelector('dialog [role=status]')?.textContent.includes('Check your inbox')")
  await navigate(callbackPath('magiclink'))
  await expectSignedIn()
  await reload()
  await expectSignedIn()
  await stopBrowser()
  await startBrowser()
  await navigate('/')
  await expectSignedIn()
})

test('an expired access token refreshes without requiring login', async () => {
  await resetGuest()
  await navigate(callbackPath())
  await expectSignedIn()
  const clock = await send('Page.addScriptToEvaluateOnNewDocument', { source: 'const originalNow = Date.now; Date.now = () => originalNow() + 3700000' })
  try {
    await reload()
    await expectSignedIn()
  } finally {
    await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: clock.identifier })
  }
})

test('a revoked refresh session returns to guest practice', async () => {
  await resetGuest()
  await navigate(callbackPath())
  await expectSignedIn()
  refreshFailure = 'revoked'
  const clock = await send('Page.addScriptToEvaluateOnNewDocument', { source: 'const originalNow = Date.now; Date.now = () => originalNow() + 3700000' })
  try {
    await reload()
    await expectGuest()
    assert.doesNotMatch(await evaluate("document.querySelector('footer').textContent"), /Signed in as/)
  } finally {
    refreshFailure = null
    await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: clock.identifier })
  }
})

test('a temporary refresh failure explains the problem and retains credentials for recovery', async () => {
  await resetGuest()
  await navigate(callbackPath())
  await expectSignedIn()
  refreshFailure = 'offline'
  const clock = await send('Page.addScriptToEvaluateOnNewDocument', { source: 'window.authClockOffset = 3700000; const originalNow = Date.now; Date.now = () => originalNow() + window.authClockOffset' })
  try {
    await reload()
    await waitFor("document.querySelector('.typing-input') && document.querySelector('dialog')?.open")
    assert.match(await evaluate("document.querySelector('dialog [role=status]')?.textContent"), /connect|connection|restore/i)
    refreshFailure = null
    await reload()
    await expectSignedIn()
  } finally {
    refreshFailure = null
    await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: clock.identifier })
  }
})

test('blocked browser storage leaves login and guest typing usable with a persistence warning', async () => {
  await resetGuest()
  const blocked = await send('Page.addScriptToEvaluateOnNewDocument', { source: "Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Storage unavailable', 'SecurityError') } })" })
  try {
    await navigate(callbackPath())
    await expectSignedIn()
    assert.match(await evaluate("document.querySelector('footer').textContent"), /this visit only/i)
    await reload()
    await expectGuest()
  } finally {
    await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: blocked.identifier })
  }
})

test('a valid one-use PKCE callback signs in without a duplicate-exchange error', async () => {
  await resetGuest()
  codeUsed = false
  // The fixture represents the continuation saved by the external auth SDK before redirect.
  await evaluate(`localStorage.setItem('sb-auth-fixture-auth-token-code-verifier', ${JSON.stringify(JSON.stringify('fixture-verifier'))})`)
  await navigate('/auth/callback?code=fixture-once')
  await expectSignedIn()
  assert.equal(await evaluate("document.querySelector('dialog').open"), false)
  assert.equal(await evaluate('location.pathname + location.search'), '/')
  await reload()
  await expectSignedIn()
})

test('a callback service failure gives connection feedback rather than declaring the link expired', async () => {
  await resetGuest()
  codeUsed = false
  refreshFailure = 'offline'
  await evaluate(`localStorage.setItem('sb-auth-fixture-auth-token-code-verifier', ${JSON.stringify(JSON.stringify('fixture-verifier'))})`)
  const clock = await send('Page.addScriptToEvaluateOnNewDocument', { source: 'window.authClockOffset = 0; const originalNow = Date.now; Date.now = () => originalNow() + window.authClockOffset' })
  try {
    await navigate('/auth/callback?code=fixture-once')
    await waitFor("document.querySelector('.typing-input') && document.querySelector('dialog')?.open")
    assert.match(await evaluate("document.querySelector('dialog [role=status]')?.textContent"), /connect|connection/i)
    await expectGuest()
  } finally {
    refreshFailure = null
    await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: clock.identifier })
  }
})

async function fillTextarea(selector, text) {
  await evaluate(`(() => { const input = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(input, ${JSON.stringify(text)}); input.dispatchEvent(new Event('input', { bubbles: true })); })()`)
}

test('custom editor applies normalized text without starting the timer or altering standard settings', async () => {
  await resetGuest()
  await click('Custom')
  await fillTextarea('#custom-text', '  Hi,\n\tTHERE!  ')
  await click('Use this text')
  await waitFor("document.querySelector('.typing-text')?.textContent.startsWith('Hi, THERE! Hi, THERE!')")
  assert.equal(await evaluate("document.querySelector('.clock strong').textContent"), '60')
  await fillTextarea('#custom-text', '   \n\t')
  await click('Use this text')
  assert.match(await evaluate("document.querySelector('.custom-editor [role=alert]').textContent"), /nonblank/i)
  assert.equal(await evaluate("document.querySelector('.typing-text').textContent.startsWith('Hi, THERE!')"), true)
  await fillTextarea('#custom-text', 'a'.repeat(2000))
  await click('Use this text')
  await waitFor("document.querySelector('.typing-text').textContent.startsWith('a'.repeat(2000))")
  await fillTextarea('#custom-text', 'b'.repeat(2001))
  await click('Use this text')
  assert.match(await evaluate("document.querySelector('.custom-editor [role=alert]').textContent"), /2,000/)
  assert.equal(await evaluate("document.querySelector('.typing-text').textContent.startsWith('a'.repeat(2000))"), true)
})

async function expireCustom(duration, typed) {
  await evaluate('window.practiceClock = Date.now; window.practiceStart = Date.now(); Date.now = () => window.practiceStart')
  try {
    await fillTextarea('.typing-input', typed)
    assert.equal(await evaluate("!!document.querySelector('.results')"), false, 'Passage exhaustion must not finish a run')
    await evaluate(`Date.now = () => window.practiceStart + ${duration * 1000}`)
    await waitFor("!!document.querySelector('.results')")
  } finally {
    await evaluate('Date.now = window.practiceClock')
  }
}

test('all custom durations score case and punctuation errors and repeat across pages without PB or cloud effects', async () => {
  await resetGuest()
  await navigate(callbackPath())
  await expectSignedIn()
  const prior = { id: 'prior-standard', mode: 'time-60w-60s', wpm: 40, acc: 95, created_at: '2026-10-10T00:00:00Z' }
  const priorPbs = JSON.stringify({ [prior.mode]: prior })
  await evaluate(`localStorage.setItem('keysmash-pb-v1', ${JSON.stringify(priorPbs)}); localStorage.setItem('keysmash-history-v1', ${JSON.stringify(JSON.stringify([prior]))})`)
  savedRuns.length = 0
  await click('Custom')
  await fillTextarea('#custom-text', 'Ab, Z!')
  await click('Use this text')
  for (const duration of [15, 30, 60, 120]) {
    await click(`${duration}s`)
    await expireCustom(duration, 'Ab, Z! '.repeat(30) + 'Ab, z!')
    const entry = await evaluate("JSON.parse(localStorage.getItem('keysmash-history-v1'))[0]")
    assert.equal(entry.mode, `custom-${duration}s`)
    assert.equal(entry.wpm, ({ 15: 172, 30: 86, 60: 43, 120: 22 })[duration])
    assert.equal(entry.acc, 99.5)
    assert.equal(entry.elapsed_s, duration)
    assert.equal(entry.seed, undefined)
    assert.equal(entry.word_set_version, undefined)
    assert.equal(entry.text, undefined)
    assert.equal(entry.typed, undefined)
    assert.equal(await evaluate("localStorage.getItem('keysmash-pb-v1')"), priorPbs)
    assert.doesNotMatch(await evaluate("document.querySelector('.results').textContent"), /personal best|Race your best|First recorded/i)
    assert.equal(savedRuns.length, 0)
    if (duration === 120) break
    await click('Type again Tab')
    await waitFor("!!document.querySelector('.typing-input')")
    assert.equal(await evaluate("document.querySelector('.typing-text').textContent.startsWith('Ab, Z!')"), true)
    assert.equal(await evaluate("document.querySelector('.clock strong').textContent"), String(duration))
  }
  await click('View history')
  await waitFor("document.querySelector('.stats-page')?.textContent.includes('Custom practice / 15s')")
  assert.deepEqual(await evaluate("[...document.querySelectorAll('.history-summary dd')].map(el => el.textContent)"), ['5', '40', '40'])
  assert.equal(await evaluate("document.querySelector('.best-list').children.length"), 1)
  await click('Type')
  await click('Words')
  await fillTextarea('.typing-input', await evaluate("document.querySelector('.typing-text').textContent.slice(0, 5)"))
  await evaluate('window.afterCustomClock = Date.now; Date.now = () => window.afterCustomClock() + 121000')
  try {
    await waitFor("document.querySelector('.results')?.textContent.includes('Cloud copy saved')")
    assert.equal(savedRuns.length, 1)
    assert.equal(savedRuns[0].user_id, user.id)
    assert.match(savedRuns[0].mode, /^time-/)
  } finally {
    await evaluate('Date.now = window.afterCustomClock')
  }
})

test('custom draft editing, apply and timer changes reset only when explicitly requested', async () => {
  await resetGuest()
  await click('Custom')
  await fillTextarea('#custom-text', 'One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve Thirteen Fourteen Fifteen Sixteen Seventeen Eighteen Nineteen Twenty Twentyone Twentytwo Twentythree')
  await click('Use this text')
  await fillTextarea('.typing-input', 'One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve Thirteen Fourteen Fifteen Sixteen Seventeen Eighteen Nineteen Twenty ')
  await waitFor("document.querySelector('.page-position').textContent.includes('Page 2')")
  await fillTextarea('#custom-text', 'New passage.')
  assert.equal(await evaluate("document.querySelector('.typing-input').value.startsWith('One Two')"), true)
  await click('30s')
  assert.equal(await evaluate("document.querySelector('.typing-input').value"), '')
  assert.equal(await evaluate("document.querySelector('.typing-text').textContent.startsWith('One Two')"), true)
  await fillTextarea('.typing-input', 'One')
  await click('Use this text')
  await waitFor("document.querySelector('.typing-text').textContent.startsWith('New passage.')")
  assert.equal(await evaluate("document.querySelector('.typing-input').value"), '')
  assert.equal(await evaluate("localStorage.getItem('keysmash-history-v1')"), null)
})

test('custom editor remains usable with keyboard input at 320px and standard saving still works afterward', async () => {
  await resetGuest()
  await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 900, deviceScaleFactor: 1, mobile: false })
  try {
    await click('Custom')
    await evaluate("document.querySelector('#custom-text').focus()")
    await send('Input.insertText', { text: 'Hi, THERE!' })
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
    assert.equal(await evaluate('document.activeElement.textContent.trim()'), 'Use this text')
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' })
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
    await waitFor("document.activeElement.classList.contains('typing-input')")
    assert.equal(await evaluate("document.querySelector('#custom-text').value"), 'Hi, THERE!')
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true)
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
    await writeFile(join(tmpdir(), 'keysmash-custom-320.png'), Buffer.from(shot.data, 'base64'))
    await click('15s')
    await expireCustom(15, 'Hi, THERE! Hi, THERE!')
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true)
    await click('Words')
    await fillTextarea('.typing-input', await evaluate("document.querySelector('.typing-text').textContent.slice(0, 5)"))
    await evaluate('window.standardClock = Date.now; Date.now = () => window.standardClock() + 121000')
    await waitFor("!!document.querySelector('.results')")
    await evaluate('Date.now = window.standardClock')
    assert.equal(await evaluate("JSON.parse(localStorage.getItem('keysmash-history-v1'))[0].mode.startsWith('time-')"), true)
    assert.equal(await evaluate("Object.keys(JSON.parse(localStorage.getItem('keysmash-pb-v1'))).length"), 1)
    await click('Race your best')
    await waitFor("document.querySelector('.test-heading')?.textContent.includes('Race your best')")
    assert.equal(await evaluate("[...document.querySelectorAll('.test-settings fieldset')].every(field => field.disabled)"), true)
    await fillTextarea('.typing-input', await evaluate("document.querySelector('.typing-text').textContent.slice(0, 5)"))
    await evaluate('window.ghostClock = Date.now; Date.now = () => window.ghostClock() + 121000')
    try {
      await waitFor("!!document.querySelector('.ghost-result')")
      assert.equal(await evaluate("[...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Rematch Tab')"), true)
    } finally {
      await evaluate('Date.now = window.ghostClock')
    }
  } finally {
    await send('Emulation.clearDeviceMetricsOverride')
  }
})

test('custom text preserves Unicode and editor paste, with blocked storage feedback', async () => {
  await resetGuest()
  const blocked = await send('Page.addScriptToEvaluateOnNewDocument', { source: "Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Blocked', 'SecurityError') } })" })
  try {
    await navigate('/')
    await expectGuest()
    await click('Custom')
    await evaluate("document.querySelector('#custom-text').focus()")
    await send('Browser.grantPermissions', { origin, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] })
    await send('Emulation.setFocusEmulationEnabled', { enabled: true })
    await evaluate("navigator.clipboard.writeText('É🙂,\\nOK!')")
    await evaluate("document.querySelector('#custom-text').focus()")
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'v', code: 'KeyV', modifiers: 2, windowsVirtualKeyCode: 86, commands: ['Paste'] })
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'v', code: 'KeyV', modifiers: 2, windowsVirtualKeyCode: 86 })
    await waitFor("document.querySelector('#custom-text').value === 'É🙂,\\nOK!'")
    await click('Use this text')
    await waitFor("document.querySelector('.typing-text').textContent.startsWith('É🙂, OK! É🙂, OK!')")
    await click('15s')
    await expireCustom(15, 'É🙂, OK! É🙂, OK!')
    assert.match(await evaluate("document.querySelector('.results [role=status]').textContent"), /session only/)
    assert.equal(await evaluate("document.querySelector('.result-hero > div:nth-child(2) strong').textContent"), '100%')
  } finally {
    await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: blocked.identifier })
  }
})

test('custom results and local history remain available when storage is full', async () => {
  await resetGuest()
  await click('Custom')
  await fillTextarea('#custom-text', 'Keep typing!')
  await click('Use this text')
  await click('15s')
  await evaluate("window.savedSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function() { throw new DOMException('Full', 'QuotaExceededError') }")
  try {
    await expireCustom(15, 'Keep typing! Keep typing!')
    assert.match(await evaluate("document.querySelector('.results [role=status]').textContent"), /session only/)
    await click('View history')
    await waitFor("document.querySelector('.stats-page')?.textContent.includes('Custom practice / 15s')")
  } finally {
    await evaluate('Storage.prototype.setItem = window.savedSetItem')
  }
})

test('custom setup restores an applied passage and timer after refresh and browser reopening', async () => {
  await resetGuest()
  await click('Custom')
  await fillTextarea('#custom-text', '  Remember,\n\tTHIS!  ')
  await click('Use this text')
  await click('30s')
  await fillTextarea('#custom-text', 'Unapplied draft')
  await reload()
  await expectGuest()
  await click('Custom')
  await waitFor("document.querySelector('#custom-text').value === 'Remember, THIS!'")
  assert.equal(await evaluate("document.querySelector('.clock strong').textContent"), '30')
  assert.equal(await evaluate("document.querySelector('.typing-input').value"), '')
  await stopBrowser()
  await startBrowser()
  await navigate('/')
  await expectGuest()
  await click('Custom')
  await waitFor("document.querySelector('#custom-text').value === 'Remember, THIS!'")
  assert.equal(await evaluate("document.querySelector('.clock strong').textContent"), '30')
  assert.equal(await evaluate("document.querySelector('.typing-text').textContent.startsWith('Remember, THIS! Remember, THIS!')"), true)
})

test('signed-in custom setup survives reopen while invalid drafts and standard timers do not replace it', async () => {
  await resetGuest()
  await navigate(callbackPath())
  await expectSignedIn()
  savedRuns.length = 0
  await click('Custom')
  await fillTextarea('#custom-text', 'Local, PRIVATE!')
  await click('Use this text')
  await click('15s')
  const remembered = await evaluate("localStorage.getItem('keysmash-custom-setup-v1')")
  assert.deepEqual(JSON.parse(remembered), { text: 'Local, PRIVATE!', duration: 15 })
  for (const invalid of [' \n\t', 'x'.repeat(2001)]) {
    await fillTextarea('#custom-text', invalid)
    await click('Use this text')
    assert.equal(await evaluate("localStorage.getItem('keysmash-custom-setup-v1')"), remembered)
  }
  await click('Words')
  await click('120s')
  assert.equal(await evaluate("localStorage.getItem('keysmash-custom-setup-v1')"), remembered)
  await click('Custom')
  assert.equal(await evaluate("document.querySelector('.clock strong').textContent"), '15')
  await stopBrowser()
  await startBrowser()
  await navigate('/')
  await expectSignedIn()
  await click('Custom')
  await waitFor("document.querySelector('#custom-text').value === 'Local, PRIVATE!'")
  assert.equal(await evaluate("document.querySelector('.clock strong').textContent"), '15')
  assert.equal(await evaluate("document.querySelector('.typing-input').value"), '')
  await expireCustom(15, 'Local, PRIVATE! Local, PRIVATE!')
  assert.equal(savedRuns.length, 0)
  assert.equal(await evaluate("localStorage.getItem('keysmash-pb-v1')"), null)
  await click('Type again Tab')
  assert.equal(await evaluate("localStorage.getItem('keysmash-custom-setup-v1')"), remembered)
})

test('invalid saved custom settings recover without changing standard records', async () => {
  await resetGuest()
  const pbs = JSON.stringify({ 'time-60w-60s': { wpm: 42, acc: 98 } })
  const history = JSON.stringify([{ id: 'standard', mode: 'time-60w-60s', wpm: 42, acc: 98, created_at: '2026-10-10T00:00:00Z' }])
  await evaluate(`localStorage.setItem('keysmash-pb-v1', ${JSON.stringify(pbs)}); localStorage.setItem('keysmash-history-v1', ${JSON.stringify(history)})`)
  const cases = [
    [null, '', 60], ['{broken', '', 60], ['null', '', 60], ['[]', '', 60], ['42', '', 60],
    [JSON.stringify({ text: ' \n\t ', duration: 7 }), '', 60],
    [JSON.stringify({ text: 'x'.repeat(2001), duration: 120 }), '', 120],
    [JSON.stringify({ text: 37, duration: 30 }), '', 30],
    [JSON.stringify({ text: 'Valid!', duration: '30' }), 'Valid!', 60],
  ]
  for (const [stored, text, duration] of cases) {
    await evaluate(stored === null ? "localStorage.removeItem('keysmash-custom-setup-v1')" : `localStorage.setItem('keysmash-custom-setup-v1', ${JSON.stringify(stored)})`)
    await reload()
    await expectGuest()
    await click('Custom')
    assert.equal(await evaluate("document.querySelector('#custom-text').value"), text)
    assert.equal(await evaluate("document.querySelector('.clock strong').textContent"), String(duration))
    assert.equal(await evaluate("document.querySelector('.typing-input').disabled"), !text)
    assert.equal(await evaluate("localStorage.getItem('keysmash-pb-v1')"), pbs)
    assert.equal(await evaluate("localStorage.getItem('keysmash-history-v1')"), history)
  }
  await fillTextarea('#custom-text', 'Recovered.')
  await click('Use this text')
  await reload()
  await expectGuest()
  await click('Custom')
  assert.equal(await evaluate("document.querySelector('#custom-text').value"), 'Recovered.')
})

test('custom setup storage failures explain visit-only retention and keep practice and retry usable at 320px', async () => {
  for (const failure of ['blocked', 'full', 'read']) {
    await resetGuest()
    const source = failure === 'blocked'
      ? "Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Blocked', 'SecurityError') } })"
      : failure === 'full'
        ? "const nativeSet = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'keysmash-custom-setup-v1') throw new DOMException('Full', 'QuotaExceededError'); return nativeSet.call(this, key, value) }"
        : "const nativeGet = Storage.prototype.getItem; Storage.prototype.getItem = function(key) { if (key === 'keysmash-custom-setup-v1') throw new Error('Read unavailable'); return nativeGet.call(this, key) }"
    const broken = await send('Page.addScriptToEvaluateOnNewDocument', { source })
    await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 900, deviceScaleFactor: 1, mobile: false })
    try {
      await navigate('/')
      await expectGuest()
      await click('Custom')
      if (failure !== 'full') assert.match(await evaluate("document.querySelector('.custom-editor [role=status]').textContent"), /will not be remembered/)
      await fillTextarea('#custom-text', 'Still usable!')
      await click('Use this text')
      await click('15s')
      assert.match(await evaluate("document.querySelector('.custom-editor [role=status]').textContent"), /will not be remembered/)
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true)
      const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
      if (failure === 'full') await writeFile(join(tmpdir(), 'keysmash-custom-setup-warning-320.png'), Buffer.from(screenshot.data, 'base64'))
      await expireCustom(15, 'Still usable! Still usable!')
      assert.match(await evaluate("document.querySelector('.results').textContent"), /Custom practice \/ 15s/)
      await click('Type again Tab')
      assert.equal(await evaluate("document.querySelector('.clock strong').textContent"), '15')
      assert.equal(await evaluate("document.querySelector('.typing-text').textContent.startsWith('Still usable!')"), true)
      await click('Stats')
      await waitFor("document.querySelector('.stats-page')?.textContent.includes('Custom practice / 15s')")
    } finally {
      await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: broken.identifier })
      await send('Emulation.clearDeviceMetricsOverride')
    }
  }
})

test('returning from a standard ghost race restores the custom timer without changing remembered settings', async () => {
  await resetGuest()
  fixtureGhost = { handle: 'fixture', mode: 'time-60w-15s', word_count: 60, duration_s: 15, seed: 123, wpm: 40, accuracy: 98, word_set_version: 1 }
  try {
    await navigate('/u/fixture/race/time-60w-15s')
    await waitFor("document.querySelector('.test-heading')?.textContent.includes('Race @fixture')")
    await click('Type')
    await click('Custom')
    await fillTextarea('#custom-text', 'My custom practice.')
    await click('Use this text')
    await click('30s')
    const remembered = await evaluate("localStorage.getItem('keysmash-custom-setup-v1')")
    await evaluate('history.back()')
    await waitFor("document.querySelector('.test-heading')?.textContent.includes('Race @fixture')")
    assert.equal(await evaluate("document.querySelector('.clock strong').textContent"), '15')
    await click('Type')
    await waitFor("!!document.querySelector('#custom-text')")
    assert.equal(await evaluate("document.querySelector('.clock strong').textContent"), '30')
    await click('Use this text')
    assert.equal(await evaluate("localStorage.getItem('keysmash-custom-setup-v1')"), remembered)
  } finally {
    fixtureGhost = null
  }
})

test('an unconfigured site still lets a guest finish a standard typing test', async () => {
  const localServer = await createServer({ root: process.env.KEYSMASH_TEST_ROOT, define: { 'import.meta.env.VITE_SUPABASE_URL': '""', 'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': '""' }, server: { host: '127.0.0.1', port: 0, watch: null } })
  const configuredOrigin = origin
  try {
    await localServer.listen()
    origin = `http://127.0.0.1:${localServer.httpServer.address().port}`
    await navigate('/')
    await waitFor("!!document.querySelector('.typing-input')")
    assert.equal(await evaluate("[...document.querySelectorAll('button')].some((button) => button.textContent.trim() === 'Log in')"), false)
    await evaluate("(() => { const input = document.querySelector('.typing-input'); const text = document.querySelector('.typing-text').textContent.slice(0, 5); const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, text); input.dispatchEvent(new Event('input', { bubbles: true })); })()")
    await evaluate('const originalNow = Date.now; Date.now = () => originalNow() + 121000')
    await waitFor("!!document.querySelector('.results')")
    assert.match(await evaluate("document.querySelector('.results').textContent"), /WPM/)
  } finally {
    origin = configuredOrigin
    await localServer.close()
  }
})
