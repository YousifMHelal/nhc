/**
 * Unit Recommendation Engine — pure, deterministic, no backend.
 *
 * Scores available units against a customer's profile and returns
 * the top-N ranked recommendations with match reasons in Arabic.
 */

import type { Customer, Unit, UnitRecommendation, UnitRecommendationResult } from '@/lib/types'

// Weight coefficients for each match dimension (must sum to 1)
const W = {
  typeMatch: 0.30,
  cityMatch: 0.20,
  budgetFit: 0.25,
  bedroomFit: 0.10,
  featureBonus: 0.10,
  aiScoreBonus: 0.05,
}

// Derive implied bedroom preference from property interest
function impliedBedrooms(propertyInterest: string): number {
  if (propertyInterest === 'شقة') return 2
  if (propertyInterest === 'دوبلكس') return 3
  if (propertyInterest === 'تاون هاوس') return 3
  if (propertyInterest === 'فيلا') return 4
  if (propertyInterest === 'أرض') return 0
  return 3
}

// Derive implied budget ceiling from aiScore (higher score = more purchasing power)
function budgetCeiling(aiScore: number): number {
  return 800_000 + (aiScore / 100) * 4_200_000
}

function budgetFitScore(unit: Unit, ceilingRiyal: number): number {
  if (unit.priceRiyal > ceilingRiyal * 1.25) return 0
  if (unit.priceRiyal <= ceilingRiyal) return 1
  // Slightly over budget — linear penalty
  return Math.max(0, 1 - (unit.priceRiyal - ceilingRiyal) / (ceilingRiyal * 0.25))
}

function buildMatchReasons(
  unit: Unit,
  customer: Customer,
  scores: Record<string, number>,
): string[] {
  const reasons: string[] = []

  if (scores.typeMatch >= 1) {
    reasons.push(`نوع العقار يطابق اهتمام العميل (${customer.propertyInterest})`)
  }

  if (scores.cityMatch >= 1) {
    reasons.push(`في مدينة ${unit.city} المفضلة للعميل`)
  }

  if (scores.budgetFit >= 0.9) {
    reasons.push(`السعر ضمن الميزانية المتاحة`)
  } else if (scores.budgetFit >= 0.7) {
    reasons.push(`السعر قريب من الميزانية المقدرة`)
  }

  if (scores.bedroomFit >= 1) {
    reasons.push(`عدد الغرف يناسب احتياج العميل (${unit.bedrooms} غرف)`)
  }

  if (unit.features.length >= 3) {
    reasons.push(`مزايا متميزة: ${unit.features.slice(0, 2).join('، ')}`)
  }

  if (reasons.length === 0) {
    reasons.push(`يُناسب ملف العميل بشكل عام`)
  }

  return reasons
}

export function recommendUnits(
  customer: Customer,
  availableUnits: Unit[],
  topN = 3,
): UnitRecommendationResult {
  const budget = budgetCeiling(customer.aiScore)
  const preferredBedrooms = impliedBedrooms(customer.propertyInterest)

  const scored: (UnitRecommendation & { _raw: number })[] = availableUnits
    .filter((u) => u.status === 'Available')
    .map((unit) => {
      const typeMatch = unit.unitType === customer.propertyInterest ? 1 : 0
      const cityMatch = unit.city === customer.city ? 1 : 0
      const budgetFit = budgetFitScore(unit, budget)
      const bedroomFit =
        preferredBedrooms === 0
          ? 0.5
          : Math.max(0, 1 - Math.abs(unit.bedrooms - preferredBedrooms) * 0.25)
      const featureBonus = Math.min(unit.features.length / 4, 1)
      const aiScoreBonus = customer.aiScore / 100

      const raw =
        typeMatch * W.typeMatch +
        cityMatch * W.cityMatch +
        budgetFit * W.budgetFit +
        bedroomFit * W.bedroomFit +
        featureBonus * W.featureBonus +
        aiScoreBonus * W.aiScoreBonus

      const matchScore = Math.round(raw * 100)

      const dimensionScores = { typeMatch, cityMatch, budgetFit, bedroomFit }

      return {
        unit,
        matchScore,
        matchReasons: buildMatchReasons(unit, customer, dimensionScores),
        rank: 0,
        _raw: raw,
      }
    })
    .sort((a, b) => b._raw - a._raw)
    .slice(0, topN)
    .map((r, i) => ({ ...r, rank: i + 1 }))

  return {
    customerId: customer.id,
    recommendations: scored.map(({ _raw: _r, ...rest }) => rest),
    scoredAt: new Date().toISOString(),
  }
}
