export const environment = {
  production: true,
  // Relative path: the API is served from the same domain as the app
  // (Vercel rewrites /api/* to the serverless function). This works for any
  // domain — sasta-roomrent.vercel.app today, a custom domain tomorrow —
  // without rebuilding.
  apiUrl: '/api',
};
