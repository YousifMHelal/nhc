import type { SalesRep } from '@/lib/types'

export const SALES_REPS: SalesRep[] = [
  { id: 'rep-001', nameAr: 'خالد الشمري', email: 'k.shamri@nhc.sa', phone: '0501234567', avatarInitials: 'خش', leads: 42, conversions: 18, revenue: 27_400_000, rank: 1, region: 'الرياض' },
  { id: 'rep-002', nameAr: 'نورة الغامدي', email: 'n.ghamdi@nhc.sa', phone: '0502345678', avatarInitials: 'نغ', leads: 38, conversions: 15, revenue: 22_100_000, rank: 2, region: 'جدة' },
  { id: 'rep-003', nameAr: 'فيصل العنزي', email: 'f.anazi@nhc.sa', phone: '0503456789', avatarInitials: 'فع', leads: 35, conversions: 13, revenue: 19_500_000, rank: 3, region: 'الرياض' },
  { id: 'rep-004', nameAr: 'سارة القرشي', email: 's.qurashi@nhc.sa', phone: '0504567890', avatarInitials: 'سق', leads: 31, conversions: 11, revenue: 16_800_000, rank: 4, region: 'الدمام' },
  { id: 'rep-005', nameAr: 'رشيد الزهراني', email: 'r.zahrani@nhc.sa', phone: '0505678901', avatarInitials: 'رز', leads: 28, conversions: 9, revenue: 13_200_000, rank: 5, region: 'جدة' },
  { id: 'rep-006', nameAr: 'أميرة الأسمري', email: 'a.asmari@nhc.sa', phone: '0506789012', avatarInitials: 'أأ', leads: 25, conversions: 8, revenue: 11_600_000, rank: 6, region: 'مكة المكرمة' },
  { id: 'rep-007', nameAr: 'طلال المطيري', email: 't.mutairi@nhc.sa', phone: '0507890123', avatarInitials: 'طم', leads: 22, conversions: 7, revenue: 10_400_000, rank: 7, region: 'الرياض' },
  { id: 'rep-008', nameAr: 'هند الشهراني', email: 'h.shahrani@nhc.sa', phone: '0508901234', avatarInitials: 'هش', leads: 19, conversions: 6, revenue: 8_700_000, rank: 8, region: 'الطائف' },
  { id: 'rep-009', nameAr: 'ماجد الدوسري', email: 'm.dosari@nhc.sa', phone: '0509012345', avatarInitials: 'مد', leads: 12, conversions: 4, revenue: 5_800_000, rank: 9, region: 'الرياض' },
]

export const getSalesRepById = (id: string): SalesRep | undefined =>
  SALES_REPS.find((r) => r.id === id)
