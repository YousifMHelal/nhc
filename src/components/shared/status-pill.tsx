import { cn } from '@/lib/utils'
import type { PipelineStage, TicketStatus, CampaignStatus, ContractStatus, OpportunityStage } from '@/lib/types'

const STAGE_STYLES: Record<PipelineStage, string> = {
  New:            'bg-info-bg text-info',
  Contacted:      'bg-info-bg text-info',
  Qualified:      'bg-purple-bg text-purple',
  Proposal:       'bg-warning-bg text-warning',
  'Closed Won':   'bg-success-bg text-success',
  'Closed Lost':  'bg-error-bg text-danger',
}
const STAGE_LABELS_AR: Record<PipelineStage, string> = {
  New: 'جديد', Contacted: 'تم التواصل', Qualified: 'مؤهَّل',
  Proposal: 'عرض سعر', 'Closed Won': 'تعاقد', 'Closed Lost': 'خُسر',
}

const TICKET_STYLES: Record<TicketStatus, string> = {
  Open:          'bg-info-bg text-info',
  'In Progress': 'bg-warning-bg text-warning',
  Resolved:      'bg-success-bg text-success',
  Closed:        'bg-neutral-bg text-neutral',
}
const TICKET_LABELS_AR: Record<TicketStatus, string> = {
  Open: 'مفتوح', 'In Progress': 'قيد التنفيذ', Resolved: 'محلول', Closed: 'مغلق',
}

const CAMPAIGN_STYLES: Record<CampaignStatus, string> = {
  Draft:     'bg-neutral-bg text-neutral',
  Scheduled: 'bg-info-bg text-info',
  Active:    'bg-success-bg text-success',
  Paused:    'bg-warning-bg text-warning',
  Completed: 'bg-purple-bg text-purple',
}
const CAMPAIGN_LABELS_AR: Record<CampaignStatus, string> = {
  Draft: 'مسودة', Scheduled: 'مجدولة', Active: 'نشطة', Paused: 'متوقفة', Completed: 'مكتملة',
}

const CONTRACT_STYLES: Record<ContractStatus, string> = {
  Draft:     'bg-neutral-bg text-neutral',
  Signed:    'bg-info-bg text-info',
  Active:    'bg-success-bg text-success',
  Completed: 'bg-purple-bg text-purple',
  Cancelled: 'bg-error-bg text-danger',
}
const CONTRACT_LABELS_AR: Record<ContractStatus, string> = {
  Draft: 'مسودة', Signed: 'موقَّع', Active: 'نشط', Completed: 'مكتمل', Cancelled: 'ملغي',
}

const OPP_STYLES: Record<OpportunityStage, string> = {
  'تحديد الاهتمام': 'bg-info-bg text-info',
  'عرض الوحدة':     'bg-info-bg text-info',
  'مفاوضة السعر':   'bg-warning-bg text-warning',
  'طلب التمويل':    'bg-warning-bg text-warning',
  'إبرام العقد':    'bg-success-bg text-success',
  'مغلقة':          'bg-purple-bg text-purple',
}

interface StatusPillProps {
  type: 'stage' | 'ticket' | 'campaign' | 'contract' | 'opportunity'
  value: string
  className?: string
}

export function StatusPill({ type, value, className }: StatusPillProps) {
  let styles = 'bg-neutral-bg text-neutral'
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
  } else if (type === 'contract' && value in CONTRACT_STYLES) {
    styles = CONTRACT_STYLES[value as ContractStatus]
    label = CONTRACT_LABELS_AR[value as ContractStatus]
  } else if (type === 'opportunity') {
    styles = (OPP_STYLES as Record<string, string>)[value] ?? 'bg-neutral-bg text-neutral'
    label = value
  }

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', styles, className)}>
      {label}
    </span>
  )
}
