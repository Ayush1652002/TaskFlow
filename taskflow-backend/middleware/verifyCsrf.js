const AppError = require('../utils/AppError');

// This app authenticates most routes with a Bearer token in the
// Authorization header, which browsers never attach automatically —
// so CSRF isn't a risk there (an attacker's page can't forge that header).
// The two routes that rely purely on the httpOnly cookie (/auth/refresh,
// /auth/logout) ARE at risk, so we protect just those with a classic
// double-submit cookie: a second, readable cookie whose value must match
// a custom header the frontend sends. A cross-site attacker can trigger
// the cookie to be sent, but can't read or set that header themselves.
const verifyCsrf = (req, res, next) => {
  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new AppError('Invalid or missing CSRF token', 403));
  }

  next();
};

module.exports = verifyCsrf;
