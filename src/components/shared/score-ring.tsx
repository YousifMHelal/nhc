import { cn, toAr } from '@/lib/utils'

interface ScoreRingProps {
  score: number
  maxScore?: number
  size?: number
  strokeWidth?: number
  className?: string
  labelAr?: string
}

function gradeColor(score: number): string {
  if (score >= 80) return 'var(--color-success)'
  if (score >= 60) return 'var(--color-accent-lead-scoring)'
  if (score >= 40) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

export function ScoreRing({
  score,
  maxScore = 100,
  size = 120,
  strokeWidth = 10,
  className,
  labelAr,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(score / maxScore, 1)
  const offset = circumference * (1 - pct)
  const color = gradeColor((score / maxScore) * 100)

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          style={{ display: 'block' }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground" style={{ lineHeight: 1 }}>
            {toAr(score)}
          </span>
          <span className="text-xs text-muted-foreground">/{toAr(maxScore)}</span>
        </div>
      </div>
      {labelAr && (
        <span className="text-xs font-medium text-muted-foreground">{labelAr}</span>
      )}
    </div>
  )
}
