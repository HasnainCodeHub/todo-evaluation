const isProd = process.env.NODE_ENV === 'production';

// In production, we need to ensure the critical env vars are set.
// Note: NEXT_PUBLIC_API_URL is NOT required - we hardcode the production URL
// to prevent any localhost leakage. See lib/config.ts.
if (isProd) {
  console.log('--- VERCEL PRODUCTION BUILD CHECK ---');
  const requiredEnvs = [
    'BETTER_AUTH_SECRET',
    'DATABASE_URL',
  ];
  const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

  if (missingEnvs.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvs.join(', ')}`);
  }

  // Auth URL: VERCEL_URL is auto-set by Vercel, or use explicit BETTER_AUTH_URL
  if (!process.env.BETTER_AUTH_URL && !process.env.VERCEL_URL) {
    throw new Error('Missing required environment variable: BETTER_AUTH_URL or VERCEL_URL');
  }
  console.log('--- All required envs present ---');
}


console.log('[Build Env] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || '(not set - using hardcoded production URL)');
console.log('[Build Env] BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL || '(will use VERCEL_URL)');
console.log('[Build Env] VERCEL_URL:', process.env.VERCEL_URL);
console.log('[Build Env] BETTER_AUTH_SECRET:', process.env.BETTER_AUTH_SECRET ? 'SET' : 'NOT SET');
console.log('[Build Env] DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');


/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
