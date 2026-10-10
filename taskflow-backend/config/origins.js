// One list of browser origins allowed to talk to this API.
// Used by CORS (app.js) and by the CSRF check (middleware/verifyCsrf.js).
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

module.exports = allowedOrigins;
