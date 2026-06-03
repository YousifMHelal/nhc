import type { Contract } from '@/lib/types'

export const CONTRACTS: Contract[] = [
  {
    id: 'ctr-001',
    customerId: 'cust-004',
    opportunityId: 'opp-002',
    project: 'أمواج جدة',
    unitId: 'AMJ-V-0018',
    unitType: 'فيلا',
    valueRiyal: 3_200_000,
    status: 'Active',
    signedDate: '2026-05-14T14:00:00Z',
    startDate: '2026-07-01T00:00:00Z',
    endDate: '2028-07-01T00:00:00Z',
    paymentPlan: 'دفعة أولى ٢٠٪ + أقساط شهرية',
  },
  {
    id: 'ctr-002',
    customerId: 'cust-001',
    opportunityId: 'opp-001',
    project: 'سدير',
    unitId: 'SDR-V-0040',
    unitType: 'فيلا',
    valueRiyal: 2_380_000,
    status: 'Signed',
    signedDate: '2026-04-20T10:00:00Z',
    startDate: '2026-06-15T00:00:00Z',
    paymentPlan: 'دفعة أولى ٣٠٪ + تمويل بنك الراجحي',
  },
  {
    id: 'ctr-003',
    customerId: 'cust-009',
    opportunityId: 'opp-004',
    project: 'البيت الحرم',
    unitId: 'BHM-V-0001',
    unitType: 'فيلا',
    valueRiyal: 3_900_000,
    status: 'Draft',
    startDate: '2026-09-01T00:00:00Z',
    paymentPlan: 'دفعة نقدية كاملة',
  },
]

export const getContractsByCustomer = (customerId: string) =>
  CONTRACTS.filter((c) => c.customerId === customerId)
