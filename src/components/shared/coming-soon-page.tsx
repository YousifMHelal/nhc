import { Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { AR } from '@/constants/ar'
import { cn } from '@/lib/utils'

interface ComingSoonPageProps {
  sectionNameAr: string
  accentClass: string
}

export function ComingSoonPage({ sectionNameAr, accentClass }: ComingSoonPageProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <Card className="w-full max-w-sm text-center">
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <Clock className={cn('size-10', accentClass)} strokeWidth={1.5} />
          <h2 className={cn('text-xl font-bold', accentClass)}>{sectionNameAr}</h2>
          <p className="text-muted-foreground">{AR.comingSoon}</p>
        </CardContent>
      </Card>
    </div>
  )
}
