'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-danger/10">
        <AlertTriangle className="size-8 text-danger" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">حدث خطأ غير متوقع</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          {error.message || 'يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني'}
        </p>
      </div>
      <Button
        onClick={reset}
        className="bg-brand hover:bg-brand/90 text-white gap-2"
      >
        <RefreshCw className="size-4" />
        إعادة المحاولة
      </Button>
    </div>
  )
}
