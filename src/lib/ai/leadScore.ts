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

import type { Lead, AIScoreResult, AIScoreFactor, LeadScore, LeadScoreFactor, LeadGrade } from '@/lib/types'
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

// Production scoring is time-relative: recency and pipeline age are measured
// against the moment the score is computed, so a lead's score decays as it
// goes cold and ages — re-scoring later naturally yields a fresh value.
function recencyDays(lastContactDate: string): number {
  const last = new Date(lastContactDate).getTime()
  return Math.max(0, Math.round((Date.now() - last) / 86_400_000))
}

function daysInPipeline(createdAt: string): number {
  const created = new Date(createdAt).getTime()
  return Math.max(0, Math.round((Date.now() - created) / 86_400_000))
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

// Model feature importances, normalised to sum to 1 so they read as relative
// weights in the UI ("الوزن النسبي").
const importancesNorm = (() => {
  const total = importances.reduce((s, v) => s + v, 0) || 1
  return importances.map((v) => v / total)
})()

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/**
 * Compute the full LeadScore the lead-scoring UI consumes, live from the lead's
 * current attributes. Unlike scoreLead() (which returns the raw AI result), this
 * builds the per-factor breakdown the detail panel renders:
 *   - factors: the five most influential model features. `score`/`maxScore` is
 *     the lead's raw strength on that feature (0–100); `weight` is the model's
 *     relative importance for it.
 *   - topFactors: the strongest positive drivers, for the recommendation card.
 *   - trend: movement vs. the lead's last persisted score (`previousScore`).
 *
 * @param lead             Lead entity from the DB
 * @param interactionCount interactions logged for this lead/customer
 * @param previousScore    last stored score (e.g. lead.aiScore) for trend
 */
export function leadScoreDetail(
  lead: Lead,
  interactionCount = 0,
  previousScore?: number,
): LeadScore {
  const features = featurise(lead, interactionCount)

  const scaled = scaler
    ? features.map((f, i) => (f - scaler.mean[i]) / scaler.scale[i])
    : features
  const logit = scaled.reduce((sum, f, i) => sum + coef[i] * f, intercept)
  const probability = sigmoid(logit)
  const totalScore = Math.round(Math.min(100, Math.max(0, probability * 110 - 5)))
  const grade: LeadGrade =
    totalScore >= 80 ? 'A' : totalScore >= 60 ? 'B' : totalScore >= 40 ? 'C' : 'D'

  // Signed per-feature contributions drive which factors we surface as drivers.
  const contribs = coef.map((c, i) => c * scaled[i])

  // The five highest-importance features, shown as the score breakdown.
  const order = features
    .map((_, i) => i)
    .sort((a, b) => importancesNorm[b] - importancesNorm[a])
    .slice(0, 5)
  const factors: LeadScoreFactor[] = order.map((i) => ({
    labelAr: labelsAr[i],
    score: Math.round(clamp01(features[i]) * 100),
    maxScore: 100,
    weight: Math.round(importancesNorm[i] * 1000) / 1000,
  }))

  // Positive drivers: features pushing the score up where the lead scores well.
  let topFactors = contribs
    .map((contrib, i) => ({ labelAr: labelsAr[i], contrib, raw: features[i] }))
    .filter((f) => f.contrib > 0 && f.raw >= 0.5)
    .sort((a, b) => b.contrib - a.contrib)
    .slice(0, 3)
    .map((f) => f.labelAr)
  if (topFactors.length === 0) {
    // Cold lead with no strong positive signal — surface its best raw features.
    topFactors = features
      .map((raw, i) => ({ raw, i }))
      .sort((a, b) => b.raw - a.raw)
      .slice(0, 2)
      .map((f) => labelsAr[f.i])
  }

  const prev = previousScore ?? totalScore
  const trend: LeadScore['trend'] =
    totalScore > prev + 3 ? 'up' : totalScore < prev - 3 ? 'down' : 'stable'

  return {
    leadId: lead.id,
    totalScore,
    maxScore: 100,
    grade,
    updatedAt: new Date().toISOString(),
    trend,
    topFactors,
    factors,
  }
}
