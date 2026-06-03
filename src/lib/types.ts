// ─── Primitives / Union Types ─────────────────────────────────────────────────

export type Channel = 'SMS' | 'WhatsApp' | 'Email' | 'Web' | 'Social'

export type PipelineStage =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Proposal'
  | 'Closed Won'
  | 'Closed Lost'

export type CustomerSegment = 'VIP' | 'Standard' | 'At-Risk' | 'New'

export type LeadSource =
  | 'Web'
  | 'Social'
  | 'Referral'
  | 'Exhibition'
  | 'Cold Call'
  | 'Campaign'

export type InteractionType =
  | 'Call'
  | 'Message'
  | 'Email'
  | 'Meeting'
  | 'Site Visit'
  | 'Document'
  | 'System'

export type CampaignStatus = 'Draft' | 'Scheduled' | 'Active' | 'Paused' | 'Completed'

export type JourneyStatus = 'Draft' | 'Active' | 'Paused' | 'Completed'

export type JourneyNodeType = 'trigger' | 'action' | 'condition' | 'delay'

export type TicketSeverity = 'Critical' | 'High' | 'Medium' | 'Low'

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed'

export type SupportLevel = 'L1' | 'L2'

export type IntegrationStatus = 'Active' | 'Warning' | 'Error' | 'Inactive'

export type IntegrationType = 'Real-time' | 'Batch' | 'On-demand'

export type ActivityType =
  | 'lead_added'
  | 'stage_changed'
  | 'interaction_logged'
  | 'contract_signed'
  | 'campaign_sent'
  | 'ticket_created'
  | 'score_updated'
  | 'opportunity_created'

export type LeadGrade = 'A' | 'B' | 'C' | 'D'

export type OpportunityStage =
  | 'تحديد الاهتمام'
  | 'عرض الوحدة'
  | 'مفاوضة السعر'
  | 'طلب التمويل'
  | 'إبرام العقد'
  | 'مغلقة'

export type ContractStatus = 'Draft' | 'Signed' | 'Active' | 'Completed' | 'Cancelled'

export type RequestStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed'

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface SalesRep {
  id: string
  nameAr: string
  email: string
  phone: string
  avatarInitials: string
  leads: number
  conversions: number
  revenue: number
  rank: number
  region: string
}

export interface Customer {
  id: string
  nameAr: string
  nic: string
  phone: string
  email: string
  segment: CustomerSegment
  city: string
  propertyInterest: string
  aiScore: number
  salesRepId: string
  createdAt: string
  address?: string
  nationality: string
}

export interface Lead {
  id: string
  customerId?: string
  nameAr: string
  phone: string
  email?: string
  source: LeadSource
  channel: Channel
  stage: PipelineStage
  aiScore: number
  salesRepId: string
  propertyInterest: string
  city: string
  lastContactDate: string
  createdAt: string
  notes?: string
  budget?: number
}

export interface Opportunity {
  id: string
  customerId: string
  titleAr: string
  project: string
  unitType: string
  unitId?: string
  valueRiyal: number
  stage: OpportunityStage
  probability: number
  expectedCloseDate: string
  salesRepId: string
  createdAt: string
  notes?: string
}

export interface Contract {
  id: string
  customerId: string
  opportunityId: string
  project: string
  unitId: string
  unitType: string
  valueRiyal: number
  status: ContractStatus
  signedDate?: string
  startDate: string
  endDate?: string
  paymentPlan: string
}

export interface Request {
  id: string
  customerId: string
  type: string
  descriptionAr: string
  status: RequestStatus
  priority: TicketSeverity
  createdAt: string
  resolvedAt?: string
  assignedTo?: string
}

// ─── Engagement / Timeline ────────────────────────────────────────────────────

export interface Interaction {
  id: string
  customerId: string
  type: InteractionType
  channel: Channel | 'Meeting' | 'System'
  date: string
  note: string
  salesRepId?: string
  duration?: number
}

export interface TimelineEvent {
  id: string
  customerId: string
  entityType: 'Interaction' | 'Opportunity' | 'Contract' | 'Request' | 'Campaign' | 'Lead'
  entityId: string
  titleAr: string
  descriptionAr: string
  date: string
  type: InteractionType | 'opportunity' | 'contract' | 'campaign' | 'request' | 'lead'
  channel?: Channel | 'Meeting' | 'System'
}

// ─── AI Lead Scoring ──────────────────────────────────────────────────────────

export interface LeadScoreFactor {
  labelAr: string
  score: number
  maxScore: number
  weight: number
}

export interface LeadScore {
  leadId: string
  totalScore: number
  maxScore: number
  grade: LeadGrade
  factors: LeadScoreFactor[]
  updatedAt: string
  trend: 'up' | 'down' | 'stable'
  topFactors: string[]
}

export interface AIScoreFactor {
  labelAr: string
  contribution: number  // 0–100 relative contribution (positive = good)
  raw: number          // raw feature value (0–1)
}

export interface AIScoreResult {
  score: number              // 0–100 final score
  tier: 'A' | 'B' | 'C' | 'D'
  probability: number        // raw logistic output 0–1
  topFactors: AIScoreFactor[]
  scoredAt: string
}

// ─── Marketing Campaign ────────────────────────────────────────────────────────

export interface MessageTemplate {
  body: string
  variables: string[]
}

export interface CampaignAudience {
  city?: string[]
  propertyInterest?: string[]
  leadStage?: PipelineStage[]
  lastInteractionDays?: number
  estimatedReach: number
}

export interface CampaignSchedule {
  type: 'immediate' | 'scheduled'
  scheduledAt?: string
}

export interface CampaignMetrics {
  sent: number
  delivered: number
  opened: number
  clicked: number
  converted: number
}

export interface Campaign {
  id: string
  nameAr: string
  type: string
  descriptionAr: string
  channels: Channel[]
  audience: CampaignAudience
  messageTemplate: MessageTemplate
  schedule: CampaignSchedule
  status: CampaignStatus
  metrics: CampaignMetrics
  createdAt: string
  createdBy: string
}

// ─── Customer Journey (ReactFlow canvas) ─────────────────────────────────────

export interface JourneyNodeData {
  labelAr: string
  subLabelAr?: string
  type: JourneyNodeType
  config: Record<string, unknown>
}

export interface JourneyNode {
  id: string
  type: JourneyNodeType
  position: { x: number; y: number }
  data: JourneyNodeData
}

export interface JourneyEdge {
  id: string
  source: string
  target: string
  label?: string
  animated?: boolean
}

export interface Journey {
  id: string
  nameAr: string
  descriptionAr?: string
  status: JourneyStatus
  nodes: JourneyNode[]
  edges: JourneyEdge[]
  trigger: string
  createdAt: string
  activatedAt?: string
  enrolledCount: number
  completedCount: number
}

// ─── Support Tickets ──────────────────────────────────────────────────────────

export interface TicketStep {
  date: string
  action: string
  by: string
  note?: string
}

export interface EscalationEntry {
  date: string
  fromLevel: SupportLevel
  toLevel: SupportLevel
  reason: string
  escalatedBy: string
}

export interface TicketComment {
  by: string
  text: string
  date: string
}

export interface Ticket {
  id: string
  titleAr: string
  descriptionAr: string
  severity: TicketSeverity
  status: TicketStatus
  level: SupportLevel
  assignedTo: string
  customerId?: string
  slaDeadline: string
  slaHours: number
  steps: TicketStep[]
  rcaLink?: string
  escalationHistory: EscalationEntry[]
  comments: TicketComment[]
  createdAt: string
  resolvedAt?: string
}

// ─── Integration Monitor ──────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string
  timestamp: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  endpoint: string
  statusCode: number
  duration: number
  records: number
  errorMessage?: string
}

export interface Integration {
  id: string
  nameAr: string
  nameEn: string
  category: string
  type: IntegrationType
  status: IntegrationStatus
  lastSync: string
  recordCount: number
  auditLog: AuditLogEntry[]
  description?: string
}

// ─── Unit Inventory ───────────────────────────────────────────────────────────

export type UnitStatus = 'Available' | 'Reserved' | 'Sold' | 'Under Construction'

export interface Unit {
  id: string
  project: string
  unitType: string
  bedrooms: number
  area: number           // sqm
  floorLevel: number
  priceRiyal: number
  city: string
  status: UnitStatus
  features: string[]     // e.g. ['مسبح', 'حديقة', 'موقف مزدوج']
  deliveryDate: string   // ISO
}

// ─── Housing Eligibility ──────────────────────────────────────────────────────

export type EligibilityProgram =
  | 'سكني'
  | 'وافي'
  | 'صندوق التنمية العقارية'
  | 'القرض العقاري المدعوم'
  | 'دعم الإيجار'

export interface EligibilityFactor {
  labelAr: string
  met: boolean
  descriptionAr: string
}

export interface HousingEligibilityResult {
  customerId: string
  eligible: boolean
  score: number                    // 0–100
  tier: 'مؤهل كامل' | 'مؤهل جزئي' | 'غير مؤهل'
  programs: EligibilityProgram[]
  factors: EligibilityFactor[]
  recommendationAr: string
  scoredAt: string
}

// ─── Unit Recommendation ──────────────────────────────────────────────────────

export interface UnitRecommendation {
  unit: Unit
  matchScore: number               // 0–100
  matchReasons: string[]           // Arabic bullet points
  rank: number
}

export interface UnitRecommendationResult {
  customerId: string
  recommendations: UnitRecommendation[]
  scoredAt: string
}

// ─── Combined AI Pipeline ─────────────────────────────────────────────────────

export interface AIAnalysisPipeline {
  customerId: string
  leadScore: AIScoreResult
  eligibility: HousingEligibilityResult
  unitRecs: UnitRecommendationResult
}

// ─── Analytics & Reporting ────────────────────────────────────────────────────

export interface FunnelStage {
  stage: string
  nameAr: string
  count: number
  value: number
  conversionRate: number
  color: string
}

export interface ChannelPerformance {
  channel: Channel | 'Referral'
  leads: number
  conversions: number
  conversionRate: number
  revenue: number
}

export interface KpiData {
  totalLeads: number
  totalLeadsGrowth: number
  conversionRate: number
  conversionRateGrowth: number
  openOpportunities: number
  openOpportunitiesValue: number
  campaignPerformance: number
  campaignPerformanceGrowth: number
  revenueThisMonth: number
  revenueGrowth: number
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

export interface Activity {
  id: string
  type: ActivityType
  titleAr: string
  descriptionAr: string
  entityId: string
  entityType: 'lead' | 'customer' | 'opportunity' | 'contract' | 'campaign' | 'ticket'
  date: string
  salesRepId?: string
  customerNameAr?: string
}
