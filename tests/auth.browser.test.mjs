import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, unlink } from 'node:fs/promises'
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
  else if (url.pathname.endsWith('/results') && request.method === 'POST') { savedRuns.push(JSON.parse(request.postData)); body = [] }
  else if (url.pathname.includes('/rest/v1/')) body = []
  await send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: headers, body: Buffer.from(status === 204 ? '' : JSON.stringify(body)).toString('base64') })
}

before(async () => {
  process.env.VITE_SUPABASE_URL = authOrigin
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fixture'
  server = await createServer({ server: { host: '127.0.0.1', port: 0 } })
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

test('an unconfigured site still lets a guest finish a standard typing test', async () => {
  const localServer = await createServer({ define: { 'import.meta.env.VITE_SUPABASE_URL': '""', 'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': '""' }, server: { host: '127.0.0.1', port: 0 } })
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
