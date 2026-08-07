import { useEffect, useRef } from 'react'
import { useLocation } from '@tanstack/react-router'
import { logEvent } from 'firebase/analytics'
import { analytics } from '@/lib/firebase'

/**
 * Automatically tracks page views via Firebase Analytics on every route change.
 * Should be called once at the root of the app (e.g. in __root.tsx).
 */
export function usePageViewTracking() {
  const location = useLocation()
  // Track the previous pathname to avoid duplicate events on re-renders
  const prevPathname = useRef<string | null>(null)

  useEffect(() => {
    // Skip if analytics is not available (dev mode, no measurementId, SSR)
    if (!analytics) return

    const currentPath = location.pathname
    // Avoid duplicate tracking for the same path
    if (prevPathname.current === currentPath) return
    prevPathname.current = currentPath

    logEvent(analytics, 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: currentPath,
    })
  }, [location.pathname])
}
