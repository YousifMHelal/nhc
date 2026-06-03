import type { KpiData, FunnelStage, ChannelPerformance } from '@/lib/types'

export const KPI_DATA: KpiData = {
  totalLeads: 347,
  totalLeadsGrowth: 23.6,
  conversionRate: 14.8,
  conversionRateGrowth: 3.2,
  openOpportunities: 39,
  openOpportunitiesValue: 112_400_000,
  campaignPerformance: 78,
  campaignPerformanceGrowth: 8.3,
  revenueThisMonth: 24_800_000,
  revenueGrowth: 31.5,
}

export const FUNNEL_STAGES: FunnelStage[] = [
  { stage: 'New',         nameAr: 'جديد',        count: 98, value: 0,            conversionRate: 100,  color: 'var(--color-accent-pipeline)' },
  { stage: 'Contacted',  nameAr: 'تم التواصل',   count: 74, value: 0,            conversionRate: 75.5, color: '#22C55E' },
  { stage: 'Qualified',  nameAr: 'مؤهَّل',       count: 52, value: 0,            conversionRate: 70.3, color: '#16A34A' },
  { stage: 'Proposal',   nameAr: 'عرض سعر',      count: 31, value: 98_600_000,   conversionRate: 59.6, color: '#15803D' },
  { stage: 'Closed Won', nameAr: 'مغلق - ربح',   count: 42, value: 168_300_000,  conversionRate: 24.1, color: '#166534' },
]

export const CHANNEL_PERFORMANCE: ChannelPerformance[] = [
  { channel: 'WhatsApp', leads: 112, conversions: 28, conversionRate: 25.0, revenue: 68_400_000 },
  { channel: 'Web',      leads: 86,  conversions: 14, conversionRate: 16.3, revenue: 42_100_000 },
  { channel: 'Referral', leads: 54,  conversions: 22, conversionRate: 40.7, revenue: 79_200_000 },
  { channel: 'Social',   leads: 61,  conversions: 9,  conversionRate: 14.8, revenue: 24_600_000 },
  { channel: 'SMS',      leads: 43,  conversions: 5,  conversionRate: 11.6, revenue: 13_900_000 },
  { channel: 'Email',    leads: 37,  conversions: 8,  conversionRate: 21.6, revenue: 29_300_000 },
]

// Monthly revenue trend — last 12 months
export const REVENUE_TREND = [
  { monthAr: 'يول ٢٥', revenue:  8_200_000, leads: 24 },
  { monthAr: 'أغس ٢٥', revenue:  9_600_000, leads: 28 },
  { monthAr: 'سبت ٢٥', revenue: 11_400_000, leads: 33 },
  { monthAr: 'أكت ٢٥', revenue: 10_800_000, leads: 30 },
  { monthAr: 'نوف ٢٥', revenue: 13_200_000, leads: 37 },
  { monthAr: 'ديس ٢٥', revenue: 15_600_000, leads: 44 },
  { monthAr: 'يناير',   revenue: 14_400_000, leads: 40 },
  { monthAr: 'فبراير',  revenue: 17_800_000, leads: 49 },
  { monthAr: 'مارس',    revenue: 16_200_000, leads: 46 },
  { monthAr: 'أبريل',   revenue: 21_600_000, leads: 61 },
  { monthAr: 'مايو',    revenue: 19_900_000, leads: 56 },
  { monthAr: 'يونيو',   revenue: 24_800_000, leads: 68 },
]

export const SPRINT_INFO = {
  sprintNumber: 14,
  sprintNameAr: 'سبرينت ١٤ — تحسين تجربة المستخدم',
  startDate: '2026-05-26T00:00:00Z',
  endDate: '2026-06-09T00:00:00Z',
  daysRemaining: 6,
  totalTasks: 24,
  completedTasks: 17,
  progressPercent: 71,
}
