'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analytics } from '@/lib/analytics';
import { errorTracking } from '@/lib/error-tracking';
import config from '@/lib/config';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize error tracking
  useEffect(() => {
    if (config.errorTracking.enabled) {
      errorTracking.init({
        release: config.appVersion,
        tags: {
          app: config.appName,
          environment: config.environment,
        },
      });
    }
  }, []);

  // Track page views
  useEffect(() => {
    if (!config.analytics.enabled) return;

    const queryParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    analytics.pageView({
      path: pathname,
      queryParams,
    });

    // Add breadcrumb for navigation
    errorTracking.addBreadcrumb({
      type: 'navigation',
      category: 'route',
      message: `Navigated to ${pathname}`,
      data: { queryParams },
    });
  }, [pathname, searchParams]);

  // Track web vitals
  useEffect(() => {
    if (typeof window === 'undefined' || !config.analytics.enabled) return;

    // Report Web Vitals
    const reportWebVitals = async () => {
      try {
        const { onCLS, onFID, onFCP, onLCP, onTTFB } = await import('web-vitals');
        
        const sendToAnalytics = (metric: any) => {
          analytics.track('web_vital', {
            name: metric.name,
            value: metric.value,
            rating: metric.rating,
            delta: metric.delta,
            id: metric.id,
          });
        };

        onCLS(sendToAnalytics);
        onFID(sendToAnalytics);
        onFCP(sendToAnalytics);
        onLCP(sendToAnalytics);
        onTTFB(sendToAnalytics);
      } catch (e) {
        // web-vitals not available
      }
    };

    reportWebVitals();
  }, []);

  // Flush analytics on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      analytics.flush();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return <>{children}</>;
}

export default AnalyticsProvider;
