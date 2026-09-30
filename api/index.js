/**
 * Vercel serverless entry point.
 *
 * Every request to /api/* (and /uploads/*) is rewritten here by vercel.json.
 * The Express app is built to backend/dist during `npm run build`, so this
 * file only has to hand the request to it. Express keeps the original URL,
 * so routes like /api/properties work unchanged.
 */
const app = require('../backend/dist/app').default;

module.exports = app;
