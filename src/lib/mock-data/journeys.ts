import type { Journey } from '@/lib/types'

export const JOURNEYS: Journey[] = [
  {
    id: 'jrn-001',
    nameAr: 'رحلة العميل الجديد',
    descriptionAr: 'تسلسل ترحيبي تلقائي للعملاء المحتملين الجدد من الويب',
    status: 'Active',
    trigger: 'lead_created',
    enrolledCount: 68,
    completedCount: 24,
    createdAt: '2026-03-01T08:00:00Z',
    activatedAt: '2026-03-05T09:00:00Z',
    nodes: [
      { id: 'n1', type: 'trigger', position: { x: 100, y: 50 }, data: { labelAr: 'عميل جديد', type: 'trigger', config: { event: 'lead_created' } } },
      { id: 'n2', type: 'action', position: { x: 100, y: 150 }, data: { labelAr: 'إرسال رسالة ترحيب', subLabelAr: 'واتساب', type: 'action', config: { channel: 'WhatsApp', templateId: 'welcome' } } },
      { id: 'n3', type: 'delay', position: { x: 100, y: 250 }, data: { labelAr: 'انتظار ٢٤ ساعة', type: 'delay', config: { hours: 24 } } },
      { id: 'n4', type: 'condition', position: { x: 100, y: 350 }, data: { labelAr: 'هل تفاعل؟', type: 'condition', config: { check: 'opened_message' } } },
      { id: 'n5', type: 'action', position: { x: 200, y: 450 }, data: { labelAr: 'إرسال كتالوج المشاريع', subLabelAr: 'نعم — واتساب', type: 'action', config: { channel: 'WhatsApp', templateId: 'catalog' } } },
      { id: 'n6', type: 'action', position: { x: 0, y: 450 }, data: { labelAr: 'إعادة الإرسال بـ SMS', subLabelAr: 'لا', type: 'action', config: { channel: 'SMS', templateId: 'welcome_sms' } } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5', label: 'نعم', animated: true },
      { id: 'e5', source: 'n4', target: 'n6', label: 'لا' },
    ],
  },
  {
    id: 'jrn-002',
    nameAr: 'رحلة إعادة تفعيل العملاء',
    descriptionAr: 'تسلسل آلي للعملاء غير النشطين منذ أكثر من ٣٠ يوماً',
    status: 'Paused',
    trigger: 'inactive_30_days',
    enrolledCount: 42,
    completedCount: 15,
    createdAt: '2026-04-10T10:00:00Z',
    activatedAt: '2026-04-15T09:00:00Z',
    nodes: [
      { id: 'n1', type: 'trigger', position: { x: 100, y: 50 }, data: { labelAr: 'عدم نشاط ٣٠ يوم', type: 'trigger', config: { event: 'inactive_30_days' } } },
      { id: 'n2', type: 'action', position: { x: 100, y: 150 }, data: { labelAr: 'إرسال رسالة إعادة تفعيل', subLabelAr: 'SMS + Email', type: 'action', config: { channels: ['SMS', 'Email'], templateId: 'reactivate' } } },
      { id: 'n3', type: 'delay', position: { x: 100, y: 250 }, data: { labelAr: 'انتظار ٧٢ ساعة', type: 'delay', config: { hours: 72 } } },
      { id: 'n4', type: 'action', position: { x: 100, y: 350 }, data: { labelAr: 'تنبيه المندوب', subLabelAr: 'مكالمة يدوية', type: 'action', config: { assignTo: 'sales_rep', action: 'manual_call' } } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
    ],
  },
]

export const getJourneyById = (id: string) => JOURNEYS.find((j) => j.id === id)
