'use client'

import { useEffect } from 'react'

/**
 * Some browsers/webviews expose partial Performance APIs.
 * Next.js runtime calls clearMarks/measure APIs during hydration.
 * Provide safe no-op fallbacks when unavailable.
 */
export default function PerformanceShim() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const perf = window.performance as Performance & Record<string, unknown>
    if (!perf) return

    if (typeof perf.clearMarks !== 'function') {
      ;(perf as unknown as { clearMarks: (markName?: string) => void }).clearMarks = () => {}
    }

    if (typeof perf.clearMeasures !== 'function') {
      ;(perf as unknown as { clearMeasures: (measureName?: string) => void }).clearMeasures = () => {}
    }

    if (typeof perf.mark !== 'function') {
      ;(perf as unknown as { mark: (markName: string) => void }).mark = () => {}
    }

    if (typeof perf.measure !== 'function') {
      ;(perf as unknown as { measure: (measureName: string, startMark?: string, endMark?: string) => void }).measure =
        () => {}
    }
  }, [])

  return null
}
