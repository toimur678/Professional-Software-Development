/**
 * Environment Configuration for EcoWisely
 * Centralized access to environment variables with type safety and defaults
 */

type Environment = 'development' | 'production' | 'test';

interface Config {
  // App
  appName: string;
  appVersion: string;
  appUrl: string;
  environment: Environment;
  isDevelopment: boolean;
  isProduction: boolean;
  
  // API
  apiUrl: string;
  
  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // Analytics
  analytics: {
    enabled: boolean;
    posthogApiKey: string | null;
    posthogHost: string;
    mixpanelToken: string | null;
    gaMeasurementId: string | null;
  };
  
  // Error Tracking
  errorTracking: {
    enabled: boolean;
    sentryDsn: string | null;
  };
  
  // Features
  features: {
    socialFeatures: boolean;
    challenges: boolean;
  };
}

function getEnvVar(key: string, defaultValue: string = ''): string {
  if (typeof window === 'undefined') {
    // Server-side
    return process.env[key] || defaultValue;
  }
  // Client-side (only NEXT_PUBLIC_ vars are available)
  return (window as any).__ENV__?.[key] || process.env[key] || defaultValue;
}

function getBoolEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(key);
  if (value === '') return defaultValue;
  return value === 'true' || value === '1';
}

function getEnvironment(): Environment {
  const env = process.env.NODE_ENV;
  if (env === 'production') return 'production';
  if (env === 'test') return 'test';
  return 'development';
}

export const config: Config = {
  // App
  appName: getEnvVar('NEXT_PUBLIC_APP_NAME', 'EcoWisely'),
  appVersion: getEnvVar('NEXT_PUBLIC_APP_VERSION', '0.1.0'),
  appUrl: getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  environment: getEnvironment(),
  isDevelopment: getEnvironment() === 'development',
  isProduction: getEnvironment() === 'production',
  
  // API
  apiUrl: getEnvVar('NEXT_PUBLIC_API_URL', 'http://127.0.0.1:8000'),
  
  // Supabase
  supabaseUrl: getEnvVar('NEXT_PUBLIC_SUPABASE_URL', ''),
  supabaseAnonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', ''),
  
  // Analytics
  analytics: {
    enabled: getBoolEnvVar('NEXT_PUBLIC_ENABLE_ANALYTICS', false),
    posthogApiKey: getEnvVar('NEXT_PUBLIC_POSTHOG_API_KEY') || null,
    posthogHost: getEnvVar('NEXT_PUBLIC_POSTHOG_HOST', 'https://app.posthog.com'),
    mixpanelToken: getEnvVar('NEXT_PUBLIC_MIXPANEL_TOKEN') || null,
    gaMeasurementId: getEnvVar('NEXT_PUBLIC_GA_MEASUREMENT_ID') || null,
  },
  
  // Error Tracking
  errorTracking: {
    enabled: getBoolEnvVar('NEXT_PUBLIC_ENABLE_ERROR_TRACKING', false),
    sentryDsn: getEnvVar('NEXT_PUBLIC_SENTRY_DSN') || null,
  },
  
  // Features
  features: {
    socialFeatures: getBoolEnvVar('NEXT_PUBLIC_ENABLE_SOCIAL_FEATURES', true),
    challenges: getBoolEnvVar('NEXT_PUBLIC_ENABLE_CHALLENGES', true),
  },
};

// Validation function to check required config at startup
export function validateConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!config.supabaseUrl) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  
  if (!config.supabaseAnonKey) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

export default config;
