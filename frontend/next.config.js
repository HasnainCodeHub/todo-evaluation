const isProd = process.env.NODE_ENV === 'production';

// In production, we need to ensure the critical env vars are set.
if (isProd) {
  console.log('--- VERCEL PRODUCTION BUILD CHECK ---');
  const requiredEnvs = [
    'NEXT_PUBLIC_API_URL',
    'BETTER_AUTH_SECRET',
    'DATABASE_URL',
  ];
  const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

  if (missingEnvs.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvs.join(', ')}`);
  }

  // Auth URL is special, it can be one of two
  if (!process.env.BETTER_AUTH_URL && !process.env.VERCEL_URL) {
    throw new Error('Missing required environment variable: BETTER_AUTH_URL or VERCEL_URL');
  }
  console.log('--- All required envs seem to be present ---');
}


console.log('[Build Env] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('[Build Env] BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL);
console.log('[Build Env] VERCEL_URL:', process.env.VERCEL_URL);
console.log('[Build Env] BETTER_AUTH_SECRET:', process.env.BETTER_AUTH_SECRET ? 'SET' : 'NOT SET');
console.log('[Build Env] DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');


/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
