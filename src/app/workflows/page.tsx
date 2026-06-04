'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  type OnConnect,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  Zap, Play, GitBranch, Clock, Plus, Trash2,
  ChevronLeft, Users, CheckCircle2, X, Save, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { Journey, JourneyNodeType, JourneyStatus } from '@/lib/types'
import { cn, toAr } from '@/lib/utils'
import { readApiError } from '@/lib/client-validation'
import { WorkflowsPageSkeleton } from '@/components/shared/skeleton-card'

// ─── Node type meta ────────────────────────────────────────────────────────────

const NODE_META: Record<JourneyNodeType, { labelAr: string; icon: React.FC<{ className?: string }>; bg: string; border: string; text: string; header: string }> = {
  trigger:   { labelAr: 'مشغِّل',  icon: Zap,       bg: 'bg-amber-50',  border: 'border-amber-300', text: 'text-amber-700',  header: 'bg-amber-100' },
  action:    { labelAr: 'إجراء',    icon: Play,      bg: 'bg-blue-50',   border: 'border-blue-300',  text: 'text-blue-700',   header: 'bg-blue-100' },
  condition: { labelAr: 'شرط',      icon: GitBranch, bg: 'bg-violet-50', border: 'border-violet-300',text: 'text-violet-700', header: 'bg-violet-100' },
  delay:     { labelAr: 'تأخير',    icon: Clock,     bg: 'bg-slate-50',  border: 'border-slate-300', text: 'text-slate-600',  header: 'bg-slate-100' },
}

const STATUS_STYLES: Record<JourneyStatus, string> = {
  Draft: 'bg-slate-100 text-slate-600', Active: 'bg-emerald-100 text-emerald-700',
  Paused: 'bg-amber-100 text-amber-700', Completed: 'bg-violet-100 text-violet-700',
}
const STATUS_LABELS_AR: Record<JourneyStatus, string> = {
  Draft: 'مسودة', Active: 'نشطة', Paused: 'متوقفة', Completed: 'مكتملة',
}

const PALETTE_ITEMS = [
  { type: 'trigger' as JourneyNodeType, labelAr: 'عميل جديد', subLabelAr: 'عند إضافة عميل' },
  { type: 'trigger' as JourneyNodeType, labelAr: 'عدم نشاط', subLabelAr: 'خمول ٣٠ يوماً' },
  { type: 'trigger' as JourneyNodeType, labelAr: 'موعد مجدول', subLabelAr: 'في تاريخ محدد' },
  { type: 'action' as JourneyNodeType, labelAr: 'إرسال واتساب', subLabelAr: 'رسالة WhatsApp' },
  { type: 'action' as JourneyNodeType, labelAr: 'إرسال SMS', subLabelAr: 'رسالة نصية' },
  { type: 'action' as JourneyNodeType, labelAr: 'إرسال بريد', subLabelAr: 'بريد إلكتروني' },
  { type: 'action' as JourneyNodeType, labelAr: 'تعيين مندوب', subLabelAr: 'تحويل العميل' },
  { type: 'action' as JourneyNodeType, labelAr: 'تحديث الحالة', subLabelAr: 'تغيير مرحلة' },
  { type: 'condition' as JourneyNodeType, labelAr: 'AI Score > N', subLabelAr: 'تحقق من الدرجة' },
  { type: 'condition' as JourneyNodeType, labelAr: 'فتح البريد', subLabelAr: 'هل تفاعل؟' },
  { type: 'condition' as JourneyNodeType, labelAr: 'نوع العقار', subLabelAr: 'اختبار الاهتمام' },
  { type: 'delay' as JourneyNodeType, labelAr: 'انتظار X أيام', subLabelAr: 'تأخير الخطوة' },
  { type: 'delay' as JourneyNodeType, labelAr: 'انتظار يوم عمل', subLabelAr: 'حتى يوم الأسبوع' },
]

// ─── Custom Node ──────────────────────────────────────────────────────────────

function CustomNode({ data, selected }: NodeProps) {
  const meta = NODE_META[data.type as JourneyNodeType] ?? NODE_META['action']
  const Icon = meta.icon

  return (
    <div className={cn('rounded-xl border-2 min-w-[180px] shadow-sm transition-all', meta.bg, meta.border, selected && 'shadow-lg ring-2 ring-offset-1 ring-brand')}>
      {/* Header */}
      <div className={cn('flex items-center gap-2 px-3 py-2 rounded-t-[9px]', meta.header)}>
        <Icon className={cn('size-3.5 shrink-0', meta.text)} />
        <span className={cn('text-[10px] font-semibold uppercase tracking-wide', meta.text)}>{meta.labelAr}</span>
      </div>
      {/* Body */}
      <div className="px-3 py-2.5">
        <p className="text-sm font-semibold text-foreground leading-snug">{data.labelAr}</p>
        {data.subLabelAr && <p className="text-xs text-muted-foreground mt-0.5">{data.subLabelAr}</p>}
      </div>
      {/* Condition branches */}
      {data.type === 'condition' && (
        <div className="px-3 pb-3 grid grid-cols-2 gap-1.5">
          <div className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-center">
            <span className="text-[10px] font-bold text-emerald-700">✓ نعم</span>
          </div>
          <div className="rounded border border-red-200 bg-red-50 px-2 py-1 text-center">
            <span className="text-[10px] font-bold text-red-700">✗ لا</span>
          </div>
        </div>
      )}
    </div>
  )
}

const nodeTypes = { trigger: CustomNode, action: CustomNode, condition: CustomNode, delay: CustomNode }

// ─── Journey Canvas ───────────────────────────────────────────────────────────

function journeyToFlow(journey: Journey): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = journey.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: { ...n.data, type: n.type },
  }))
  const edges: Edge[] = journey.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: e.animated ?? false,
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-brand)' },
    style: { stroke: 'var(--color-brand)', strokeWidth: 2 },
  }))
  return { nodes, edges }
}

function JourneyCanvas({ journey, onBack }: { journey: Journey; onBack: () => void }) {
  const { nodes: initNodes, edges: initEdges } = journeyToFlow(journey)
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(journey.status === 'Active')
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<{ project: (pos: { x: number; y: number }) => { x: number; y: number } } | null>(null)

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({
        ...params,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-brand)' },
        style: { stroke: 'var(--color-brand)', strokeWidth: 2 },
      }, eds))
    },
    [setEdges]
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const raw = e.dataTransfer.getData('application/reactflow')
      if (!raw || !reactFlowInstance) return
      const item = JSON.parse(raw) as (typeof PALETTE_ITEMS)[0]
      const bounds = reactFlowWrapper.current?.getBoundingClientRect()
      const pos = reactFlowInstance.project({ x: e.clientX - (bounds?.left ?? 0), y: e.clientY - (bounds?.top ?? 0) })
      const newNode: Node = {
        id: `n-${Date.now()}`,
        type: item.type,
        position: pos,
        data: { labelAr: item.labelAr, subLabelAr: item.subLabelAr, type: item.type, config: {} },
      }
      setNodes((nds) => [...nds, newNode])
      toast.success(`تم إضافة عقدة "${item.labelAr}"`)
    },
    [reactFlowInstance, setNodes]
  )

  const deleteSelected = () => {
    if (!selectedNodeId) return
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId))
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId))
    setSelectedNodeId(null)
    toast.success('تم حذف العقدة')
  }

  const handleSave = async () => {
    try {
      await fetch(`/api/journeys/${journey.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes,
          edges,
          status: isActive ? 'Active' : 'Draft',
        }),
      })
      toast.success('تم حفظ الرحلة بنجاح')
    } catch {
      toast.error('فشل حفظ الرحلة')
    }
  }

  const completionRate = journey.enrolledCount
    ? Math.round((journey.completedCount / journey.enrolledCount) * 100) : 0

  return (
    <div className="flex flex-col h-full gap-0" style={{ height: 'calc(100vh - 140px)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="size-8"><ChevronLeft className="size-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">{journey.nameAr}</h1>
            {journey.descriptionAr && <p className="text-xs text-muted-foreground">{journey.descriptionAr}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setIsActive((a) => !a); toast.success(isActive ? 'تم إيقاف الرحلة' : 'تم تفعيل الرحلة') }}
            className={cn('flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all border',
              isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200')}
          >
            {isActive ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
            {isActive ? 'نشطة' : 'معطَّلة'}
          </button>
          <Button size="sm" className="bg-brand hover:bg-brand/90 text-white gap-1.5" onClick={handleSave}>
            <Save className="size-4" />حفظ
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {[
          { labelAr: 'عدد العقد', value: toAr(nodes.length), icon: GitBranch, color: 'text-accent-workflows bg-accent-workflows/10' },
          { labelAr: 'مسجَّلون', value: toAr(journey.enrolledCount), icon: Users, color: 'text-blue-600 bg-blue-50' },
          { labelAr: 'معدل الإكمال', value: `${toAr(completionRate)}٪`, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.labelAr} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
              <div className={cn('flex size-9 items-center justify-center rounded-lg', s.color)}><Icon className="size-4" /></div>
              <div><p className="text-lg font-bold leading-none font-inter">{s.value}</p><p className="text-xs text-muted-foreground mt-0.5">{s.labelAr}</p></div>
            </div>
          )
        })}
      </div>

      {/* Canvas area */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Left palette */}
        <div className="lg:w-40 shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:overflow-x-visible pb-2 lg:pb-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">مكتبة العقد</p>
          {(['trigger', 'action', 'condition', 'delay'] as JourneyNodeType[]).map((type) => {
            const meta = NODE_META[type]
            const Icon = meta.icon
            const items = PALETTE_ITEMS.filter((p) => p.type === type)
            return (
              <div key={type} className="flex flex-col gap-1">
                <p className={cn('text-[10px] font-semibold uppercase tracking-wide px-1', meta.text)}>{meta.labelAr}</p>
                {items.map((item) => (
                  <div
                    key={item.labelAr}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('application/reactflow', JSON.stringify(item))}
                    className={cn('rounded-lg border-2 p-2 cursor-grab active:cursor-grabbing transition-all hover:shadow-sm', meta.bg, meta.border)}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className={cn('size-3 shrink-0', meta.text)} />
                      <p className="text-[10px] font-semibold leading-tight">{item.labelAr}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* ReactFlow canvas */}
        <div className="flex-1 min-h-75 lg:min-h-0 rounded-xl border border-border overflow-hidden bg-bg-page" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onInit={(inst) => setReactFlowInstance(inst as typeof reactFlowInstance)}
            onNodeClick={(_, node) => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode="Delete"
            proOptions={{ hideAttribution: true }}
          >
            <Background color="var(--color-brand-accent)" gap={20} size={1} />
            <Controls />
            <MiniMap nodeColor={(n) => {
              const meta = NODE_META[n.type as JourneyNodeType]
              return meta ? meta.text.replace('text-', '') : 'var(--color-neutral)'
            }} />
          </ReactFlow>
        </div>

        {/* Right properties panel */}
        <div className="lg:w-52 shrink-0 flex flex-col gap-3">
          {selectedNode ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">خصائص العقدة</p>
                <button onClick={() => setSelectedNodeId(null)}><X className="size-3.5 text-muted-foreground" /></button>
              </div>
              <div className={cn('rounded-xl border-2 p-3', NODE_META[selectedNode.type as JourneyNodeType]?.bg, NODE_META[selectedNode.type as JourneyNodeType]?.border)}>
                <p className={cn('text-xs font-semibold mb-1', NODE_META[selectedNode.type as JourneyNodeType]?.text)}>
                  {NODE_META[selectedNode.type as JourneyNodeType]?.labelAr}
                </p>
                <p className="text-sm font-bold text-foreground">{selectedNode.data.labelAr as string}</p>
                {(selectedNode.data.subLabelAr as string | undefined) && (
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedNode.data.subLabelAr as string}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">التسمية</label>
                  <Input
                    className="h-8 text-xs"
                    value={selectedNode.data.labelAr as string}
                    onChange={(e) => setNodes((nds) => nds.map((n) => n.id === selectedNodeId ? { ...n, data: { ...n.data, labelAr: e.target.value } } : n))}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">التسمية الفرعية</label>
                  <Input
                    className="h-8 text-xs"
                    value={(selectedNode.data.subLabelAr as string | undefined) ?? ''}
                    onChange={(e) => setNodes((nds) => nds.map((n) => n.id === selectedNodeId ? { ...n, data: { ...n.data, subLabelAr: e.target.value } } : n))}
                  />
                </div>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs text-danger border-danger/30 hover:bg-danger/5 w-full mt-1" onClick={deleteSelected}>
                  <Trash2 className="size-3.5" />حذف العقدة
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">تعليمات</p>
              <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 text-xs text-muted-foreground leading-relaxed">
                <p><strong className="text-foreground">إضافة عقدة:</strong> اسحبها من القائمة الجانبية وأفلتها على اللوحة.</p>
                <p><strong className="text-foreground">ربط عقدتين:</strong> اسحب من نقطة توصيل العقدة الأولى إلى الثانية.</p>
                <p><strong className="text-foreground">تعديل عقدة:</strong> انقر عليها لفتح لوحة الخصائص.</p>
                <p><strong className="text-foreground">حذف عقدة:</strong> حددها ثم اضغط Delete أو استخدم زر الحذف.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Journey Card ─────────────────────────────────────────────────────────────

function JourneyCard({ journey, onSelect }: { journey: Journey; onSelect: (j: Journey) => void }) {
  const completionRate = journey.enrolledCount ? Math.round((journey.completedCount / journey.enrolledCount) * 100) : 0
  return (
    <button onClick={() => onSelect(journey)} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4 hover:shadow-md hover:border-accent-workflows/30 transition-all text-start w-full">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug">{journey.nameAr}</p>
          {journey.descriptionAr && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{journey.descriptionAr}</p>}
        </div>
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0', STATUS_STYLES[journey.status])}>{STATUS_LABELS_AR[journey.status]}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><Zap className="size-3.5 text-amber-500" /><span>{toAr(journey.nodes.length)} عقدة</span></div>
        <span>•</span>
        <span>{toAr(journey.enrolledCount)} مسجَّل</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/60 p-2.5 text-center">
          <p className="text-base font-bold font-inter">{toAr(journey.enrolledCount)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">مسجَّل</p>
        </div>
        <div className="rounded-lg bg-muted/60 p-2.5 text-center">
          <p className="text-base font-bold text-emerald-600 font-inter">{toAr(completionRate)}٪</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">معدل الإكمال</p>
        </div>
      </div>
    </button>
  )
}

// ─── New Journey Dialog ───────────────────────────────────────────────────────

const TRIGGER_TYPES = [
  { id: 'lead_created', labelAr: 'عميل جديد' }, { id: 'inactive_30_days', labelAr: 'عدم نشاط ٣٠ يوماً' },
  { id: 'stage_changed', labelAr: 'تغيير المرحلة' }, { id: 'contract_signed', labelAr: 'توقيع العقد' },
  { id: 'scheduled', labelAr: 'مجدول' },
]

function NewJourneyDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (j: Journey) => Promise<void> }) {
  const [nameAr, setNameAr] = useState('')
  const [trigger, setTrigger] = useState(TRIGGER_TYPES[0].id)

  const handleCreate = async () => {
    if (!nameAr.trim()) return
    const triggerLabel = TRIGGER_TYPES.find((t) => t.id === trigger)?.labelAr ?? 'حدث مشغِّل'
    const journey: Journey = {
      id: `jrn-${Date.now()}`, nameAr: nameAr.trim(), descriptionAr: '', status: 'Draft',
      trigger, enrolledCount: 0, completedCount: 0, createdAt: new Date().toISOString(),
      nodes: [{ id: 'n1', type: 'trigger', position: { x: 250, y: 80 }, data: { labelAr: triggerLabel, type: 'trigger', config: { event: trigger } } }],
      edges: [],
    }
    await onCreate(journey)
    setNameAr(''); setTrigger(TRIGGER_TYPES[0].id); onClose()
    toast.success(`تم إنشاء رحلة "${journey.nameAr}"`)
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-card border border-border shadow-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between"><h3 className="text-sm font-bold">إنشاء رحلة عميل جديدة</h3><button onClick={onClose}><X className="size-4" /></button></div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">اسم الرحلة *</label>
          <Input placeholder="مثال: رحلة إعادة تفعيل العملاء" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">الحدث المشغِّل</label>
          <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={trigger} onChange={(e) => setTrigger(e.target.value)}>
            {TRIGGER_TYPES.map((t) => <option key={t.id} value={t.id}>{t.labelAr}</option>)}
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button className="bg-accent-workflows hover:bg-accent-workflows/90 text-white" onClick={handleCreate} disabled={!nameAr.trim()}>إنشاء الرحلة</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkflowsPage() {
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Journey | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetch('/api/journeys')
      .then((r) => r.json())
      .then((data) => setJourneys(data))
      .catch(() => toast.error('فشل تحميل الرحلات'))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async (j: Journey) => {
    try {
      const res = await fetch('/api/journeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(j),
      })
      if (!res.ok) {
        toast.error(await readApiError(res, 'فشل إنشاء الرحلة'))
        return
      }
      const saved: Journey = await res.json()
      setJourneys((prev) => [saved, ...prev])
      setSelected(saved)
    } catch {
      toast.error('فشل إنشاء الرحلة')
    }
  }

  if (selected) return <JourneyCanvas journey={selected} onBack={() => setSelected(null)} />

  if (loading) return <WorkflowsPageSkeleton />

  const active = journeys.filter((j) => j.status === 'Active').length
  const totalEnrolled = journeys.reduce((s, j) => s + j.enrolledCount, 0)
  const totalCompleted = journeys.reduce((s, j) => s + j.completedCount, 0)
  const avgCompletion = totalEnrolled ? Math.round((totalCompleted / totalEnrolled) * 100) : 0

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">رحلات العملاء</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{toAr(journeys.length)} رحلة إجمالاً</p>
          </div>
          <Button className="bg-accent-workflows hover:bg-accent-workflows/90 text-white gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />إنشاء رحلة جديدة
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { labelAr: 'إجمالي الرحلات', value: toAr(journeys.length), icon: GitBranch, color: 'text-accent-workflows bg-accent-workflows/10' },
            { labelAr: 'الرحلات النشطة', value: toAr(active), icon: Zap, color: 'text-emerald-600 bg-emerald-50' },
            { labelAr: 'مسجَّلون', value: toAr(totalEnrolled), icon: Users, color: 'text-blue-600 bg-blue-50' },
            { labelAr: 'متوسط الإكمال', value: `${toAr(avgCompletion)}٪`, icon: CheckCircle2, color: 'text-violet-600 bg-violet-50' },
          ].map((card) => {
            const Icon = card.icon
            return (
              <div key={card.labelAr} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <div className={cn('flex size-11 items-center justify-center rounded-xl', card.color)}><Icon className="size-5" /></div>
                <div><p className="text-2xl font-bold leading-none font-inter">{card.value}</p><p className="text-xs text-muted-foreground mt-1">{card.labelAr}</p></div>
              </div>
            )
          })}
        </div>

        {journeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-96 gap-4 text-muted-foreground">
            <div className="flex size-20 items-center justify-center rounded-full bg-accent-workflows/10">
              <GitBranch className="size-10 text-accent-workflows/40" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground">لا توجد رحلات عملاء بعد</h2>
              <p className="text-sm mt-1">أنشئ أول رحلة تلقائية لمتابعة عملائك المحتملين</p>
            </div>
            <Button className="bg-accent-workflows hover:bg-accent-workflows/90 text-white gap-1.5 mt-2" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />إنشاء رحلة جديدة
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {journeys.map((j) => <JourneyCard key={j.id} journey={j} onSelect={setSelected} />)}
          </div>
        )}
      </div>

      <NewJourneyDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onCreate={handleCreate} />
    </>
  )
}
