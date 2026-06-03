import type { Interaction, TimelineEvent } from '@/lib/types'

export const INTERACTIONS: Interaction[] = [
  { id: 'int-001', customerId: 'cust-001', type: 'Call', channel: 'WhatsApp', date: '2026-05-28T10:00:00Z', note: 'اتصال مع العميل لمتابعة عرض فيلا السدرة. أبدى اهتمامًا وطلب مزيدًا من التفاصيل عن التشطيبات', salesRepId: 'rep-001', duration: 18 },
  { id: 'int-002', customerId: 'cust-001', type: 'Meeting', channel: 'Meeting', date: '2026-05-15T11:00:00Z', note: 'زيارة الموقع مع المهندس المعماري. استعرضنا الوحدة SDR-V-042 بالكامل', salesRepId: 'rep-001', duration: 90 },
  { id: 'int-003', customerId: 'cust-001', type: 'Document', channel: 'Email', date: '2026-05-10T09:00:00Z', note: 'إرسال عرض السعر الرسمي ومخطط الوحدة عبر البريد الإلكتروني', salesRepId: 'rep-001' },
  { id: 'int-004', customerId: 'cust-001', type: 'Message', channel: 'WhatsApp', date: '2026-04-25T14:00:00Z', note: 'رسالة متابعة بعد معرض سيتي سكيب — أرسلنا الكتالوج الرقمي', salesRepId: 'rep-001' },
  { id: 'int-005', customerId: 'cust-001', type: 'Call', channel: 'WhatsApp', date: '2026-03-10T10:00:00Z', note: 'مكالمة أولية، قدّمنا خيارات مشروع السدرة', salesRepId: 'rep-001', duration: 25 },

  { id: 'int-006', customerId: 'cust-004', type: 'Meeting', channel: 'Meeting', date: '2026-05-12T10:00:00Z', note: 'توقيع العقد النهائي لمشروع الفردوس — حضور المحامي والفريق القانوني', salesRepId: 'rep-002', duration: 120 },
  { id: 'int-007', customerId: 'cust-004', type: 'Call', channel: 'WhatsApp', date: '2026-04-28T09:00:00Z', note: 'مراجعة الشروط والأحكام النهائية قبل التوقيع', salesRepId: 'rep-002', duration: 35 },
  { id: 'int-008', customerId: 'cust-004', type: 'Document', channel: 'Email', date: '2026-04-15T14:00:00Z', note: 'إرسال مسودة العقد للمراجعة القانونية', salesRepId: 'rep-002' },
  { id: 'int-009', customerId: 'cust-004', type: 'Site Visit', channel: 'Meeting', date: '2026-03-20T10:00:00Z', note: 'زيارة ميدانية لمشروع الفردوس مع العميلة وعائلتها', salesRepId: 'rep-002', duration: 180 },

  { id: 'int-010', customerId: 'cust-006', type: 'Call', channel: 'WhatsApp', date: '2026-05-31T12:00:00Z', note: 'مقارنة مشروع السدرة مع مشروع منافس، يريد عرضاً تفصيلياً', salesRepId: 'rep-001', duration: 22 },
  { id: 'int-011', customerId: 'cust-006', type: 'Message', channel: 'WhatsApp', date: '2026-05-20T15:00:00Z', note: 'رسالة واتساب تؤكد اهتمامه بالوحدة SDR-V-089', salesRepId: 'rep-001' },
  { id: 'int-012', customerId: 'cust-006', type: 'Email', channel: 'Email', date: '2026-05-05T09:00:00Z', note: 'إرسال مواصفات الوحدة والمخطط الهندسي', salesRepId: 'rep-001' },
]

export const TIMELINE_EVENTS: TimelineEvent[] = [
  // ── Customer cust-001 ─────────────────────────────────────────────────────
  { id: 'tev-001', customerId: 'cust-001', entityType: 'Interaction', entityId: 'int-001', titleAr: 'مكالمة واتساب', descriptionAr: 'متابعة عرض فيلا السدرة — العميل مهتم بالتشطيبات', date: '2026-05-28T10:00:00Z', type: 'Call', channel: 'WhatsApp' },
  { id: 'tev-002', customerId: 'cust-001', entityType: 'Opportunity', entityId: 'opp-001', titleAr: 'فرصة — فيلا السدرة SDR-V-042', descriptionAr: 'قيمة الصفقة ٣,٢٠٠,٠٠٠ ريال — في مرحلة إبرام العقد', date: '2026-05-25T09:00:00Z', type: 'opportunity' },
  { id: 'tev-003', customerId: 'cust-001', entityType: 'Interaction', entityId: 'int-002', titleAr: 'زيارة الموقع', descriptionAr: 'جولة تفصيلية على الوحدة مع المهندس المعماري', date: '2026-05-15T11:00:00Z', type: 'Site Visit', channel: 'Meeting' },
  { id: 'tev-004', customerId: 'cust-001', entityType: 'Interaction', entityId: 'int-003', titleAr: 'إرسال عرض السعر', descriptionAr: 'عرض السعر الرسمي ومخطط الوحدة بالبريد الإلكتروني', date: '2026-05-10T09:00:00Z', type: 'Document', channel: 'Email' },
  { id: 'tev-005', customerId: 'cust-001', entityType: 'Campaign', entityId: 'camp-001', titleAr: 'حملة رمضان العقارية', descriptionAr: 'استجاب للحملة بالنقر على الإعلان', date: '2026-03-15T12:00:00Z', type: 'campaign', channel: 'Social' },
  { id: 'tev-006', customerId: 'cust-001', entityType: 'Lead', entityId: 'lead-001', titleAr: 'تسجيل عميل محتمل', descriptionAr: 'دخل للمرة الأولى عبر الموقع الإلكتروني', date: '2026-01-15T08:00:00Z', type: 'lead' },

  // ── Customer cust-004 ─────────────────────────────────────────────────────
  { id: 'tev-010', customerId: 'cust-004', entityType: 'Contract', entityId: 'ctr-001', titleAr: 'توقيع العقد', descriptionAr: 'إبرام عقد فيلا مشروع الفردوس بقيمة ٢,٨٠٠,٠٠٠ ريال', date: '2026-05-12T10:00:00Z', type: 'contract' },
  { id: 'tev-011', customerId: 'cust-004', entityType: 'Interaction', entityId: 'int-007', titleAr: 'مراجعة الشروط النهائية', descriptionAr: 'مراجعة بنود العقد النهائية مع المحامي', date: '2026-04-28T09:00:00Z', type: 'Call', channel: 'WhatsApp' },
  { id: 'tev-012', customerId: 'cust-004', entityType: 'Interaction', entityId: 'int-009', titleAr: 'زيارة مشروع الفردوس', descriptionAr: 'جولة ميدانية مع العائلة', date: '2026-03-20T10:00:00Z', type: 'Site Visit', channel: 'Meeting' },
  { id: 'tev-013', customerId: 'cust-004', entityType: 'Opportunity', entityId: 'opp-002', titleAr: 'فرصة — فيلا الفردوس', descriptionAr: 'تحديد الاهتمام بفيلا ٦ غرف', date: '2025-11-01T09:00:00Z', type: 'opportunity' },

  // ── Customer cust-006 ─────────────────────────────────────────────────────
  { id: 'tev-020', customerId: 'cust-006', entityType: 'Interaction', entityId: 'int-010', titleAr: 'مكالمة مقارنة المشاريع', descriptionAr: 'يقارن السدرة مع مشروع منافس', date: '2026-05-31T12:00:00Z', type: 'Call', channel: 'WhatsApp' },
  { id: 'tev-021', customerId: 'cust-006', entityType: 'Opportunity', entityId: 'opp-004', titleAr: 'فرصة — فيلا SDR-V-089', descriptionAr: 'في مرحلة طلب التمويل', date: '2026-03-20T09:00:00Z', type: 'opportunity' },
  { id: 'tev-022', customerId: 'cust-006', entityType: 'Request', entityId: 'req-003', titleAr: 'طلب زيارة موقع', descriptionAr: 'العميل طلب زيارة قبل القرار النهائي', date: '2026-05-30T10:00:00Z', type: 'request' },
]

export const getInteractionsByCustomer = (customerId: string) =>
  INTERACTIONS.filter((i) => i.customerId === customerId)

export const getTimelineByCustomer = (customerId: string) =>
  TIMELINE_EVENTS.filter((e) => e.customerId === customerId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
