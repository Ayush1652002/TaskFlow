const AppError = require('../utils/AppError');

// Translate known non-operational errors (Mongoose, JWT) into an AppError
// so the rest of this handler only has one shape to deal with.
const normalizeError = (err) => {
  // Invalid ObjectId in a route param, e.g. GET /tasks/:workspaceId/not-an-id
  if (err.name === 'CastError') {
    return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  // Mongoose schema validation failure (required fields, enum mismatch, etc.)
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    return new AppError(message, 400);
  }

  // Duplicate key (unique index), e.g. registering an email that already exists
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return new AppError(`${field} already exists`, 409);
  }

  // Malformed or expired JWT that slipped past a manual jwt.verify callback
  if (err.name === 'JsonWebTokenError') {
    return new AppError('Invalid token', 403);
  }
  if (err.name === 'TokenExpiredError') {
    return new AppError('Token expired', 403);
  }

  return err;
};

const errorHandler = (err, req, res, next) => {
  const error = normalizeError(err);

  const statusCode = error.isOperational
    ? error.statusCode
    : (err.statusCode && err.statusCode >= 400 ? err.statusCode : 500);

  const message = error.isOperational || statusCode < 500
    ? error.message
    : 'Internal Server Error';

  // Always log the real error server-side; only expose details to the client
  // for known/operational errors, never leak internals on unexpected 500s.
  if (statusCode >= 500) {
    console.error(err.stack || err);
  } else if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack || err);
  }

  res.status(statusCode).json({ message });
};

module.exports = errorHandler;
