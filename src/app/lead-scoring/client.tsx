'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Lightbulb } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScoreRing } from '@/components/shared/score-ring'
import { StatusPill } from '@/components/shared/status-pill'
import type { Lead, LeadScore, SalesRep, LeadGrade } from '@/lib/types'
import { cn, toAr } from "@/lib/utils";

const GRADE_STYLES: Record<LeadGrade, string> = {
  A: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  B: 'bg-blue-100 text-blue-700 border-blue-200',
  C: 'bg-amber-100 text-amber-700 border-amber-200',
  D: 'bg-red-100 text-red-700 border-red-200',
}

function GradeBadge({ grade }: { grade: LeadGrade }) {
  return (
    <span className={cn('inline-flex size-10 items-center justify-center rounded-full border-2 text-lg font-extrabold', GRADE_STYLES[grade])}>
      {grade}
    </span>
  )
}

function TrendIcon({ trend }: { trend: LeadScore['trend'] }) {
  if (trend === 'up') return <TrendingUp className="size-4 text-success" />
  if (trend === 'down') return <TrendingDown className="size-4 text-danger" />
  return <Minus className="size-4 text-muted-foreground" />
}

function LeadListItem({
  lead,
  score,
  isSelected,
  onSelect,
}: {
  lead: Lead
  score: LeadScore | undefined
  isSelected: boolean
  onSelect: () => void
}) {
  // Prefer the live computed score; fall back to the lead's stored score.
  const displayScore = score?.totalScore ?? lead.aiScore
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl border p-3.5 text-start transition-all",
        isSelected
          ? "border-accent-lead-scoring bg-amber-50 shadow-sm"
          : "border-border bg-card hover:border-accent-lead-scoring/50 hover:bg-muted/30",
      )}>
      <Avatar className="size-9 shrink-0">
        <AvatarFallback className="bg-accent-lead-scoring/10 text-accent-lead-scoring text-xs font-bold">
          {lead.nameAr.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {lead.nameAr}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {lead.propertyInterest} · {lead.city}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className={cn(
            "text-lg font-extrabold",
            displayScore >= 80
              ? "text-success"
              : displayScore >= 60
                ? "text-accent-lead-scoring"
                : "text-muted-foreground",
          )}>
          {toAr(displayScore)}
        </span>
        {score && <TrendIcon trend={score.trend} />}
      </div>
    </button>
  );
}

function ScoreDetailPanel({ lead, score, salesReps }: { lead: Lead; score: LeadScore; salesReps: SalesRep[] }) {
  const rep = salesReps.find((r) => r.id === lead.salesRepId)

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="bg-accent-lead-scoring/10 text-accent-lead-scoring text-xl font-bold">
              {lead.nameAr.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-base font-bold text-foreground">{lead.nameAr}</h2>
            <p className="text-sm text-muted-foreground">{lead.propertyInterest} · {lead.city}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <StatusPill type="stage" value={lead.stage} />
              {rep && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  {rep.nameAr}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={score.totalScore} maxScore={score.maxScore} size={100} strokeWidth={9} />
            <GradeBadge grade={score.grade} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 border-t border-border pt-4">
          <div className="flex items-center gap-1.5 text-sm">
            <TrendIcon trend={score.trend} />
            <span className={cn(
              'font-medium',
              score.trend === 'up' ? 'text-success' : score.trend === 'down' ? 'text-danger' : 'text-muted-foreground'
            )}>
              {score.trend === 'up' ? 'تحسّن' : score.trend === 'down' ? 'تراجع' : 'مستقر'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            آخر تحديث:{' '}
            {new Date(score.updatedAt).toLocaleDateString('ar-SA', {
              year: 'numeric', month: 'short', day: 'numeric',
            })}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">العوامل المؤثرة في درجة التقييم</h3>
        <div className="space-y-4">
          {[...score.factors]
            .sort((a, b) => a.score / a.maxScore - b.score / b.maxScore)
            .map((factor, i) => {
            const pct = Math.round((factor.score / factor.maxScore) * 100)
            const color =
              pct >= 80 ? 'bg-success' : pct >= 60 ? 'bg-accent-lead-scoring' : pct >= 40 ? 'bg-warning' : 'bg-danger'
            return (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {factor.labelAr}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-bold",
                        pct >= 80
                          ? "text-success"
                          : pct >= 60
                            ? "text-accent-lead-scoring"
                            : pct >= 40
                              ? "text-warning"
                              : "text-danger",
                      )}>
                      {toAr(pct)}٪
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      color,
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  الوزن النسبي: {toAr(Math.round(factor.weight * 100))}٪
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100">
            <Lightbulb className="size-4 text-accent-lead-scoring" />
          </div>
          <h3 className="text-sm font-semibold text-accent-lead-scoring">توصية الذكاء الاصطناعي</h3>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-foreground font-medium">العوامل الإيجابية الرئيسية:</p>
          <ul className="space-y-1">
            {score.topFactors.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                <span className="size-1.5 rounded-full bg-success shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-amber-200 pt-3">
            <p className="text-sm text-amber-800">
              {score.grade === 'A'
                ? 'عميل ذو أولوية عالية — يُنصح بالتواصل الفوري وتسريع دورة المبيعات.'
                : score.grade === 'B'
                ? 'عميل واعد — تابع معه بانتظام وقدّم له عروضاً مخصصة.'
                : score.grade === 'C'
                ? 'عميل متوسط — استمر في التفاعل وحاول تحسين نقاط الضعف.'
                : 'عميل ذو أولوية منخفضة — ضعه في قائمة المتابعة الدورية.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function NoScoreState({ lead }: { lead: Lead }) {
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center">
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
        <ScoreRing score={lead.aiScore} size={64} strokeWidth={7} />
      </div>
      <h3 className="text-base font-semibold text-foreground">{lead.nameAr}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        نقاط الذكاء الاصطناعي: <strong>{toAr(lead.aiScore)}</strong> / ١٠٠
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        لا يوجد تفصيل متاح لهذا العميل حتى الآن.
      </p>
    </div>
  );
}

const VISIBLE_STAGES = ['New', 'Contacted', 'Qualified', 'Proposal']

interface Props {
  leads: Lead[]
  scores: LeadScore[]
  salesReps: SalesRep[]
}

export function LeadScoringClient({ leads, scores, salesReps }: Props) {
  const scoreByLead = new Map(scores.map((s) => [s.leadId, s]))
  const scoreOf = (lead: Lead) => scoreByLead.get(lead.id)?.totalScore ?? lead.aiScore

  const scorableLeads = leads
    .filter((l) => VISIBLE_STAGES.includes(l.stage))
    .sort((a, b) => scoreOf(b) - scoreOf(a))

  const [selectedId, setSelectedId] = useState<string>(scorableLeads[0]?.id ?? '')

  const selectedLead = scorableLeads.find((l) => l.id === selectedId) ?? scorableLeads[0]
  const selectedScore = scores.find((s) => s.leadId === selectedId)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-accent-lead-scoring">
          تقييم العملاء المحتملين
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          تحليل ذكاء اصطناعي لتحديد العملاء الأعلى قيمة
        </p>
      </div>

      {scorableLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-muted-foreground">
          <div className="flex size-20 items-center justify-center rounded-full bg-amber-50">
            <Lightbulb className="size-10 text-amber-300" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">لا يوجد عملاء محتملون بعد</h2>
            <p className="text-sm mt-1">أضف عملاء محتملين من خط المبيعات لتظهر تقييماتهم هنا</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">
                العملاء النشطون ({toAr(scorableLeads.length)})
              </h3>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto max-h-150">
              {scorableLeads.map((lead) => (
                <LeadListItem
                  key={lead.id}
                  lead={lead}
                  score={scoreByLead.get(lead.id)}
                  isSelected={lead.id === selectedId}
                  onSelect={() => setSelectedId(lead.id)}
                />
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedLead && selectedScore ? (
              <ScoreDetailPanel
                lead={selectedLead}
                score={selectedScore}
                salesReps={salesReps}
              />
            ) : selectedLead ? (
              <NoScoreState lead={selectedLead} />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
