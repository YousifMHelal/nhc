/**
 * Housing Eligibility Scorer — pure, deterministic, no backend.
 *
 * Evaluates a Customer against Saudi real-estate government programs
 * and returns a 0–100 eligibility score plus which programs apply.
 */

import type { Customer, HousingEligibilityResult, EligibilityProgram, EligibilityFactor } from '@/lib/types'

// Program eligibility thresholds (simplified rule engine)
const SAKANI_MAX_INCOME_PROXY = 14_000       // SAR/month proxy — high aiScore = higher income
const SUBSIDISED_MORTGAGE_MIN_SCORE = 55

function nationalitySaudi(customer: Customer): boolean {
  return customer.nationality.includes('سعود')
}

function isFirstHomeBuyer(customer: Customer, hasActiveContract: boolean): boolean {
  return !hasActiveContract
}

// Approximate monthly income proxy from aiScore (higher score = better financial profile)
function incomeProxy(aiScore: number): number {
  return 6_000 + (aiScore / 100) * 20_000
}

export function computeHousingEligibility(
  customer: Customer,
  hasActiveContract: boolean,
): HousingEligibilityResult {
  const isSaudi = nationalitySaudi(customer)
  const firstBuyer = isFirstHomeBuyer(customer, hasActiveContract)
  const estimatedIncome = incomeProxy(customer.aiScore)
  const hasEmail = Boolean(customer.email)

  const factors: EligibilityFactor[] = [
    {
      labelAr: 'الجنسية السعودية',
      met: isSaudi,
      descriptionAr: isSaudi ? 'العميل مواطن سعودي' : 'يُشترط الجنسية السعودية لبرامج دعم الإسكان',
    },
    {
      labelAr: 'مشتري أول مرة',
      met: firstBuyer,
      descriptionAr: firstBuyer ? 'لا يملك عقاراً مسجلاً' : 'يملك عقاراً — قد لا يُؤهل لبعض البرامج',
    },
    {
      labelAr: 'الجدارة الائتمانية',
      met: customer.aiScore >= SUBSIDISED_MORTGAGE_MIN_SCORE,
      descriptionAr:
        customer.aiScore >= SUBSIDISED_MORTGAGE_MIN_SCORE
          ? `الدرجة الائتمانية المقدّرة: ${customer.aiScore}/١٠٠ — مقبولة`
          : `الدرجة الائتمانية: ${customer.aiScore}/١٠٠ — أقل من الحد المطلوب`,
    },
    {
      labelAr: 'مستوى الدخل',
      met: estimatedIncome <= SAKANI_MAX_INCOME_PROXY * 2,
      descriptionAr:
        estimatedIncome <= SAKANI_MAX_INCOME_PROXY
          ? 'دخل منخفض إلى متوسط — مؤهل لبرامج الدعم'
          : 'دخل مرتفع — يؤهل للتمويل التجاري',
    },
    {
      labelAr: 'استيفاء البيانات',
      met: hasEmail,
      descriptionAr: hasEmail ? 'ملف العميل مكتمل' : 'بيانات التواصل غير مكتملة',
    },
  ]

  const metCount = factors.filter((f) => f.met).length
  const score = Math.round((metCount / factors.length) * 100)

  // Determine eligible programs
  const programs: EligibilityProgram[] = []

  if (isSaudi && firstBuyer) {
    programs.push('سكني')
  }

  if (isSaudi && estimatedIncome <= SAKANI_MAX_INCOME_PROXY) {
    programs.push('صندوق التنمية العقارية')
    programs.push('دعم الإيجار')
  }

  if (customer.aiScore >= SUBSIDISED_MORTGAGE_MIN_SCORE && isSaudi) {
    programs.push('القرض العقاري المدعوم')
  }

  if (isSaudi) {
    programs.push('وافي')
  }

  // Deduplicate preserving order
  const uniquePrograms = [...new Set(programs)] as EligibilityProgram[]

  const tier: HousingEligibilityResult['tier'] =
    score >= 80 ? 'مؤهل كامل' : score >= 50 ? 'مؤهل جزئي' : 'غير مؤهل'

  const eligible = score >= 50

  let recommendationAr: string
  if (tier === 'مؤهل كامل') {
    recommendationAr = `العميل مؤهل بالكامل لبرامج الإسكان الحكومية. يُنصح بالتقديم على برنامج ${uniquePrograms[0] ?? 'سكني'} فوراً.`
  } else if (tier === 'مؤهل جزئي') {
    const missing = factors.filter((f) => !f.met).map((f) => f.labelAr).join('، ')
    recommendationAr = `مؤهل جزئياً — يحتاج تحسين: ${missing}. يُمكن التقديم على ${uniquePrograms[0] ?? 'وافي'} بالوضع الحالي.`
  } else {
    recommendationAr = 'العميل غير مؤهل حالياً للبرامج الحكومية. يُنصح بالتمويل التجاري المباشر.'
  }

  return {
    customerId: customer.id,
    eligible,
    score,
    tier,
    programs: uniquePrograms,
    factors,
    recommendationAr,
    scoredAt: new Date().toISOString(),
  }
}
