"use client";

import { useEffect } from 'react';

export default function PerformanceMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Monitor page load performance
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            console.log('🚀 Page Load Performance:', {
              'DOM Content Loaded': `${entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart}ms`,
              'Load Complete': `${entry.loadEventEnd - entry.loadEventStart}ms`,
              'Total Load Time': `${entry.loadEventEnd - entry.navigationStart}ms`,
            });
          }
        }
      });
      
      observer.observe({ entryTypes: ['navigation'] });
      
      return () => observer.disconnect();
    }
  }, []);

  return null;
}
