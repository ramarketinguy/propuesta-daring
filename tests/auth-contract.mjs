import assert from 'node:assert/strict';
import { parseSessionCookie, sessionCookie } from '../functions/api/_lib/auth.ts';

assert.equal(parseSessionCookie('daring_session=abc123'), 'abc123');
assert.equal(parseSessionCookie('other=value'), null);
assert.match(sessionCookie('abc123', 3600), /HttpOnly/);
assert.match(sessionCookie('abc123', 3600), /SameSite=Lax/);
assert.match(sessionCookie('abc123', 3600), /Max-Age=3600/);
console.log('auth contract passed');
