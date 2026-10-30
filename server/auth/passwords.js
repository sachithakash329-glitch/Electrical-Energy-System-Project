import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);
// OWASP's 32 MiB scrypt configuration; async to avoid blocking request handling.
const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
let running = 0;

async function derivePassword(password, salt) {
  // Bound memory used by concurrent password operations on a small local server.
  if (running >= 4) throw Object.assign(new Error('Sign-in is busy. Please try again shortly.'), { status: 503 });
  running += 1;
  try { return await derive(password, salt, 32, options); }
  finally { running -= 1; }
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await derivePassword(password, salt);
  return `scrypt$32768$8$3$${salt}$${key.toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  const parts = typeof storedHash === 'string' ? storedHash.split('$') : [];
  const valid = parts.length === 6 && parts.slice(0, 4).join('$') === 'scrypt$32768$8$3' &&
    /^[a-f0-9]{32}$/.test(parts[4]) && /^[a-f0-9]{64}$/.test(parts[5]);
  // Do equivalent work for an unknown email; the response stays generic too.
  const salt = valid ? parts[4] : '00000000000000000000000000000000';
  const key = await derivePassword(password, salt);
  return valid && timingSafeEqual(key, Buffer.from(parts[5], 'hex'));
}
