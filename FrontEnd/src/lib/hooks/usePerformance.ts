'use client';

import { useEffect, useRef, useCallback } from 'react';
import { analytics } from '@/lib/analytics';

interface PerformanceMetrics {
  // Core Web Vitals
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte
  
  // Custom metrics
  pageLoadTime?: number;
  domContentLoaded?: number;
  resourceCount?: number;
  totalTransferSize?: number;
}

interface UsePerformanceOptions {
  trackResources?: boolean;
  trackMemory?: boolean;
  reportThreshold?: number; // Only report if page load > this (ms)
}

export function usePerformance(options: UsePerformanceOptions = {}) {
  const { 
    trackResources = false, 
    trackMemory = false,
    reportThreshold = 0 
  } = options;
  
  const metricsRef = useRef<PerformanceMetrics>({});
  const reportedRef = useRef(false);

  const reportMetrics = useCallback(() => {
    if (reportedRef.current) return;
    
    const metrics = metricsRef.current;
    
    // Check threshold
    if (metrics.pageLoadTime && metrics.pageLoadTime < reportThreshold) {
      return;
    }
    
    analytics.track('performance_metrics', {
      ...metrics,
      url: window.location.pathname,
      timestamp: Date.now(),
    });
    
    reportedRef.current = true;
  }, [reportThreshold]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get navigation timing
    const getNavigationMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        metricsRef.current.pageLoadTime = navigation.loadEventEnd - navigation.startTime;
        metricsRef.current.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.startTime;
        metricsRef.current.TTFB = navigation.responseStart - navigation.requestStart;
      }
    };

    // Get resource metrics
    const getResourceMetrics = () => {
      if (!trackResources) return;
      
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      metricsRef.current.resourceCount = resources.length;
      metricsRef.current.totalTransferSize = resources.reduce(
        (total, resource) => total + (resource.transferSize || 0),
        0
      );
    };

    // Get memory metrics (Chrome only)
    const getMemoryMetrics = () => {
      if (!trackMemory) return;
      
      const memory = (performance as any).memory;
      if (memory) {
        metricsRef.current = {
          ...metricsRef.current,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          totalJSHeapSize: memory.totalJSHeapSize,
          usedJSHeapSize: memory.usedJSHeapSize,
        };
      }
    };

    // Wait for page to fully load
    if (document.readyState === 'complete') {
      getNavigationMetrics();
      getResourceMetrics();
      getMemoryMetrics();
      reportMetrics();
    } else {
      window.addEventListener('load', () => {
        // Delay to ensure all metrics are available
        setTimeout(() => {
          getNavigationMetrics();
          getResourceMetrics();
          getMemoryMetrics();
          reportMetrics();
        }, 100);
      });
    }

    // Observe LCP
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      metricsRef.current.LCP = lastEntry.startTime;
    });
    
    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // LCP not supported
    }

    // Observe FID
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const firstEntry = entries[0] as PerformanceEventTiming;
      metricsRef.current.FID = firstEntry.processingStart - firstEntry.startTime;
    });
    
    try {
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      // FID not supported
    }

    // Observe CLS
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          metricsRef.current.CLS = clsValue;
        }
      }
    });
    
    try {
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      // CLS not supported
    }

    // Observe FCP
    const fcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');
      if (fcpEntry) {
        metricsRef.current.FCP = fcpEntry.startTime;
      }
    });
    
    try {
      fcpObserver.observe({ type: 'paint', buffered: true });
    } catch (e) {
      // Paint timing not supported
    }

    // Report on page hide
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        reportMetrics();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
      fcpObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trackResources, trackMemory, reportMetrics]);

  return metricsRef.current;
}

export default usePerformance;
