import assert from 'node:assert/strict'
import { sanitizeRichText } from '../utils/sanitizeRichText'

const sanitized = sanitizeRichText(`
  <h2 onclick="alert(1)">About RouteShip</h2>
  <script>alert('xss')</script>
  <p>Safe <strong>formatted</strong> content.</p>
  <a href="javascript:alert(1)" target="_blank">Bad link</a>
  <a href="https://shiplifi.com" target="_blank">Good link</a>
  <img src="https://cdn.example.com/logo.png" onerror="alert(1)" alt="Logo">
`)

assert.match(sanitized, /<h2>About RouteShip<\/h2>/)
assert.match(sanitized, /<strong>formatted<\/strong>/)
assert.match(sanitized, /href="https:\/\/shiplifi\.com"/)
assert.match(sanitized, /rel="noopener noreferrer"/)
assert.match(sanitized, /src="https:\/\/cdn\.example\.com\/logo\.png"/)
assert.doesNotMatch(sanitized, /<script|onclick|onerror|javascript:/i)

console.log('Rich-text sanitization checks passed')
