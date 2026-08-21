const jwt = require('jsonwebtoken');

const SESSION_COOKIE = 'crown_session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(';')) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) continue;

    const cookieName = part.slice(0, separatorIndex).trim();
    if (cookieName !== name) continue;

    const value = part.slice(separatorIndex + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return null;
}

function getSessionToken(req) {
  // Le cookie représente la session de navigation courante. Le Bearer reste
  // accepté pour migrer sans coupure les anciennes sessions localStorage.
  const cookieToken = getCookie(req, SESSION_COOKIE);
  if (cookieToken && verifySessionToken(cookieToken)) return cookieToken;

  const authHeader = req.headers.authorization;
  if (authHeader) {
    return authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : authHeader.trim();
  }

  // Retourne tout de même le cookie invalide afin que l'appelant puisse
  // l'identifier comme expiré et demander sa suppression au navigateur.
  return cookieToken;
}

function verifySessionToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'B3tterTh@nB');
  } catch {
    return null;
  }
}

function isSecureRequest(req) {
  return req.secure || req.headers['x-forwarded-proto'] === 'https';
}

function setSessionCookie(req, res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_MS
  });
}

function clearSessionCookie(req, res) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: 'lax',
    path: '/'
  });
}

module.exports = {
  clearSessionCookie,
  getSessionToken,
  setSessionCookie,
  verifySessionToken
};
