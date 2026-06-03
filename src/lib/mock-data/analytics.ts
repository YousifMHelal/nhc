import type { KpiData, FunnelStage, ChannelPerformance } from '@/lib/types'

export const KPI_DATA: KpiData = {
  totalLeads: 240,
  totalLeadsGrowth: 18.4,
  conversionRate: 12.5,
  conversionRateGrowth: 2.1,
  openOpportunities: 28,
  openOpportunitiesValue: 74_200_000,
  campaignPerformance: 73,
  campaignPerformanceGrowth: 5.8,
  revenueThisMonth: 18_600_000,
  revenueGrowth: 22.3,
}

// Dashboard funnel — aggregate across all active leads
export const FUNNEL_STAGES: FunnelStage[] = [
  {
    stage: 'New',
    nameAr: 'جديد',
    count: 68,
    value: 0,
    conversionRate: 100,
    color: 'var(--color-accent-pipeline)',
  },
  {
    stage: 'Contacted',
    nameAr: 'تم التواصل',
    count: 54,
    value: 0,
    conversionRate: 79.4,
    color: '#22C55E',
  },
  {
    stage: 'Qualified',
    nameAr: 'مؤهَّل',
    count: 38,
    value: 0,
    conversionRate: 70.4,
    color: '#16A34A',
  },
  {
    stage: 'Proposal',
    nameAr: 'عرض سعر',
    count: 22,
    value: 78_400_000,
    conversionRate: 57.9,
    color: '#15803D',
  },
  {
    stage: 'Closed Won',
    nameAr: 'مغلق - ربح',
    count: 30,
    value: 121_500_000,
    conversionRate: 22.5,
    color: '#166534',
  },
]

export const CHANNEL_PERFORMANCE: ChannelPerformance[] = [
  {
    channel: 'WhatsApp',
    leads: 82,
    conversions: 18,
    conversionRate: 22.0,
    revenue: 48_600_000,
  },
  {
    channel: 'Web',
    leads: 64,
    conversions: 11,
    conversionRate: 17.2,
    revenue: 31_200_000,
  },
  {
    channel: 'Referral',
    leads: 38,
    conversions: 14,
    conversionRate: 36.8,
    revenue: 52_400_000,
  },
  {
    channel: 'Social',
    leads: 45,
    conversions: 7,
    conversionRate: 15.6,
    revenue: 18_900_000,
  },
  {
    channel: 'SMS',
    leads: 31,
    conversions: 4,
    conversionRate: 12.9,
    revenue: 10_800_000,
  },
  {
    channel: 'Email',
    leads: 28,
    conversions: 6,
    conversionRate: 21.4,
    revenue: 22_100_000,
  },
]

// Monthly revenue trend (last 6 months)
export const REVENUE_TREND = [
  { monthAr: 'يناير', revenue: 12_400_000, leads: 38 },
  { monthAr: 'فبراير', revenue: 15_800_000, leads: 45 },
  { monthAr: 'مارس', revenue: 14_200_000, leads: 41 },
  { monthAr: 'أبريل', revenue: 19_600_000, leads: 58 },
  { monthAr: 'مايو', revenue: 16_900_000, leads: 52 },
  { monthAr: 'يونيو', revenue: 18_600_000, leads: 47 },
]

// Sprint info for support dashboard
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
