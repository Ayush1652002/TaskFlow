const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Helmet blocks cross-origin resource loading by default, which would break
// downloading/previewing attachment files from the frontend's origin.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
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
app.use('/auth/verify-otp', otpLimiter);
app.use('/auth/resend-otp', otpLimiter);

app.use('/auth', require('./routes/authRoutes'));
app.use('/workspaces', require('./routes/workspaceRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/tasks', require('./routes/taskRoutes'));
app.use('/activity', require('./routes/activityRoutes'));
app.use('/notifications', require('./routes/notificationRoutes'));

// Serves uploaded attachment files directly by filename, e.g. GET /uploads/abc123.pdf
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => res.send('TaskFlow API Running'));

app.use(errorHandler);

module.exports = app;
