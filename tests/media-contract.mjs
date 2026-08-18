import assert from 'node:assert/strict';
import { mediaKey, validMedia, validPlacement } from '../functions/api/media/_lib.ts';

assert.equal(validMedia('image/jpeg', 1024), true);
assert.equal(validMedia('application/pdf', 1024), false);
assert.equal(validMedia('video/mp4', 61 * 1024 * 1024), false);
assert.equal(validPlacement('pizza'), true);
assert.equal(validPlacement('unknown'), false);
assert.match(mediaKey('pizza', 'foto con espacios.jpg'), /^pizza\/[0-9a-f-]+-foto-con-espacios\.jpg$/);
console.log('media contract passed');
