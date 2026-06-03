import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center p-6">
      <div>
        <p className="text-8xl font-black text-brand opacity-20">٤٠٤</p>
        <h2 className="mt-2 text-2xl font-bold text-foreground">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الرابط الذي تبحث عنه غير موجود أو تم نقله
        </p>
      </div>
      <Link href="/dashboard">
        <Button className="bg-brand hover:bg-brand/90 text-white gap-2">
          <Home className="size-4" />
          العودة للرئيسية
        </Button>
      </Link>
    </div>
  )
}
