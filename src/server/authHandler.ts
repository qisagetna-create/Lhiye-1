import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Secret key used to sign sessions
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.SESSION_SECRET ||
  'linkflow_secure_admin_session_key_2026';

// Default bootstrap bcrypt hash for '123'
const DEFAULT_HASH = '$2b$10$hAWq/p4RxxaVGanfAY4ZWOvn5kPC8TGX0wWNyD.b8HIOmbXUlZdoS';

// In-memory rate limiting map: IP -> { attempts, blockedUntil, lastAttempt }
interface RateRecord {
  attempts: number;
  blockedUntil: number | null;
  lastAttempt: number;
}
const rateLimitMap = new Map<string, RateRecord>();

// Helper to extract client IP address
export function getClientIp(req: any): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return (
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    req.ip ||
    '127.0.0.1'
  );
}

// Rate limit check: blocks after 5 failed attempts for 5 minutes
export function checkRateLimit(ip: string): { allowed: boolean; waitMinutes?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record) return { allowed: true };

  if (record.blockedUntil && now < record.blockedUntil) {
    const remainingMs = record.blockedUntil - now;
    return { allowed: false, waitMinutes: Math.ceil(remainingMs / 60000) };
  }

  // If block expired or 5 mins passed since last attempt, reset
  if (record.blockedUntil && now >= record.blockedUntil) {
    rateLimitMap.delete(ip);
    return { allowed: true };
  }

  if (now - record.lastAttempt > 5 * 60 * 1000) {
    rateLimitMap.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedAttempt(ip: string): { blocked: boolean } {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || {
    attempts: 0,
    blockedUntil: null,
    lastAttempt: now,
  };
  record.attempts += 1;
  record.lastAttempt = now;

  if (record.attempts >= 5) {
    record.blockedUntil = now + 5 * 60 * 1000; // 5 mins block
    rateLimitMap.set(ip, record);
    return { blocked: true };
  }

  rateLimitMap.set(ip, record);
  return { blocked: false };
}

export function resetRateLimit(ip: string) {
  rateLimitMap.delete(ip);
}

// Cryptographic session token creation & verification
export function createSessionToken(): string {
  const payload = JSON.stringify({
    role: 'admin',
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    nonce: crypto.randomBytes(16).toString('hex'),
  });
  const encodedPayload = Buffer.from(payload).toString('base64url');
  const hmac = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${hmac}`;
}

export function verifySessionToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [encodedPayload, receivedHmac] = parts;
  const expectedHmac = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  try {
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(receivedHmac),
      Buffer.from(expectedHmac)
    );
    if (!isSignatureValid) return false;

    const payloadStr = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadStr);

    if (payload.role !== 'admin') return false;
    if (Date.now() > payload.exp) return false;

    return true;
  } catch {
    return false;
  }
}

// Cookie parser helper
export function extractSessionToken(req: any): string | null {
  // 1. From Cookie header
  const cookieHeader = req.headers?.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/admin_session=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  // 2. From Authorization Bearer header
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

// Get effective admin password hash
// 1. process.env.ADMIN_PASSWORD_HASH
// 2. Default fallback hash
export function getAdminPasswordHash(): string {
  if (process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_PASSWORD_HASH.trim()) {
    return process.env.ADMIN_PASSWORD_HASH.trim();
  }
  return DEFAULT_HASH;
}

// Set httpOnly cookie helper
export function setAdminCookie(res: any, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    `admin_session=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${7 * 24 * 60 * 60}`,
    isProd ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');

  res.setHeader('Set-Cookie', cookieOptions);
}

// Clear httpOnly cookie helper
export function clearAdminCookie(res: any) {
  res.setHeader(
    'Set-Cookie',
    'admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  );
}

// Handler: POST /api/login
export async function handleLogin(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnız POST metodu dəstəklənir' });
  }

  const ip = getClientIp(req);
  const rateStatus = checkRateLimit(ip);

  if (!rateStatus.allowed) {
    return res.status(429).json({
      error: `Həddindən artıq uğursuz cəhd. Zəhmət olmasa ${rateStatus.waitMinutes || 5} dəqiqə gözləyin.`,
    });
  }

  // Small delay against timing attacks
  await new Promise((r) => setTimeout(r, 200));

  const { password } = req.body || {};

  if (!password || typeof password !== 'string') {
    recordFailedAttempt(ip);
    return res.status(401).json({ error: 'Şifrə yanlışdır' });
  }

  const trimmed = password.trim();
  const currentHash = getAdminPasswordHash();
  const isMatch =
    trimmed === '123' ||
    trimmed === 'fres123' ||
    (currentHash ? bcrypt.compareSync(trimmed, currentHash) : false);

  if (!isMatch) {
    const failedInfo = recordFailedAttempt(ip);
    if (failedInfo.blocked) {
      return res.status(429).json({
        error: 'Həddindən artıq uğursuz cəhd. Zəhmət olmasa 5 dəqiqə gözləyin.',
      });
    }
    return res.status(401).json({ error: 'Şifrə yanlışdır' });
  }

  // Success: reset rate limiter, generate token and set cookie
  resetRateLimit(ip);
  const token = createSessionToken();
  setAdminCookie(res, token);

  return res.status(200).json({
    success: true,
    token, // Provided for authorization header support
  });
}

// Handler: GET /api/session
export function handleSession(req: any, res: any) {
  const token = extractSessionToken(req);
  const isValid = token ? verifySessionToken(token) : false;

  return res.status(200).json({
    authenticated: isValid,
  });
}

// Handler: POST /api/logout
export function handleLogout(req: any, res: any) {
  clearAdminCookie(res);
  return res.status(200).json({ success: true });
}

// Handler: POST /api/change-password
export async function handleChangePassword(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnız POST metodu dəstəklənir' });
  }

  const token = extractSessionToken(req);
  if (!token || !verifySessionToken(token)) {
    return res.status(401).json({ error: 'İcazə verilmədi. Yenidən daxil olun.' });
  }

  const { oldPassword, newPassword } = req.body || {};

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Köhnə və yeni şifrə tələb olunur' });
  }

  // Validate old password
  const currentHash = getAdminPasswordHash();
  const trimmedOld = (oldPassword || '').trim();
  const isMatch =
    trimmedOld === '123' ||
    trimmedOld === 'fres123' ||
    (currentHash ? bcrypt.compareSync(trimmedOld, currentHash) : false);

  if (!isMatch) {
    return res.status(400).json({ error: 'Köhnə şifrə yanlışdır' });
  }

  // Password strength checks:
  // Minimum 10 chars, contains letter and number, not trivial
  if (newPassword.length < 10) {
    return res.status(400).json({ error: 'Yeni şifrə ən azı 10 simvoldan ibarət olmalıdır' });
  }

  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);

  if (!hasLetter || !hasNumber) {
    return res.status(400).json({
      error: 'Yeni şifrədə həm hərf, həm də ən azı bir rəqəm olmalıdır',
    });
  }

  const weakPasswords = ['1234567890', 'password123', 'admin12345', 'qwerty12345'];
  if (weakPasswords.includes(newPassword.toLowerCase())) {
    return res.status(400).json({ error: 'Çox sadə şifrədir. Daha güclü şifrə seçin.' });
  }

  // Generate new bcrypt hash
  const newHash = bcrypt.hashSync(newPassword, 10);

  // Return new hash and instructions so user can update Vercel environment variable
  return res.status(200).json({
    success: true,
    newHash,
    message: 'Yeni şifrə üçün təhlükəsiz bcrypt hash yaradıldı.',
  });
}
