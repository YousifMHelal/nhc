import type { LeadScore } from '@/lib/types'

export const LEAD_SCORES: LeadScore[] = [
  {
    leadId: 'lead-015',
    totalScore: 82,
    maxScore: 100,
    grade: 'A',
    trend: 'up',
    updatedAt: '2026-06-01T10:00:00Z',
    topFactors: ['إحالة من عميل VIP', 'ميزانية مرتفعة', 'تفاعل نشط'],
    factors: [
      { labelAr: 'التفاعل والاستجابة', score: 22, maxScore: 25, weight: 0.25 },
      { labelAr: 'الملاءة المالية', score: 20, maxScore: 25, weight: 0.25 },
      { labelAr: 'مصدر العميل المحتمل', score: 18, maxScore: 20, weight: 0.2 },
      { labelAr: 'مطابقة الاهتمام', score: 14, maxScore: 15, weight: 0.15 },
      { labelAr: 'الموقع الجغرافي', score: 8, maxScore: 15, weight: 0.15 },
    ],
  },
  {
    leadId: 'lead-013',
    totalScore: 77,
    maxScore: 100,
    grade: 'B',
    trend: 'up',
    updatedAt: '2026-05-28T09:00:00Z',
    topFactors: ['اهتمام بفيلا عالية القيمة', 'تفاعل جيد عبر الويب'],
    factors: [
      { labelAr: 'التفاعل والاستجابة', score: 19, maxScore: 25, weight: 0.25 },
      { labelAr: 'الملاءة المالية', score: 20, maxScore: 25, weight: 0.25 },
      { labelAr: 'مصدر العميل المحتمل', score: 14, maxScore: 20, weight: 0.2 },
      { labelAr: 'مطابقة الاهتمام', score: 13, maxScore: 15, weight: 0.15 },
      { labelAr: 'الموقع الجغرافي', score: 11, maxScore: 15, weight: 0.15 },
    ],
  },
  {
    leadId: 'lead-006',
    totalScore: 73,
    maxScore: 100,
    grade: 'B',
    trend: 'stable',
    updatedAt: '2026-06-02T10:00:00Z',
    topFactors: ['إحالة مباشرة', 'ميزانية مناسبة'],
    factors: [
      { labelAr: 'التفاعل والاستجابة', score: 17, maxScore: 25, weight: 0.25 },
      { labelAr: 'الملاءة المالية', score: 18, maxScore: 25, weight: 0.25 },
      { labelAr: 'مصدر العميل المحتمل', score: 17, maxScore: 20, weight: 0.2 },
      { labelAr: 'مطابقة الاهتمام', score: 12, maxScore: 15, weight: 0.15 },
      { labelAr: 'الموقع الجغرافي', score: 9, maxScore: 15, weight: 0.15 },
    ],
  },
  {
    leadId: 'lead-002',
    totalScore: 52,
    maxScore: 100,
    grade: 'C',
    trend: 'stable',
    updatedAt: '2026-06-02T14:00:00Z',
    topFactors: ['تفاعل متوسط عبر السوشيال'],
    factors: [
      { labelAr: 'التفاعل والاستجابة', score: 13, maxScore: 25, weight: 0.25 },
      { labelAr: 'الملاءة المالية', score: 12, maxScore: 25, weight: 0.25 },
      { labelAr: 'مصدر العميل المحتمل', score: 10, maxScore: 20, weight: 0.2 },
      { labelAr: 'مطابقة الاهتمام', score: 9, maxScore: 15, weight: 0.15 },
      { labelAr: 'الموقع الجغرافي', score: 8, maxScore: 15, weight: 0.15 },
    ],
  },
  {
    leadId: 'lead-003',
    totalScore: 44,
    maxScore: 100,
    grade: 'C',
    trend: 'down',
    updatedAt: '2026-06-01T10:00:00Z',
    topFactors: ['ردود بطيئة على الحملة'],
    factors: [
      { labelAr: 'التفاعل والاستجابة', score: 9, maxScore: 25, weight: 0.25 },
      { labelAr: 'الملاءة المالية', score: 11, maxScore: 25, weight: 0.25 },
      { labelAr: 'مصدر العميل المحتمل', score: 9, maxScore: 20, weight: 0.2 },
      { labelAr: 'مطابقة الاهتمام', score: 8, maxScore: 15, weight: 0.15 },
      { labelAr: 'الموقع الجغرافي', score: 7, maxScore: 15, weight: 0.15 },
    ],
  },
]

export const getLeadScore = (leadId: string) =>
  LEAD_SCORES.find((s) => s.leadId === leadId)
