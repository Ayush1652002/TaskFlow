const jwt = require('jsonwebtoken');

// 401 = "you are not properly logged in" (missing, malformed or expired token).
// The frontend uses 401 as the signal to refresh the access token.
// 403 is kept for "logged in, but not allowed" (role checks).
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
// changed
  const token = authHeader.slice('Bearer '.length).trim();

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
};

module.exports = verifyJWT;
