// Which browser origins may talk to this API (CORS + CSRF check + Google login redirect).
//  1. localhost for development
//  2. FRONTEND_URL (the production frontend)
//  3. Vercel preview URLs of THIS project. They change on every deployment, so
//     they are matched with a pattern. Override it with PREVIEW_ORIGIN_REGEX.
const fixed = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean).map((u) => u.replace(/\/$/, ''));

const previewPattern = new RegExp(
  process.env.PREVIEW_ORIGIN_REGEX || '^https://task-flow-[a-z0-9-]+-ayushsahares-projects\\.vercel\\.app$'
);

const isAllowedOrigin = (origin) =>
  typeof origin === 'string' && (fixed.includes(origin) || previewPattern.test(origin));

module.exports = { isAllowedOrigin };
