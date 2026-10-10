const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
// changed
const app = express();

// The app runs behind a proxy (Render, Nginx...). Without this, Express sees the
// PROXY's IP for every visitor, so the login rate limit would be shared by the
// whole website. 1 = trust one proxy hop. Override with TRUST_PROXY if needed.
app.set('trust proxy', parseInt(process.env.TRUST_PROXY, 10) || 1);

// Helmet blocks cross-origin resource loading by default, which would break
// downloading/previewing attachment files from the frontend's origin.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const { isAllowedOrigin } = require('./config/origins');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new AppError('Not allowed by CORS', 403)); // 403, not a 500
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 10,
  skip: () => process.env.NODE_ENV === 'test',
  message: { message: 'Too many attempts, please try again later' },
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  skip: () => process.env.NODE_ENV === 'test',
  message: { message: 'Too many attempts, please try again later' },
});

app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);
app.use('/auth/guest', authLimiter);
app.use('/auth/google/exchange', authLimiter);
app.use('/auth/verify-otp', otpLimiter);
app.use('/auth/resend-otp', otpLimiter);

app.use('/auth', require('./routes/authRoutes'));
app.use('/workspaces', require('./routes/workspaceRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/tasks', require('./routes/taskRoutes'));
app.use('/activity', require('./routes/activityRoutes'));
app.use('/notifications', require('./routes/notificationRoutes'));
app.use('/analytics', require('./routes/analyticsRoutes'));

// NOTE: uploaded files are NOT served as public static files any more.
// They are downloaded through GET /tasks/:workspaceId/:taskId/attachments/:attachmentId,
// which checks login + workspace membership first.

app.get('/', (req, res) => res.send('TaskFlow API Running'));

// Used by the host (Render/Docker) to check that the server is alive.
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

module.exports = app;
