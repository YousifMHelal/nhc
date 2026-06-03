'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Zap,
  Play,
  GitBranch,
  Clock,
  Plus,
  Trash2,
  GripVertical,
  ArrowRight,
  Users,
  CheckCircle2,
  ChevronLeft,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { JOURNEYS } from '@/lib/mock-data'
import type { Journey, JourneyNode, JourneyNodeType, JourneyStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const NODE_META: Record<
  JourneyNodeType,
  {
    labelAr: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: React.FC<any>
    bg: string
    border: string
    text: string
  }
> = {
  trigger: {
    labelAr: 'حدث مشغِّل',
    icon: Zap,
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-700',
  },
  action: {
    labelAr: 'إجراء',
    icon: Play,
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
  },
  condition: {
    labelAr: 'شرط',
    icon: GitBranch,
    bg: 'bg-violet-50',
    border: 'border-violet-300',
    text: 'text-violet-700',
  },
  delay: {
    labelAr: 'تأخير',
    icon: Clock,
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-600',
  },
}

const TRIGGER_TYPES = [
  { id: 'lead_created', labelAr: 'عميل جديد' },
  { id: 'inactive_30_days', labelAr: 'عدم نشاط ٣٠ يوماً' },
  { id: 'stage_changed', labelAr: 'تغيير المرحلة' },
  { id: 'contract_signed', labelAr: 'توقيع العقد' },
  { id: 'scheduled', labelAr: 'مجدول' },
]

const ACTION_TEMPLATES: { labelAr: string; subLabelAr: string; type: JourneyNodeType }[] = [
  { labelAr: 'إرسال رسالة', subLabelAr: 'WhatsApp / SMS / Email', type: 'action' },
  { labelAr: 'تعيين مندوب', subLabelAr: 'تحويل العميل لمندوب مبيعات', type: 'action' },
  { labelAr: 'تحديث الحالة', subLabelAr: 'تغيير مرحلة العميل في المسار', type: 'action' },
  { labelAr: 'انتظار X أيام', subLabelAr: 'تأخير قبل الخطوة التالية', type: 'delay' },
  { labelAr: 'شرط تفرعي', subLabelAr: 'نعم / لا بناءً على سلوك العميل', type: 'condition' },
]

const STATUS_STYLES: Record<JourneyStatus, string> = {
  Draft: 'bg-slate-100 text-slate-600',
  Active: 'bg-emerald-100 text-emerald-700',
  Paused: 'bg-amber-100 text-amber-700',
  Completed: 'bg-violet-100 text-violet-700',
}

const STATUS_LABELS_AR: Record<JourneyStatus, string> = {
  Draft: 'مسودة',
  Active: 'نشطة',
  Paused: 'متوقفة',
  Completed: 'مكتملة',
}

// ─── Node Card (Sortable) ─────────────────────────────────────────────────────

function SortableNodeCard({
  node,
  onDelete,
  canDelete,
}: {
  node: JourneyNode
  onDelete: (id: string) => void
  canDelete: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const meta = NODE_META[node.type]
  const Icon = meta.icon

  return (
    <div ref={setNodeRef} style={style} className={cn('select-none', isDragging && 'opacity-40')}>
      <div
        className={cn(
          'rounded-xl border-2 p-4 transition-shadow',
          meta.bg,
          meta.border,
          isDragging ? 'shadow-lg' : 'shadow-sm'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          <button
            className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground shrink-0"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>

          {/* Icon */}
          <div
            className={cn(
              'flex size-9 items-center justify-center rounded-lg border shrink-0',
              meta.bg,
              meta.border
            )}
          >
            <Icon className={cn('size-4', meta.text)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-semibold uppercase tracking-wide', meta.text)}>
                {meta.labelAr}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground mt-0.5 leading-snug">
              {node.data.labelAr}
            </p>
            {node.data.subLabelAr && (
              <p className="text-xs text-muted-foreground mt-0.5">{node.data.subLabelAr}</p>
            )}
          </div>

          {/* Delete */}
          {canDelete && (
            <button
              onClick={() => onDelete(node.id)}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground/50 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>

        {/* Condition branches */}
        {node.type === 'condition' && (
          <div className="mt-3 ms-10 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center">
              <span className="text-xs font-semibold text-emerald-700">✓ نعم</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">المسار الإيجابي</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center">
              <span className="text-xs font-semibold text-red-700">✗ لا</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">المسار البديل</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Add Node Button ──────────────────────────────────────────────────────────

function AddNodeButton({ onAdd }: { onAdd: (template: (typeof ACTION_TEMPLATES)[0]) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative flex justify-center">
      {/* Vertical connector */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-border" />

      <div className="relative z-10 py-1">
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'flex items-center gap-1 rounded-full border-2 bg-background px-3 py-1 text-xs font-medium transition-all shadow-sm',
            open
              ? 'border-accent-workflows text-accent-workflows'
              : 'border-border text-muted-foreground hover:border-accent-workflows/50 hover:text-accent-workflows'
          )}
        >
          <Plus className="size-3" />
          إضافة خطوة
        </button>

        {open && (
          <div className="absolute top-full mt-2 start-1/2 -translate-x-1/2 z-20 w-64 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
            {ACTION_TEMPLATES.map((t, i) => {
              const meta = NODE_META[t.type]
              const Icon = meta.icon
              return (
                <button
                  key={i}
                  onClick={() => {
                    onAdd(t)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-start hover:bg-muted/60 transition-colors"
                >
                  <div
                    className={cn(
                      'flex size-7 items-center justify-center rounded-lg border',
                      meta.bg,
                      meta.border
                    )}
                  >
                    <Icon className={cn('size-3.5', meta.text)} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{t.labelAr}</p>
                    <p className="text-[10px] text-muted-foreground">{t.subLabelAr}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Journey Canvas ───────────────────────────────────────────────────────────

function JourneyCanvas({
  journey,
  onBack,
}: {
  journey: Journey
  onBack: () => void
}) {
  const [nodes, setNodes] = useState<JourneyNode[]>(journey.nodes)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const activeNode = activeId ? nodes.find((n) => n.id === activeId) : null

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(e.active.id as string)
  }, [])

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over || active.id === over.id) return
    setNodes((prev) => {
      const from = prev.findIndex((n) => n.id === active.id)
      const to = prev.findIndex((n) => n.id === over.id)
      return arrayMove(prev, from, to)
    })
  }, [])

  const handleDelete = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const handleAddNode = useCallback(
    (template: (typeof ACTION_TEMPLATES)[0], afterIndex: number) => {
      const newNode: JourneyNode = {
        id: `n-${Date.now()}`,
        type: template.type,
        position: { x: 100, y: afterIndex * 100 },
        data: {
          labelAr: template.labelAr,
          subLabelAr: template.subLabelAr,
          type: template.type,
          config: {},
        },
      }
      setNodes((prev) => {
        const next = [...prev]
        next.splice(afterIndex + 1, 0, newNode)
        return next
      })
    },
    []
  )

  const completionRate = journey.enrolledCount
    ? Math.round((journey.completedCount / journey.enrolledCount) * 100)
    : 0

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="size-8">
            <ChevronLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-accent-workflows">{journey.nameAr}</h1>
            {journey.descriptionAr && (
              <p className="text-sm text-muted-foreground mt-0.5">{journey.descriptionAr}</p>
            )}
          </div>
        </div>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold',
            STATUS_STYLES[journey.status]
          )}
        >
          {STATUS_LABELS_AR[journey.status]}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            labelAr: 'عدد العقد',
            value: nodes.length,
            icon: GitBranch,
            color: 'text-accent-workflows bg-accent-workflows/10',
          },
          {
            labelAr: 'العملاء المسجَّلون',
            value: journey.enrolledCount,
            icon: Users,
            color: 'text-blue-600 bg-blue-50',
          },
          {
            labelAr: 'معدل الإكمال',
            value: `${completionRate}%`,
            icon: CheckCircle2,
            color: 'text-emerald-600 bg-emerald-50',
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.labelAr}
              className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"
            >
              <div className={cn('flex size-10 items-center justify-center rounded-xl', stat.color)}>
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-xl font-bold leading-none">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.labelAr}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Canvas */}
      <div className="flex gap-6">
        {/* Node list */}
        <div className="flex-1 max-w-lg">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={nodes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col">
                {nodes.map((node, i) => (
                  <div key={node.id}>
                    <SortableNodeCard
                      node={node}
                      onDelete={handleDelete}
                      canDelete={node.type !== 'trigger'}
                    />
                    <AddNodeButton onAdd={(t) => handleAddNode(t, i)} />
                  </div>
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeNode && (
                <div
                  className={cn(
                    'rounded-xl border-2 p-4 shadow-2xl opacity-90 rotate-1',
                    NODE_META[activeNode.type].bg,
                    NODE_META[activeNode.type].border
                  )}
                >
                  <p className="text-sm font-semibold">{activeNode.data.labelAr}</p>
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {/* End marker */}
          <div className="flex justify-center mt-2">
            <div className="flex flex-col items-center gap-1">
              <div className="w-0.5 h-6 bg-border" />
              <div className="rounded-full border-2 border-dashed border-border px-4 py-1.5 text-xs text-muted-foreground">
                نهاية الرحلة
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="w-52 shrink-0">
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 sticky top-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              أنواع العقد
            </p>
            {(Object.entries(NODE_META) as [JourneyNodeType, (typeof NODE_META)[JourneyNodeType]][]).map(
              ([type, meta]) => {
                const Icon = meta.icon
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div
                      className={cn(
                        'flex size-7 items-center justify-center rounded-lg border',
                        meta.bg,
                        meta.border
                      )}
                    >
                      <Icon className={cn('size-3.5', meta.text)} />
                    </div>
                    <span className="text-xs font-medium">{meta.labelAr}</span>
                  </div>
                )
              }
            )}
            <div className="border-t border-border pt-3 text-xs text-muted-foreground leading-relaxed">
              اسحب العقد لإعادة ترتيبها. انقر على{' '}
              <span className="font-medium text-foreground">إضافة خطوة</span> لإضافة عقدة جديدة.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Journey Card ─────────────────────────────────────────────────────────────

function JourneyCard({
  journey,
  onSelect,
}: {
  journey: Journey
  onSelect: (j: Journey) => void
}) {
  const completionRate = journey.enrolledCount
    ? Math.round((journey.completedCount / journey.enrolledCount) * 100)
    : 0

  const triggerLabel =
    TRIGGER_TYPES.find((t) => t.id === journey.trigger)?.labelAr ?? journey.trigger

  return (
    <button
      onClick={() => onSelect(journey)}
      className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4 hover:shadow-md hover:border-accent-workflows/30 transition-all text-start w-full"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug">{journey.nameAr}</p>
          {journey.descriptionAr && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {journey.descriptionAr}
            </p>
          )}
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0',
            STATUS_STYLES[journey.status]
          )}
        >
          {STATUS_LABELS_AR[journey.status]}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Zap className="size-3.5 text-amber-500" />
          <span>{triggerLabel}</span>
        </div>
        <span>•</span>
        <span>{journey.nodes.length} عقدة</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/60 p-2.5 text-center">
          <p className="text-base font-bold">{journey.enrolledCount}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">مسجَّل</p>
        </div>
        <div className="rounded-lg bg-muted/60 p-2.5 text-center">
          <p className="text-base font-bold text-emerald-600">{completionRate}%</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">معدل الإكمال</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
        <span>
          {new Date(journey.createdAt).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
        <ArrowRight className="size-3.5 text-accent-workflows" />
      </div>
    </button>
  )
}

// ─── New Journey Dialog ───────────────────────────────────────────────────────

function NewJourneyDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (j: Journey) => void
}) {
  const [nameAr, setNameAr] = useState('')
  const [trigger, setTrigger] = useState(TRIGGER_TYPES[0].id)

  const handleCreate = () => {
    if (!nameAr.trim()) return
    const triggerLabel =
      TRIGGER_TYPES.find((t) => t.id === trigger)?.labelAr ?? 'حدث مشغِّل'
    const journey: Journey = {
      id: `jrn-${Date.now()}`,
      nameAr: nameAr.trim(),
      descriptionAr: '',
      status: 'Draft',
      trigger,
      enrolledCount: 0,
      completedCount: 0,
      createdAt: new Date().toISOString(),
      nodes: [
        {
          id: 'n1',
          type: 'trigger',
          position: { x: 100, y: 50 },
          data: {
            labelAr: triggerLabel,
            type: 'trigger',
            config: { event: trigger },
          },
        },
      ],
      edges: [],
    }
    onCreate(journey)
    setNameAr('')
    setTrigger(TRIGGER_TYPES[0].id)
    onClose()
  }

  const selectCls =
    'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring'

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>إنشاء رحلة عميل جديدة</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">اسم الرحلة *</label>
            <Input
              placeholder="مثال: رحلة إعادة تفعيل العملاء"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">الحدث المشغِّل</label>
            <select
              className={selectCls}
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
            >
              {TRIGGER_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.labelAr}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              ستبدأ الرحلة تلقائياً عند حدوث هذا الحدث
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            className="bg-accent-workflows hover:bg-accent-workflows/90 text-white"
            onClick={handleCreate}
            disabled={!nameAr.trim()}
          >
            إنشاء الرحلة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Journeys List View ───────────────────────────────────────────────────────

function JourneysListView({
  journeys,
  onSelect,
  onNew,
}: {
  journeys: Journey[]
  onSelect: (j: Journey) => void
  onNew: () => void
}) {
  const active = journeys.filter((j) => j.status === 'Active').length
  const totalEnrolled = journeys.reduce((s, j) => s + j.enrolledCount, 0)
  const totalCompleted = journeys.reduce((s, j) => s + j.completedCount, 0)
  const avgCompletion = totalEnrolled
    ? Math.round((totalCompleted / totalEnrolled) * 100)
    : 0

  const summary = [
    {
      labelAr: 'إجمالي الرحلات',
      value: journeys.length,
      icon: GitBranch,
      color: 'text-accent-workflows bg-accent-workflows/10',
    },
    {
      labelAr: 'الرحلات النشطة',
      value: active,
      icon: Zap,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      labelAr: 'العملاء المسجَّلون',
      value: totalEnrolled,
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      labelAr: 'متوسط الإكمال',
      value: `${avgCompletion}%`,
      icon: CheckCircle2,
      color: 'text-violet-600 bg-violet-50',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-accent-workflows">رحلات العملاء</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{journeys.length} رحلة إجمالاً</p>
        </div>
        <Button
          className="bg-accent-workflows hover:bg-accent-workflows/90 text-white gap-1.5"
          onClick={onNew}
        >
          <Plus className="size-4" />
          إنشاء رحلة جديدة
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {summary.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.labelAr}
              className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"
            >
              <div className={cn('flex size-11 items-center justify-center rounded-xl', card.color)}>
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.labelAr}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {journeys.map((j) => (
          <JourneyCard key={j.id} journey={j} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkflowsPage() {
  const [journeys, setJourneys] = useState<Journey[]>(JOURNEYS)
  const [selected, setSelected] = useState<Journey | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleCreate = (j: Journey) => {
    setJourneys((prev) => [j, ...prev])
    setSelected(j)
  }

  if (selected) {
    return <JourneyCanvas journey={selected} onBack={() => setSelected(null)} />
  }

  return (
    <>
      <JourneysListView
        journeys={journeys}
        onSelect={setSelected}
        onNew={() => setDialogOpen(true)}
      />
      <NewJourneyDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={handleCreate}
      />
    </>
  )
}
