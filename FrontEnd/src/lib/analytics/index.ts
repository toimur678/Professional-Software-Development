/**
 * Analytics Service for EcoWisely
 * Provides event tracking, page views, and user action logging
 * Supports multiple analytics providers (PostHog, Mixpanel, Google Analytics)
 */

type AnalyticsEvent = {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
};

type PageViewEvent = {
  path: string;
  title?: string;
  referrer?: string;
  queryParams?: Record<string, string>;
};

type UserProperties = {
  userId: string;
  email?: string;
  name?: string;
  createdAt?: string;
  plan?: string;
  [key: string]: any;
};

// Environment check
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Analytics providers configuration
const POSTHOG_API_KEY = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;
const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Session management
let sessionId: string | null = null;
let userId: string | null = null;

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  
  if (!sessionId) {
    sessionId = sessionStorage.getItem('eco_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('eco_session_id', sessionId);
    }
  }
  return sessionId;
}

function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return { platform: 'server', userAgent: '', screenSize: '' };
  }
  
  return {
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

// Event queue for batching
const eventQueue: AnalyticsEvent[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

function flushEventQueue() {
  if (eventQueue.length === 0) return;
  
  const events = [...eventQueue];
  eventQueue.length = 0;
  
  // Send to backend analytics endpoint
  if (isProduction) {
    fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    }).catch((err) => {
      console.error('Failed to send analytics events:', err);
    });
  }
  
  // Log in development
  if (isDevelopment) {
    console.log('📊 Analytics Events:', events);
  }
}

function queueEvent(event: AnalyticsEvent) {
  eventQueue.push({
    ...event,
    timestamp: Date.now(),
    sessionId: getSessionId(),
    userId: userId || undefined,
  });
  
  // Flush after 5 seconds or when queue reaches 10 events
  if (eventQueue.length >= 10) {
    flushEventQueue();
  } else if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      flushEventQueue();
      flushTimeout = null;
    }, 5000);
  }
}

// Public API
export const analytics = {
  /**
   * Initialize analytics with user identification
   */
  identify(user: UserProperties) {
    userId = user.userId;
    
    queueEvent({
      name: '$identify',
      properties: {
        ...user,
        ...getDeviceInfo(),
      },
    });
    
    // Set user properties for third-party providers
    if (typeof window !== 'undefined') {
      // PostHog
      if ((window as any).posthog) {
        (window as any).posthog.identify(user.userId, user);
      }
      
      // Mixpanel
      if ((window as any).mixpanel) {
        (window as any).mixpanel.identify(user.userId);
        (window as any).mixpanel.people.set(user);
      }
      
      // Google Analytics
      if ((window as any).gtag) {
        (window as any).gtag('set', { user_id: user.userId });
      }
    }
  },

  /**
   * Track a page view
   */
  pageView(page: PageViewEvent) {
    queueEvent({
      name: '$pageview',
      properties: {
        path: page.path,
        title: page.title || (typeof document !== 'undefined' ? document.title : ''),
        referrer: page.referrer || (typeof document !== 'undefined' ? document.referrer : ''),
        queryParams: page.queryParams,
        url: typeof window !== 'undefined' ? window.location.href : '',
        ...getDeviceInfo(),
      },
    });
    
    // Send to third-party providers
    if (typeof window !== 'undefined') {
      if ((window as any).posthog) {
        (window as any).posthog.capture('$pageview');
      }
      if ((window as any).gtag && GA_MEASUREMENT_ID) {
        (window as any).gtag('config', GA_MEASUREMENT_ID, { page_path: page.path });
      }
    }
  },

  /**
   * Track a custom event
   */
  track(eventName: string, properties?: Record<string, any>) {
    queueEvent({
      name: eventName,
      properties: {
        ...properties,
        ...getDeviceInfo(),
      },
    });
    
    // Send to third-party providers
    if (typeof window !== 'undefined') {
      if ((window as any).posthog) {
        (window as any).posthog.capture(eventName, properties);
      }
      if ((window as any).mixpanel) {
        (window as any).mixpanel.track(eventName, properties);
      }
      if ((window as any).gtag) {
        (window as any).gtag('event', eventName, properties);
      }
    }
  },

  /**
   * Track carbon footprint related events
   */
  trackEmission(category: string, amount: number, details?: Record<string, any>) {
    this.track('emission_logged', {
      category,
      amount_kg: amount,
      ...details,
    });
  },

  /**
   * Track recommendation interactions
   */
  trackRecommendation(action: 'viewed' | 'clicked' | 'completed', recommendationId: string, details?: Record<string, any>) {
    this.track(`recommendation_${action}`, {
      recommendation_id: recommendationId,
      ...details,
    });
  },

  /**
   * Track challenge interactions
   */
  trackChallenge(action: 'joined' | 'completed' | 'left', challengeId: string, details?: Record<string, any>) {
    this.track(`challenge_${action}`, {
      challenge_id: challengeId,
      ...details,
    });
  },

  /**
   * Track achievement unlocks
   */
  trackAchievement(achievementId: string, achievementName: string, points: number) {
    this.track('achievement_unlocked', {
      achievement_id: achievementId,
      achievement_name: achievementName,
      points,
    });
  },

  /**
   * Track social interactions
   */
  trackSocial(action: 'friend_added' | 'team_joined' | 'team_created' | 'invite_sent', details?: Record<string, any>) {
    this.track(`social_${action}`, details);
  },

  /**
   * Reset analytics (on logout)
   */
  reset() {
    userId = null;
    sessionId = null;
    
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('eco_session_id');
      
      if ((window as any).posthog) {
        (window as any).posthog.reset();
      }
      if ((window as any).mixpanel) {
        (window as any).mixpanel.reset();
      }
    }
  },

  /**
   * Force flush all queued events
   */
  flush() {
    flushEventQueue();
  },
};

export default analytics;
