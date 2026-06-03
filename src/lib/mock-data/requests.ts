import type { Request } from '@/lib/types'

export const REQUESTS: Request[] = [
  {
    id: 'req-001',
    customerId: 'cust-001',
    type: 'استفسار تمويل',
    descriptionAr: 'يرغب في الاستفسار عن خيارات التمويل العقاري المتاحة للوحدة',
    status: 'In Progress',
    priority: 'Medium',
    createdAt: '2026-05-20T09:00:00Z',
    assignedTo: 'rep-001',
  },
  {
    id: 'req-002',
    customerId: 'cust-004',
    type: 'طلب تعديل عقد',
    descriptionAr: 'طلب تعديل خطة السداد بعد توقيع العقد',
    status: 'Resolved',
    priority: 'High',
    createdAt: '2026-05-16T11:00:00Z',
    resolvedAt: '2026-05-18T14:00:00Z',
    assignedTo: 'rep-002',
  },
  {
    id: 'req-003',
    customerId: 'cust-006',
    type: 'طلب زيارة موقع',
    descriptionAr: 'طلب زيارة للمشروع قبل اتخاذ القرار النهائي',
    status: 'Open',
    priority: 'Low',
    createdAt: '2026-05-30T10:00:00Z',
    assignedTo: 'rep-001',
  },
  {
    id: 'req-004',
    customerId: 'cust-009',
    type: 'تقديم مستندات',
    descriptionAr: 'مطلوب تسليم صورة الهوية الوطنية ووثيقة الدخل',
    status: 'In Progress',
    priority: 'High',
    createdAt: '2026-06-01T08:00:00Z',
    assignedTo: 'rep-006',
  },
]

export const getRequestsByCustomer = (customerId: string) =>
  REQUESTS.filter((r) => r.customerId === customerId)
