/**
 * Error Tracking Service for EcoWisely
 * Provides error capturing, reporting, and monitoring
 * Compatible with Sentry-like error tracking services
 */

type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

type ErrorContext = {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
  level?: ErrorSeverity;
  fingerprint?: string[];
};

type BreadcrumbType = 'navigation' | 'http' | 'user' | 'error' | 'info';

type Breadcrumb = {
  type: BreadcrumbType;
  category: string;
  message: string;
  data?: Record<string, any>;
  timestamp: number;
  level?: ErrorSeverity;
};

// Configuration
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// State
const breadcrumbs: Breadcrumb[] = [];
const MAX_BREADCRUMBS = 50;
let userContext: ErrorContext['user'] | null = null;
let globalTags: Record<string, string> = {};

// Error stack for deduplication
const recentErrors = new Set<string>();
const DEDUPE_WINDOW_MS = 5000;

function getErrorFingerprint(error: Error): string {
  return `${error.name}:${error.message}:${error.stack?.split('\n')[1] || ''}`;
}

function shouldReportError(error: Error): boolean {
  const fingerprint = getErrorFingerprint(error);
  
  if (recentErrors.has(fingerprint)) {
    return false;
  }
  
  recentErrors.add(fingerprint);
  setTimeout(() => recentErrors.delete(fingerprint), DEDUPE_WINDOW_MS);
  
  return true;
}

function getEnvironmentContext() {
  const context: Record<string, any> = {
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
  };
  
  if (typeof window !== 'undefined') {
    context.url = window.location.href;
    context.userAgent = navigator.userAgent;
    context.screenSize = `${window.screen.width}x${window.screen.height}`;
    context.viewportSize = `${window.innerWidth}x${window.innerHeight}`;
    context.language = navigator.language;
    context.platform = navigator.platform;
    context.online = navigator.onLine;
  }
  
  return context;
}

function formatStackTrace(error: Error): string[] {
  if (!error.stack) return [];
  
  return error.stack
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

async function sendErrorToBackend(errorData: Record<string, any>) {
  if (!isProduction) return;
  
  try {
    await fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
    });
  } catch (err) {
    console.error('Failed to send error to backend:', err);
  }
}

// Public API
export const errorTracking = {
  /**
   * Initialize error tracking with global configuration
   */
  init(config?: { tags?: Record<string, string>; release?: string }) {
    globalTags = config?.tags || {};
    
    // Set up global error handlers
    if (typeof window !== 'undefined') {
      window.onerror = (message, source, lineno, colno, error) => {
        this.captureError(error || new Error(String(message)), {
          extra: { source, lineno, colno },
        });
      };
      
      window.onunhandledrejection = (event) => {
        this.captureError(
          event.reason instanceof Error
            ? event.reason
            : new Error(String(event.reason)),
          { tags: { type: 'unhandled_promise_rejection' } }
        );
      };
    }
    
    // Initialize Sentry if available
    if (SENTRY_DSN && typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.init({
        dsn: SENTRY_DSN,
        release: config?.release,
        environment: process.env.NODE_ENV,
      });
    }
  },

  /**
   * Set the current user context
   */
  setUser(user: ErrorContext['user'] | null) {
    userContext = user;
    
    if ((window as any)?.Sentry) {
      (window as any).Sentry.setUser(user);
    }
  },

  /**
   * Add a global tag
   */
  setTag(key: string, value: string) {
    globalTags[key] = value;
    
    if ((window as any)?.Sentry) {
      (window as any).Sentry.setTag(key, value);
    }
  },

  /**
   * Add a breadcrumb for debugging context
   */
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>) {
    const crumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: Date.now(),
    };
    
    breadcrumbs.push(crumb);
    
    // Keep only the last MAX_BREADCRUMBS
    if (breadcrumbs.length > MAX_BREADCRUMBS) {
      breadcrumbs.shift();
    }
    
    if ((window as any)?.Sentry) {
      (window as any).Sentry.addBreadcrumb(crumb);
    }
  },

  /**
   * Capture and report an error
   */
  captureError(error: Error, context?: ErrorContext) {
    if (!shouldReportError(error)) {
      return;
    }
    
    const errorData = {
      name: error.name,
      message: error.message,
      stack: formatStackTrace(error),
      level: context?.level || 'error',
      timestamp: new Date().toISOString(),
      environment: getEnvironmentContext(),
      breadcrumbs: [...breadcrumbs],
      tags: { ...globalTags, ...context?.tags },
      extra: context?.extra,
      user: userContext || context?.user,
      fingerprint: context?.fingerprint || [getErrorFingerprint(error)],
    };
    
    // Log in development
    if (isDevelopment) {
      console.group('🚨 Error Captured');
      console.error(error);
      console.log('Context:', errorData);
      console.groupEnd();
    }
    
    // Send to backend
    sendErrorToBackend(errorData);
    
    // Send to Sentry
    if ((window as any)?.Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: context?.tags,
        extra: context?.extra,
        level: context?.level,
        fingerprint: context?.fingerprint,
      });
    }
    
    return errorData;
  },

  /**
   * Capture a message (non-error event)
   */
  captureMessage(message: string, level: ErrorSeverity = 'info', context?: Omit<ErrorContext, 'level'>) {
    const messageData = {
      message,
      level,
      timestamp: new Date().toISOString(),
      environment: getEnvironmentContext(),
      breadcrumbs: [...breadcrumbs],
      tags: { ...globalTags, ...context?.tags },
      extra: context?.extra,
      user: userContext || context?.user,
    };
    
    if (isDevelopment) {
      console.log(`📝 Message [${level}]:`, message, messageData);
    }
    
    sendErrorToBackend(messageData);
    
    if ((window as any)?.Sentry) {
      (window as any).Sentry.captureMessage(message, level);
    }
  },

  /**
   * Wrap a function with error tracking
   */
  withErrorBoundary<T extends (...args: any[]) => any>(
    fn: T,
    context?: ErrorContext
  ): T {
    return ((...args: Parameters<T>) => {
      try {
        const result = fn(...args);
        
        // Handle async functions
        if (result instanceof Promise) {
          return result.catch((error) => {
            this.captureError(error, context);
            throw error;
          });
        }
        
        return result;
      } catch (error) {
        this.captureError(error as Error, context);
        throw error;
      }
    }) as T;
  },

  /**
   * Clear all breadcrumbs
   */
  clearBreadcrumbs() {
    breadcrumbs.length = 0;
  },

  /**
   * Get current breadcrumbs (for debugging)
   */
  getBreadcrumbs(): Breadcrumb[] {
    return [...breadcrumbs];
  },
};

export default errorTracking;
