import { createHash, randomBytes } from 'node:crypto';
import Session from '../models/Session.js';

const cookieName = 'ee_session';
const lifetime = 24 * 60 * 60 * 1000;
const cookieOptions = () => ({
  httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/api'
});

export function tokenDigest(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function readToken(req) {
  const value = (req.headers.cookie || '').split(';').map(part => part.trim())
    .find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  return /^[a-f0-9]{64}$/.test(value || '') ? value : null;
}

export function publicUser(user) {
  return {
    _id: user._id.toString(), fullName: user.fullName, email: user.email,
    householdName: user.householdName, city: user.city, householdSize: user.householdSize
  };
}

export function clearSessionCookie(res) { res.clearCookie(cookieName, cookieOptions()); }

export async function startSession(req, res, user) {
  const previous = readToken(req);
  if (previous) await Session.deleteOne({ _id: tokenDigest(previous) });
  const token = randomBytes(32).toString('hex');
  await Session.create({ _id: tokenDigest(token), userId: user._id, expiresAt: new Date(Date.now() + lifetime) });
  res.cookie(cookieName, token, { ...cookieOptions(), maxAge: lifetime });
}

export async function requireUser(req, res, next) {
  try {
    const token = readToken(req);
    const session = token && await Session.findOne({
      _id: tokenDigest(token), expiresAt: { $gt: new Date() }
    }).populate('userId');
    if (!session?.userId) {
      clearSessionCookie(res);
      return res.status(401).json({ message: 'Please log in to continue.' });
    }
    req.user = session.userId;
    next();
  } catch (error) { next(error); }
}
