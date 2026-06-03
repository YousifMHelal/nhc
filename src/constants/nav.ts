import {
  LayoutDashboard,
  GitBranch,
  Users,
  Star,
  Megaphone,
  Database,
  Workflow,
  Plug,
  Headphones,
  BarChart2,
  type LucideIcon,
} from 'lucide-react'
import type { AppRoute } from './routes'
import { AR } from './ar'

export interface NavItem {
  id: string
  labelAr: string
  href: AppRoute
  icon: LucideIcon
  accentClass: string
  accentBgClass: string
  isStub: boolean
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    labelAr: AR.nav.dashboard,
    href: "/dashboard",
    icon: LayoutDashboard,
    accentClass: "text-[#1B6CA8]",
    accentBgClass: "bg-blue-50",
    isStub: false,
  },
  {
    id: "pipeline",
    labelAr: AR.nav.pipeline,
    href: "/pipeline",
    icon: GitBranch,
    accentClass: "text-[#059669]",
    accentBgClass: "bg-emerald-50",
    isStub: false,
  },
  {
    id: "customer-360",
    labelAr: AR.nav.customer360,
    href: "/customer-360",
    icon: Users,
    accentClass: "text-[#7C3AED]",
    accentBgClass: "bg-violet-50",
    isStub: false,
  },
  {
    id: "lead-scoring",
    labelAr: AR.nav.leadScoring,
    href: "/lead-scoring",
    icon: Star,
    accentClass: "text-[#D97706]",
    accentBgClass: "bg-amber-50",
    isStub: false,
  },
  {
    id: "marketing",
    labelAr: AR.nav.marketing,
    href: "/marketing",
    icon: Megaphone,
    accentClass: "text-[#E11D48]",
    accentBgClass: "bg-rose-50",
    isStub: true,
  },
  {
    id: "workflows",
    labelAr: AR.nav.workflows,
    href: "/workflows",
    icon: Workflow,
    accentClass: "text-[#EA580C]",
    accentBgClass: "bg-orange-50",
    isStub: true,
  },
  {
    id: "integrations",
    labelAr: AR.nav.integrations,
    href: "/integrations",
    icon: Plug,
    accentClass: "text-[#0284C7]",
    accentBgClass: "bg-sky-50",
    isStub: true,
  },
  {
    id: "support",
    labelAr: AR.nav.support,
    href: "/support",
    icon: Headphones,
    accentClass: "text-[#0D9488]",
    accentBgClass: "bg-teal-50",
    isStub: true,
  },
  {
    id: "reports",
    labelAr: AR.nav.reports,
    href: "/reports",
    icon: BarChart2,
    accentClass: "text-[#4338CA]",
    accentBgClass: "bg-indigo-50",
    isStub: true,
  },
];
