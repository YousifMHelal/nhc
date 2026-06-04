import {
  LayoutDashboard,
  GitBranch,
  Users,
  Star,
  Megaphone,
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
    accentClass: "text-brand",
    accentBgClass: "bg-brand/10",
    isStub: false,
  },
  {
    id: "pipeline",
    labelAr: AR.nav.pipeline,
    href: "/pipeline",
    icon: GitBranch,
    accentClass: "text-accent-pipeline",
    accentBgClass: "bg-success-bg",
    isStub: false,
  },
  {
    id: "customer-360",
    labelAr: AR.nav.customer360,
    href: "/customer-360",
    icon: Users,
    accentClass: "text-accent-customer360",
    accentBgClass: "bg-purple-bg",
    isStub: false,
  },
  {
    id: "lead-scoring",
    labelAr: AR.nav.leadScoring,
    href: "/lead-scoring",
    icon: Star,
    accentClass: "text-accent-lead-scoring",
    accentBgClass: "bg-warning-bg",
    isStub: false,
  },
  {
    id: "marketing",
    labelAr: AR.nav.marketing,
    href: "/marketing",
    icon: Megaphone,
    accentClass: "text-accent-marketing",
    accentBgClass: "bg-error-bg",
    isStub: true,
  },
  {
    id: "workflows",
    labelAr: AR.nav.workflows,
    href: "/workflows",
    icon: Workflow,
    accentClass: "text-accent-workflows",
    accentBgClass: "bg-warning-bg",
    isStub: true,
  },
  {
    id: "integrations",
    labelAr: AR.nav.integrations,
    href: "/integrations",
    icon: Plug,
    accentClass: "text-accent-integrations",
    accentBgClass: "bg-info-bg",
    isStub: true,
  },
  {
    id: "support",
    labelAr: AR.nav.support,
    href: "/support",
    icon: Headphones,
    accentClass: "text-accent-support",
    accentBgClass: "bg-success-bg",
    isStub: true,
  },
  {
    id: "reports",
    labelAr: AR.nav.reports,
    href: "/reports",
    icon: BarChart2,
    accentClass: "text-accent-reports",
    accentBgClass: "bg-purple-bg",
    isStub: true,
  },
];
