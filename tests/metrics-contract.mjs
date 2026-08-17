import assert from 'node:assert/strict';
import { calculateConversion, normalizeEvent } from '../functions/api/metrics/_lib.ts';

assert.deepEqual(normalizeEvent({ event: 'page_view', device_type: 'mobile', page_path: '/' }), {
  eventName: 'page_view',
  deviceType: 'mobile',
  pagePath: '/',
});
assert.equal(normalizeEvent({ event: 'unknown_event' }), null);
assert.equal(normalizeEvent({ event: 'page_view', page_path: 'x'.repeat(1000) }), null);
assert.equal(calculateConversion(100, 5), 5);
assert.equal(calculateConversion(0, 0), null);
console.log('metrics contract passed');
