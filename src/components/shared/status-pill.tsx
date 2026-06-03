import { cn } from '@/lib/utils'
import type { PipelineStage, TicketStatus, CampaignStatus } from '@/lib/types'

const STAGE_STYLES: Record<PipelineStage, string> = {
  New: 'bg-sky-100 text-sky-700',
  Contacted: 'bg-blue-100 text-blue-700',
  Qualified: 'bg-violet-100 text-violet-700',
  Proposal: 'bg-amber-100 text-amber-700',
  'Closed Won': 'bg-emerald-100 text-emerald-700',
  'Closed Lost': 'bg-red-100 text-red-700',
}

const STAGE_LABELS_AR: Record<PipelineStage, string> = {
  New: 'عميل محتمل',
  Contacted: 'تأهيل',
  Qualified: 'مؤهَّل',
  Proposal: 'عرض سعر',
  'Closed Won': 'تعاقد',
  'Closed Lost': 'خُسر',
}

const TICKET_STYLES: Record<TicketStatus, string> = {
  Open: 'bg-sky-100 text-sky-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  Resolved: 'bg-emerald-100 text-emerald-700',
  Closed: 'bg-slate-100 text-slate-600',
}

const TICKET_LABELS_AR: Record<TicketStatus, string> = {
  Open: 'مفتوح',
  'In Progress': 'قيد التنفيذ',
  Resolved: 'محلول',
  Closed: 'مغلق',
}

const CAMPAIGN_STYLES: Record<CampaignStatus, string> = {
  Draft: 'bg-slate-100 text-slate-600',
  Scheduled: 'bg-blue-100 text-blue-700',
  Active: 'bg-emerald-100 text-emerald-700',
  Paused: 'bg-amber-100 text-amber-700',
  Completed: 'bg-violet-100 text-violet-700',
}

const CAMPAIGN_LABELS_AR: Record<CampaignStatus, string> = {
  Draft: 'مسودة',
  Scheduled: 'مجدولة',
  Active: 'نشطة',
  Paused: 'متوقفة',
  Completed: 'مكتملة',
}

interface StatusPillProps {
  type: 'stage' | 'ticket' | 'campaign'
  value: string
  className?: string
}

export function StatusPill({ type, value, className }: StatusPillProps) {
  let styles = ''
  let label = value

  if (type === 'stage' && value in STAGE_STYLES) {
    styles = STAGE_STYLES[value as PipelineStage]
    label = STAGE_LABELS_AR[value as PipelineStage]
  } else if (type === 'ticket' && value in TICKET_STYLES) {
    styles = TICKET_STYLES[value as TicketStatus]
    label = TICKET_LABELS_AR[value as TicketStatus]
  } else if (type === 'campaign' && value in CAMPAIGN_STYLES) {
    styles = CAMPAIGN_STYLES[value as CampaignStatus]
    label = CAMPAIGN_LABELS_AR[value as CampaignStatus]
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles,
        className
      )}
    >
      {label}
    </span>
  )
}
