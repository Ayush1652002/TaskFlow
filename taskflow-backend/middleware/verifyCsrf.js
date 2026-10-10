const AppError = require('../utils/AppError');
const allowedOrigins = require('../config/origins');

// /auth/refresh and /auth/logout rely only on the httpOnly cookie, so they need
// CSRF protection. A request is accepted if EITHER:
//  1. the csrfToken cookie matches the x-csrf-token header (double-submit), or
//  2. the browser-set Origin header is one of our own frontends. Browsers always
//     send Origin on cross-site requests and a malicious page cannot fake it.
// Rule 2 matters because on Vercel + Render the frontend cannot read the API's
// cookie, so a new tab / restarted browser has no header to send and used to
// get a 403 here (= random logout).
const verifyCsrf = (req, res, next) => {
  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.headers['x-csrf-token'];

  if (cookieToken && headerToken && cookieToken === headerToken) return next();

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) return next();

  return next(new AppError('Invalid or missing CSRF token', 403));
};

module.exports = verifyCsrf;
