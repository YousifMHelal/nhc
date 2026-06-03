/**
 * Lead Scoring — client-side TypeScript scorer
 *
 * Loads coefficients from pilot/lead-scoring/model.json and computes a
 * 0–100 score + top-3 factor breakdown for any Lead.
 *
 * No backend call. Pure deterministic function.
 *
 * Shape contract: must stay in sync with train.py featurise() order.
 */

import type { Lead, AIScoreResult, AIScoreFactor } from '@/lib/types'
import MODEL from '../../../pilot/lead-scoring/model.json'

// ── Feature encoding (mirrors train.py) ─────────────────────────────────────

const SOURCE_SCORES: Record<string, number> = MODEL.scoring.source_scores as Record<string, number>
const CHANNEL_SCORES: Record<string, number> = MODEL.scoring.channel_scores as Record<string, number>
const PROPERTY_SCORES: Record<string, number> = MODEL.scoring.property_scores as Record<string, number>

const BUDGET_MAX = MODEL.scoring.budget_max
const INTERACTION_MAX = MODEL.scoring.interaction_max
const RECENCY_MAX = MODEL.scoring.recency_max
const DAYS_IN_PIPELINE_MAX = MODEL.scoring.days_in_pipeline_max

const CITY_TIER_1 = new Set(['الرياض', 'جدة'])
const CITY_TIER_2 = new Set(['الدمام', 'مكة المكرمة', 'المدينة المنورة', 'الخبر'])

function cityTierNorm(city: string): number {
  if (CITY_TIER_1.has(city)) return 1.0
  if (CITY_TIER_2.has(city)) return 0.6
  return 0.3
}

function recencyDays(lastContactDate: string): number {
  const now = new Date('2026-06-03').getTime()
  const last = new Date(lastContactDate).getTime()
  return Math.max(0, Math.round((now - last) / 86_400_000))
}

function daysInPipeline(createdAt: string): number {
  const now = new Date('2026-06-03').getTime()
  const created = new Date(createdAt).getTime()
  return Math.max(0, Math.round((now - created) / 86_400_000))
}

/** Build the 10-element feature vector matching train.py featurise(). */
function featurise(lead: Lead, interactionCount = 0): number[] {
  const recency = recencyDays(lead.lastContactDate)
  const pipelineAge = daysInPipeline(lead.createdAt)
  return [
    SOURCE_SCORES[lead.source] ?? 0.4,
    CHANNEL_SCORES[lead.channel] ?? 0.4,
    PROPERTY_SCORES[lead.propertyInterest] ?? 0.6,
    cityTierNorm(lead.city),
    Math.min((lead.budget ?? 0) / BUDGET_MAX, 1.0),
    Math.min(interactionCount / INTERACTION_MAX, 1.0),
    0,                                                   // has_site_visit — unknown without interaction log
    lead.email ? 1 : 0,
    Math.max(0, 1 - recency / RECENCY_MAX),
    Math.max(0, 1 - pipelineAge / DAYS_IN_PIPELINE_MAX),
  ]
}

// ── Logistic sigmoid ─────────────────────────────────────────────────────────

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

// ── Main scorer ──────────────────────────────────────────────────────────────

const coef = MODEL.coef as number[]
const intercept = MODEL.intercept as number
const scaler = MODEL.scaler as { mean: number[]; scale: number[] } | null
const importances = MODEL.feature_importances as number[]
const labelsAr = MODEL.feature_labels_ar as string[]

/**
 * Score a single lead.
 *
 * @param lead         Lead entity from mock data or DB
 * @param interactionCount  pre-computed interaction count for this lead/customer
 * @returns AIScoreResult with score 0–100, tier, probability, and top-3 factors
 */
export function scoreLead(lead: Lead, interactionCount = 0): AIScoreResult {
  const features = featurise(lead, interactionCount)

  // Standardise if scaler available (logistic regression path)
  const scaled = scaler
    ? features.map((f, i) => (f - scaler.mean[i]) / scaler.scale[i])
    : features

  // Logistic regression: dot(coef, x) + intercept
  const logit = scaled.reduce((sum, f, i) => sum + coef[i] * f, intercept)
  const probability = sigmoid(logit)

  // Map probability to 0–100 score with slight stretch for UX clarity
  const score = Math.round(Math.min(100, Math.max(0, probability * 110 - 5)))

  const tier: AIScoreResult['tier'] =
    score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D'

  // Per-feature signed contributions: coef_i * scaled_i (then normalise to 0–100 range)
  const rawContribs = coef.map((c, i) => c * scaled[i])
  const totalAbsContrib = rawContribs.reduce((s, v) => s + Math.abs(v), 0) || 1
  const normContribs = rawContribs.map((v) => (v / totalAbsContrib) * 100)

  // Build factor objects
  const factors: AIScoreFactor[] = features.map((raw, i) => ({
    labelAr: labelsAr[i],
    contribution: Math.round(normContribs[i] * 10) / 10,
    raw,
  }))

  // Top 3 by absolute contribution magnitude (positive first, then highest |contrib|)
  const topFactors = [...factors]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 3)

  return {
    score,
    tier,
    probability: Math.round(probability * 1000) / 1000,
    topFactors,
    scoredAt: new Date().toISOString(),
  }
}

/**
 * Convert an AIScoreResult to the LeadScore shape the existing UI already
 * consumes, so no UI components need to change their prop types.
 */
export function toLeadScore(leadId: string, result: AIScoreResult, existingScore?: number): import('@/lib/types').LeadScore {
  const prev = existingScore ?? result.score
  const trend: 'up' | 'down' | 'stable' =
    result.score > prev + 3 ? 'up' : result.score < prev - 3 ? 'down' : 'stable'

  return {
    leadId,
    totalScore: result.score,
    maxScore: 100,
    grade: result.tier,
    updatedAt: result.scoredAt,
    trend,
    topFactors: result.topFactors.map((f) => f.labelAr),
    factors: result.topFactors.map((f) => ({
      labelAr: f.labelAr,
      score: Math.round(Math.max(0, f.contribution)),
      maxScore: 100,
      weight: f.raw,
    })),
  }
}
