import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { BRAND_NAME } from '@/constants/ar'

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-3">
      <Avatar className="size-9">
        <AvatarFallback className="bg-[#1B6CA8]/10 text-[#1B6CA8] font-semibold">
          م
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-semibold text-muted-foreground tracking-wide">
        {BRAND_NAME}
      </span>
    </header>
  )
}
