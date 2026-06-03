import type { Unit } from '@/lib/types'

export const UNITS: Unit[] = [
  // ── مشروع السدرة — الرياض ────────────────────────────────────────────────
  { id: 'SDR-V-042', project: 'مشروع السدرة', unitType: 'فيلا', bedrooms: 4, area: 380, floorLevel: 1, priceRiyal: 3_200_000, city: 'الرياض', status: 'Sold', features: ['حديقة', 'موقف مزدوج', 'غرفة سائق'], deliveryDate: '2026-03-01T00:00:00Z' },
  { id: 'SDR-V-089', project: 'مشروع السدرة', unitType: 'فيلا', bedrooms: 5, area: 450, floorLevel: 1, priceRiyal: 4_100_000, city: 'الرياض', status: 'Reserved', features: ['مسبح', 'حديقة', 'موقف مزدوج', 'غرفة سائق'], deliveryDate: '2026-08-01T00:00:00Z' },
  { id: 'SDR-V-112', project: 'مشروع السدرة', unitType: 'فيلا', bedrooms: 5, area: 500, floorLevel: 1, priceRiyal: 3_900_000, city: 'الرياض', status: 'Reserved', features: ['مسبح', 'حديقة خاصة', 'موقف ثلاثي'], deliveryDate: '2026-09-01T00:00:00Z' },
  { id: 'SDR-A-218', project: 'مشروع السدرة', unitType: 'شقة', bedrooms: 2, area: 130, floorLevel: 4, priceRiyal: 820_000, city: 'الرياض', status: 'Reserved', features: ['إطلالة حديقة', 'موقف مغطى'], deliveryDate: '2026-07-01T00:00:00Z' },
  { id: 'SDR-V-201', project: 'مشروع السدرة', unitType: 'فيلا', bedrooms: 4, area: 350, floorLevel: 1, priceRiyal: 2_950_000, city: 'الرياض', status: 'Available', features: ['حديقة', 'موقف مزدوج'], deliveryDate: '2026-10-01T00:00:00Z' },
  { id: 'SDR-TH-055', project: 'مشروع السدرة', unitType: 'تاون هاوس', bedrooms: 3, area: 220, floorLevel: 1, priceRiyal: 1_650_000, city: 'الرياض', status: 'Available', features: ['سطح خاص', 'موقف'], deliveryDate: '2026-11-01T00:00:00Z' },

  // ── مشروع الياسمين — جدة ────────────────────────────────────────────────
  { id: 'YSM-A-106', project: 'مشروع الياسمين', unitType: 'شقة', bedrooms: 2, area: 115, floorLevel: 6, priceRiyal: 680_000, city: 'جدة', status: 'Reserved', features: ['إطلالة بحر', 'موقف مغطى', 'أمن ٢٤ ساعة'], deliveryDate: '2026-06-30T00:00:00Z' },
  { id: 'YSM-A-201', project: 'مشروع الياسمين', unitType: 'شقة', bedrooms: 3, area: 160, floorLevel: 8, priceRiyal: 950_000, city: 'جدة', status: 'Available', features: ['إطلالة بحر', 'موقف مزدوج', 'مسبح مشترك'], deliveryDate: '2026-07-15T00:00:00Z' },
  { id: 'YSM-D-015', project: 'مشروع الياسمين', unitType: 'دوبلكس', bedrooms: 4, area: 280, floorLevel: 1, priceRiyal: 1_400_000, city: 'جدة', status: 'Available', features: ['حديقة صغيرة', 'موقف مزدوج'], deliveryDate: '2026-08-01T00:00:00Z' },

  // ── مشروع الفردوس — جدة ─────────────────────────────────────────────────
  { id: 'FRD-V-018', project: 'مشروع الفردوس', unitType: 'فيلا', bedrooms: 5, area: 480, floorLevel: 1, priceRiyal: 2_800_000, city: 'جدة', status: 'Sold', features: ['مسبح', 'حديقة كبيرة', 'غرفة سائق', 'موقف ثلاثي'], deliveryDate: '2026-04-01T00:00:00Z' },
  { id: 'FRD-V-031', project: 'مشروع الفردوس', unitType: 'فيلا', bedrooms: 4, area: 400, floorLevel: 1, priceRiyal: 2_500_000, city: 'جدة', status: 'Available', features: ['حديقة', 'موقف مزدوج'], deliveryDate: '2026-12-01T00:00:00Z' },
  { id: 'FRD-TH-009', project: 'مشروع الفردوس', unitType: 'تاون هاوس', bedrooms: 3, area: 210, floorLevel: 1, priceRiyal: 1_250_000, city: 'جدة', status: 'Available', features: ['سطح خاص', 'موقف'], deliveryDate: '2026-11-15T00:00:00Z' },

  // ── مشروع النخيل — الرياض ───────────────────────────────────────────────
  { id: 'NKL-TH-023', project: 'مشروع النخيل', unitType: 'تاون هاوس', bedrooms: 3, area: 230, floorLevel: 1, priceRiyal: 1_750_000, city: 'الرياض', status: 'Reserved', features: ['حديقة أمامية', 'سطح خاص', 'موقف'], deliveryDate: '2026-08-15T00:00:00Z' },
  { id: 'NKL-TH-047', project: 'مشروع النخيل', unitType: 'تاون هاوس', bedrooms: 4, area: 270, floorLevel: 1, priceRiyal: 2_100_000, city: 'الرياض', status: 'Available', features: ['حديقة', 'موقف مزدوج', 'مطبخ فاخر'], deliveryDate: '2026-10-01T00:00:00Z' },
  { id: 'NKL-A-088', project: 'مشروع النخيل', unitType: 'شقة', bedrooms: 2, area: 120, floorLevel: 3, priceRiyal: 750_000, city: 'الرياض', status: 'Available', features: ['موقف مغطى', 'مسبح مشترك'], deliveryDate: '2026-09-15T00:00:00Z' },

  // ── مشروع وادي الملك — الدمام ───────────────────────────────────────────
  { id: 'WDM-D-034', project: 'مشروع وادي الملك', unitType: 'دوبلكس', bedrooms: 4, area: 300, floorLevel: 1, priceRiyal: 1_380_000, city: 'الدمام', status: 'Reserved', features: ['حديقة', 'موقف'], deliveryDate: '2026-09-01T00:00:00Z' },
  { id: 'WDM-A-112', project: 'مشروع وادي الملك', unitType: 'شقة', bedrooms: 2, area: 110, floorLevel: 5, priceRiyal: 620_000, city: 'الدمام', status: 'Available', features: ['موقف مغطى', 'أمن ٢٤ ساعة'], deliveryDate: '2026-10-15T00:00:00Z' },
  { id: 'WDM-V-008', project: 'مشروع وادي الملك', unitType: 'فيلا', bedrooms: 4, area: 360, floorLevel: 1, priceRiyal: 2_200_000, city: 'الدمام', status: 'Available', features: ['حديقة', 'موقف مزدوج', 'مسبح خاص'], deliveryDate: '2026-12-01T00:00:00Z' },

  // ── مشروع الريف — أبها ──────────────────────────────────────────────────
  { id: 'REF-TH-055', project: 'مشروع الريف', unitType: 'تاون هاوس', bedrooms: 3, area: 240, floorLevel: 1, priceRiyal: 1_250_000, city: 'أبها', status: 'Reserved', features: ['إطلالة جبلية', 'حديقة', 'موقف'], deliveryDate: '2026-07-30T00:00:00Z' },
  { id: 'REF-V-019', project: 'مشروع الريف', unitType: 'فيلا', bedrooms: 5, area: 420, floorLevel: 1, priceRiyal: 1_900_000, city: 'أبها', status: 'Available', features: ['إطلالة جبلية', 'حديقة كبيرة', 'موقف مزدوج'], deliveryDate: '2026-11-01T00:00:00Z' },

  // ── مشروع البستان الأخضر — مكة المكرمة ──────────────────────────────────
  { id: 'BST-V-007', project: 'مشروع البستان الأخضر', unitType: 'فيلا', bedrooms: 6, area: 600, floorLevel: 1, priceRiyal: 4_800_000, city: 'مكة المكرمة', status: 'Sold', features: ['مسبح', 'حديقة واسعة', 'غرفة سائق', 'موقف رباعي'], deliveryDate: '2026-03-01T00:00:00Z' },
  { id: 'BST-V-012', project: 'مشروع البستان الأخضر', unitType: 'فيلا', bedrooms: 5, area: 480, floorLevel: 1, priceRiyal: 4_200_000, city: 'مكة المكرمة', status: 'Available', features: ['مسبح', 'حديقة', 'غرفة سائق', 'موقف ثلاثي'], deliveryDate: '2027-01-01T00:00:00Z' },
  { id: 'BST-A-045', project: 'مشروع البستان الأخضر', unitType: 'شقة', bedrooms: 3, area: 180, floorLevel: 10, priceRiyal: 1_100_000, city: 'مكة المكرمة', status: 'Available', features: ['إطلالة مميزة', 'موقف مزدوج', 'مسبح مشترك'], deliveryDate: '2026-09-01T00:00:00Z' },
]

export const getAvailableUnits = () => UNITS.filter((u) => u.status === 'Available')

export const getUnitById = (id: string) => UNITS.find((u) => u.id === id)
