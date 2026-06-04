/**
 * Centralised request validation for every API route.
 *
 * The API surface mutates real data (leads, customers, tickets, integrations…),
 * so every endpoint must reject malformed or hostile input before it reaches the
 * data-access layer. This module is the single source of truth for what a valid
 * request body looks like — Zod schemas mirror the `types.ts` shapes, and
 * `parseJsonBody` / `validateId` turn a failed check into a 400 with structured,
 * Arabic-facing error messages instead of a 500 (or silent bad write).
 *
 * Error responses share one shape so the client can surface them consistently:
 *   { error: string, fieldErrors?: Record<string,string[]>, formErrors?: string[] }
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'

// ─── Reusable primitives ──────────────────────────────────────────────────────

/** Trimmed string with min/max length and Arabic error messages. */
const trimmed = (min: number, max: number) =>
  z
    .string({ message: 'قيمة نصية مطلوبة' })
    .trim()
    .min(min, min === 1 ? 'هذا الحقل مطلوب' : `يجب ألا يقل عن ${min} أحرف`)
    .max(max, `يجب ألا يتجاوز ${max} حرفاً`)

/** Entity / route id. Permissive on charset but bounded in length. */
export const idSchema = z.string().trim().min(1, 'معرّف مطلوب').max(128, 'معرّف غير صالح')

const SAUDI_MOBILE = /^(?:\+?9665\d{8}|05\d{8})$/

/** Saudi mobile number; tolerates spaces/dashes, normalises them away. */
export const saudiPhoneSchema = z
  .string({ message: 'رقم الجوال مطلوب' })
  .trim()
  .transform((s) => s.replace(/[\s-]/g, ''))
  .refine((s) => SAUDI_MOBILE.test(s), 'رقم جوال غير صالح (مثال: 05XXXXXXXX)')

/** Optional Saudi mobile — empty string is treated as "not provided". */
export const optionalSaudiPhoneSchema = z.preprocess(
  (v) => (typeof v === 'string' ? v.replace(/[\s-]/g, '').trim() : v),
  z
    .string()
    .refine((s) => s === '' || SAUDI_MOBILE.test(s), 'رقم جوال غير صالح (مثال: 05XXXXXXXX)')
    .optional(),
)

/** Optional email — empty string / null collapse to undefined. */
export const optionalEmailSchema = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.string().email('بريد إلكتروني غير صالح').max(254).optional(),
)

/** ISO-8601 / parseable date string. */
export const isoDateSchema = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), 'تاريخ غير صالح')

/** Optional bounded free text. */
const optionalText = (max: number) => z.string().trim().max(max, `يجب ألا يتجاوز ${max} حرفاً`).optional()

// ─── Enum schemas (mirror types.ts union types) ────────────────────────────────

export const channelSchema = z.enum(['SMS', 'WhatsApp', 'Email', 'Web', 'Social'])
export const leadSourceSchema = z.enum(['Web', 'Social', 'Referral', 'Exhibition', 'Cold Call', 'Campaign'])
export const pipelineStageSchema = z.enum(['New', 'Contacted', 'Qualified', 'Proposal', 'Closed Won', 'Closed Lost'])
export const interactionTypeSchema = z.enum(['Call', 'Message', 'Email', 'Meeting', 'Site Visit', 'Document', 'System'])
export const opportunityStageSchema = z.enum(['تحديد الاهتمام', 'عرض الوحدة', 'مفاوضة السعر', 'طلب التمويل', 'إبرام العقد', 'مغلقة'])
export const ticketSeveritySchema = z.enum(['Critical', 'High', 'Medium', 'Low'])
export const ticketStatusSchema = z.enum(['Open', 'In Progress', 'Resolved', 'Closed'])
export const supportLevelSchema = z.enum(['L1', 'L2'])
export const integrationStatusSchema = z.enum(['Active', 'Warning', 'Error', 'Inactive'])
export const integrationTypeSchema = z.enum(['Real-time', 'Batch', 'On-demand'])
export const campaignStatusSchema = z.enum(['Draft', 'Scheduled', 'Active', 'Paused', 'Completed'])
export const journeyStatusSchema = z.enum(['Draft', 'Active', 'Paused', 'Completed'])
export const journeyNodeTypeSchema = z.enum(['trigger', 'action', 'condition', 'delay'])
export const httpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])

// ─── Bounds shared across money / score fields ─────────────────────────────────

const MAX_MONEY = 1_000_000_000 // 1B SAR — generous upper bound, rejects garbage
const aiScore = z.number().int().min(0, 'القيمة بين 0 و100').max(100, 'القيمة بين 0 و100')
const money = z.number().positive('يجب أن تكون القيمة موجبة').max(MAX_MONEY, 'القيمة كبيرة بشكل غير منطقي')
const percent = z.number().min(0).max(100, 'النسبة بين 0 و100')

// ─── Leads ─────────────────────────────────────────────────────────────────────

export const leadCreateSchema = z.object({
  nameAr: trimmed(2, 120),
  phone: saudiPhoneSchema,
  email: optionalEmailSchema,
  source: leadSourceSchema.default('Web'),
  channel: channelSchema.default('WhatsApp'),
  stage: pipelineStageSchema.default('New'),
  aiScore: aiScore.default(50),
  salesRepId: z.string().trim().max(128).default(''),
  propertyInterest: trimmed(1, 120).default('غير محدد'),
  city: trimmed(1, 120).default('غير محدد'),
  budget: money.optional(),
  notes: optionalText(2000),
  lastContactDate: isoDateSchema.default(() => new Date().toISOString()),
  customerId: z.string().trim().max(128).optional(),
})

// ─── Sales reps ──────────────────────────────────────────────────────────────

export const salesRepCreateSchema = z.object({
  nameAr: trimmed(2, 120),
  email: optionalEmailSchema,
  phone: optionalSaudiPhoneSchema,
  region: optionalText(120),
})

export const salesRepDeleteSchema = z.object({ id: idSchema })

// ─── Customer 360 ──────────────────────────────────────────────────────────────

export const assignSalesRepSchema = z.object({ salesRepId: idSchema })

export const interactionCreateSchema = z.object({
  type: interactionTypeSchema,
  channel: z.string().trim().max(60).default(''),
  note: z.string().trim().max(2000, 'يجب ألا يتجاوز 2000 حرفاً').default(''),
  salesRepId: z.string().trim().max(128).optional(),
})

export const opportunityCreateSchema = z.object({
  titleAr: trimmed(1, 200),
  project: optionalText(200),
  unitType: z.string().trim().max(120).default(''),
  valueRiyal: money.optional(),
  stage: opportunityStageSchema.optional(),
  probability: percent.optional(),
  salesRepId: z.string().trim().max(128).optional(),
})

// ─── Journeys ────────────────────────────────────────────────────────────────

const journeyNodeSchema = z
  .object({
    id: z.string().min(1).max(128),
    type: journeyNodeTypeSchema,
    position: z.object({ x: z.number(), y: z.number() }),
    data: z
      .object({
        labelAr: z.string().max(200),
        subLabelAr: z.string().max(200).optional(),
        type: journeyNodeTypeSchema,
        config: z.record(z.unknown()).default({}),
      })
      .passthrough(),
  })
  .passthrough()

const journeyEdgeSchema = z
  .object({
    id: z.string().min(1).max(128),
    source: z.string().min(1).max(128),
    target: z.string().min(1).max(128),
    label: z.string().max(120).optional(),
    animated: z.boolean().optional(),
  })
  .passthrough()

export const journeyCreateSchema = z.object({
  nameAr: trimmed(1, 200),
  descriptionAr: optionalText(2000),
  status: journeyStatusSchema.default('Draft'),
  nodes: z.array(journeyNodeSchema).max(500, 'عدد العقد كبير جداً').default([]),
  edges: z.array(journeyEdgeSchema).max(1000, 'عدد الوصلات كبير جداً').default([]),
  trigger: z.string().trim().max(200).default(''),
  enrolledCount: z.number().int().min(0).default(0),
  completedCount: z.number().int().min(0).default(0),
})

export const journeyUpdateSchema = z
  .object({
    nameAr: trimmed(1, 200).optional(),
    descriptionAr: optionalText(2000),
    status: journeyStatusSchema.optional(),
    nodes: z.array(journeyNodeSchema).max(500).optional(),
    edges: z.array(journeyEdgeSchema).max(1000).optional(),
    trigger: z.string().trim().max(200).optional(),
    enrolledCount: z.number().int().min(0).optional(),
    completedCount: z.number().int().min(0).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, 'لا توجد حقول للتحديث')

// ─── Campaigns ───────────────────────────────────────────────────────────────

const messageTemplateSchema = z.object({
  body: z.string().max(5000, 'نص الرسالة طويل جداً').default(''),
  variables: z.array(z.string().max(60)).max(50).default([]),
})

const campaignAudienceSchema = z
  .object({
    city: z.array(z.string().max(120)).optional(),
    propertyInterest: z.array(z.string().max(120)).optional(),
    leadStage: z.array(pipelineStageSchema).optional(),
    lastInteractionDays: z.number().int().min(0).max(3650).optional(),
    estimatedReach: z.number().int().min(0).default(0),
  })
  .passthrough()

const campaignScheduleSchema = z.object({
  type: z.enum(['immediate', 'scheduled']),
  scheduledAt: isoDateSchema.optional(),
})

const campaignMetricsSchema = z.object({
  sent: z.number().int().min(0).default(0),
  delivered: z.number().int().min(0).default(0),
  opened: z.number().int().min(0).default(0),
  clicked: z.number().int().min(0).default(0),
  converted: z.number().int().min(0).default(0),
})

const EMPTY_METRICS = { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0 }

export const campaignCreateSchema = z.object({
  nameAr: trimmed(1, 200),
  type: z.string().trim().max(120).default('general'),
  descriptionAr: z.string().trim().max(2000).default(''),
  channels: z.array(channelSchema).min(1, 'اختر قناة واحدة على الأقل').max(5),
  audience: campaignAudienceSchema,
  messageTemplate: messageTemplateSchema,
  schedule: campaignScheduleSchema,
  status: campaignStatusSchema.default('Draft'),
  metrics: campaignMetricsSchema.default(EMPTY_METRICS),
  createdBy: z.string().trim().max(120).default('admin@nhc.sa'),
})

export const campaignUpdateSchema = z
  .object({
    nameAr: trimmed(1, 200).optional(),
    status: campaignStatusSchema.optional(),
    metrics: campaignMetricsSchema.optional(),
  })
  .refine((o) => Object.keys(o).length > 0, 'لا توجد حقول للتحديث')

// ─── Tickets ─────────────────────────────────────────────────────────────────

const ticketStepSchema = z
  .object({
    date: isoDateSchema,
    action: z.string().max(500),
    by: z.string().max(120),
    note: z.string().max(2000).optional(),
  })
  .passthrough()

const escalationEntrySchema = z
  .object({
    date: isoDateSchema,
    fromLevel: supportLevelSchema,
    toLevel: supportLevelSchema,
    reason: z.string().max(1000),
    escalatedBy: z.string().max(120),
  })
  .passthrough()

const ticketCommentSchema = z
  .object({
    by: z.string().max(120),
    text: z.string().max(2000),
    date: isoDateSchema,
  })
  .passthrough()

export const ticketCreateSchema = z.object({
  titleAr: trimmed(1, 200),
  descriptionAr: z.string().trim().max(5000).default(''),
  severity: ticketSeveritySchema,
  status: ticketStatusSchema.default('Open'),
  level: supportLevelSchema.default('L1'),
  assignedTo: z.string().trim().max(120).default(''),
  customerId: z.string().trim().max(128).optional(),
  slaDeadline: isoDateSchema,
  slaHours: z.number().min(0).max(8760, 'عدد الساعات غير منطقي'),
  steps: z.array(ticketStepSchema).max(200).default([]),
  rcaLink: z.string().trim().max(500).optional(),
  escalationHistory: z.array(escalationEntrySchema).max(100).default([]),
  comments: z.array(ticketCommentSchema).max(500).default([]),
})

export const ticketUpdateSchema = z
  .object({
    status: ticketStatusSchema.optional(),
    assignedTo: z.string().trim().max(120).optional(),
    steps: z.array(ticketStepSchema).max(200).optional(),
    comments: z.array(ticketCommentSchema).max(500).optional(),
    escalationHistory: z.array(escalationEntrySchema).max(100).optional(),
    resolvedAt: isoDateSchema.nullable().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, 'لا توجد حقول للتحديث')

// ─── Integrations ──────────────────────────────────────────────────────────────

export const auditLogEntrySchema = z.object({
  id: z.string().min(1).max(128),
  timestamp: isoDateSchema,
  method: httpMethodSchema,
  endpoint: z.string().max(1000),
  statusCode: z.number().int().min(100).max(599, 'رمز حالة غير صالح'),
  duration: z.number().min(0),
  records: z.number().int().min(0),
  errorMessage: z.string().max(2000).optional(),
})

export const integrationCreateSchema = z.object({
  nameAr: trimmed(1, 200),
  nameEn: trimmed(1, 200),
  category: z.string().trim().max(120).default('عام'),
  type: integrationTypeSchema,
  status: integrationStatusSchema.default('Inactive'),
  description: optionalText(2000),
  endpoint: z.string().trim().url('رابط غير صالح').max(500).optional(),
})

export const integrationUpdateSchema = z
  .object({
    status: integrationStatusSchema.optional(),
    recordCount: z.number().int().min(0).optional(),
    lastSync: isoDateSchema.optional(),
    auditLog: z.array(auditLogEntrySchema).max(1000).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, 'لا توجد حقول للتحديث')

// ─── Helpers ─────────────────────────────────────────────────────────────────

export type ParseResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse }

/** Build the canonical error response shape. */
export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Read and validate a JSON request body against `schema`. On any failure
 * (unparseable JSON or schema violation) returns a ready-to-send 400 response
 * with field-level Arabic messages; on success returns the parsed, typed data.
 */
export async function parseJsonBody<S extends z.ZodTypeAny>(
  req: Request,
  schema: S,
): Promise<ParseResult<z.infer<S>>> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return { ok: false, response: jsonError('صيغة الطلب غير صالحة (JSON غير صحيح)', 400) }
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    const flat = result.error.flatten()
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'فشل التحقق من البيانات', fieldErrors: flat.fieldErrors, formErrors: flat.formErrors },
        { status: 400 },
      ),
    }
  }
  return { ok: true, data: result.data }
}

/** Validate a path/route id segment. */
export function validateId(id: string): ParseResult<string> {
  const result = idSchema.safeParse(id)
  if (!result.success) return { ok: false, response: jsonError('معرّف غير صالح', 400) }
  return { ok: true, data: result.data }
}
