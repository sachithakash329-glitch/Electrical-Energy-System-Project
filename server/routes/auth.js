import { Router } from 'express';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { hashPassword, verifyPassword } from '../auth/passwords.js';
import { clearSessionCookie, publicUser, readToken, requireUser, startSession, tokenDigest } from '../auth/session.js';
import { loginLimiter } from '../auth/requestSecurity.js';

const router = Router();
const limitSignIns = loginLimiter();
const badInput = message => Object.assign(new Error(message), { status: 400 });

function credentials(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw badInput('Please enter your email and password.');
  if (typeof body.email !== 'string' || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    throw badInput('Please enter a valid email address.');
  }
  if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 128) {
    throw badInput('Use a password with 12 to 128 characters.');
  }
  return { email: body.email.trim().toLowerCase(), password: body.password };
}

function optionalText(value, maximum, field) {
  if (value == null || value === '') return '';
  if (typeof value !== 'string' || value.trim().length > maximum) throw badInput(`Please enter a valid ${field}.`);
  return value.trim();
}

router.post('/register', limitSignIns, async (req, res) => {
  const { email, password } = credentials(req.body);
  const { fullName, householdSize } = req.body;
  if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 80) {
    throw badInput('Full name must contain 2 to 80 characters.');
  }
  if (householdSize != null && (!Number.isInteger(householdSize) || householdSize < 1 || householdSize > 50)) {
    throw badInput('Household members must be a whole number from 1 to 50.');
  }
  const profile = {
    fullName: fullName.trim(), email,
    householdName: optionalText(req.body.householdName, 60, 'household name'),
    city: optionalText(req.body.city, 80, 'city or district'),
    householdSize: householdSize ?? null
  };
  if (await User.exists({ email })) return res.status(409).json({ message: 'An account with this email already exists. Please log in.' });
  const passwordHash = await hashPassword(password);
  let user;
  try { user = await User.create({ ...profile, passwordHash }); }
  catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists. Please log in.' });
    throw error;
  }
  await startSession(req, res, user);
  res.status(201).json({ user: publicUser(user) });
});

router.post('/login', limitSignIns, async (req, res) => {
  const { email, password } = credentials(req.body);
  const user = await User.findOne({ email }).select('+passwordHash');
  const correct = await verifyPassword(password, user?.passwordHash);
  if (!user || !correct) return res.status(401).json({ message: 'Email or password is incorrect.' });
  await startSession(req, res, user);
  res.json({ user: publicUser(user) });
});

router.get('/me', requireUser, (req, res) => res.json({ user: publicUser(req.user) }));

router.post('/logout', async (req, res) => {
  const token = readToken(req);
  if (token) await Session.deleteOne({ _id: tokenDigest(token) });
  clearSessionCookie(res);
  res.json({ message: 'You have logged out.' });
});

export default router;
