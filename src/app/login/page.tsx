'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const DEMO_EMAIL = 'admin@nhc.sa'
const DEMO_PASS = 'demo1234'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // If already logged in, skip to dashboard
  useEffect(() => {
    if (sessionStorage.getItem('nhc_authed') === '1') {
      router.replace('/dashboard')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simulate network latency
    await new Promise((r) => setTimeout(r, 600))

    if (email === DEMO_EMAIL && password === DEMO_PASS) {
      sessionStorage.setItem('nhc_authed', '1')
      sessionStorage.setItem('nhc_user', JSON.stringify({ name: 'محمد الأحمدي', role: 'مدير المبيعات', email }))
      router.push('/dashboard')
    } else {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
      setIsLoading(false)
    }
  }

  const fillDemo = () => {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASS)
    setError('')
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Brand panel (start / right in RTL) ── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-brand p-12 text-white">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-black">◆</span>
          <span className="text-xl font-bold tracking-tight">NHC Innovation</span>
        </div>

        <div className="space-y-6">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-white/15">
            <Building2 className="size-8" />
          </div>
          <h1 className="text-4xl font-black leading-tight">
            نظام إدارة<br />علاقات العملاء
          </h1>
          <p className="text-lg text-white/75 leading-relaxed max-w-xs">
            الشركة الوطنية لخدمات الإسكان — منصة متكاملة لإدارة المبيعات العقارية والعملاء
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: '+٢٤٠', label: 'عميل محتمل' },
            { value: '٨', label: 'وحدات نظام' },
            { value: '٣٧', label: 'تكامل نشط' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white/10 p-4 text-center">
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="mt-1 text-xs text-white/65">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Login form (end / left in RTL) ── */}
      <div className="flex flex-1 items-center justify-center bg-muted/30 p-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 lg:hidden">
            <span className="text-2xl font-black text-brand">◆</span>
            <span className="text-lg font-bold">NHC Innovation</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">مرحباً بك</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              سجّل دخولك للوصول إلى لوحة التحكم
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="admin@nhc.sa"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ps-9"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">كلمة المرور</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ps-9 pe-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-brand hover:bg-brand/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  جارٍ تسجيل الدخول...
                </span>
              ) : (
                'تسجيل الدخول'
              )}
            </Button>
          </form>

          {/* Demo credentials hint */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">بيانات الدخول التجريبي</p>
            <div className="flex items-center justify-between">
              <div className="space-y-1 text-xs text-foreground font-mono">
                <p>{DEMO_EMAIL}</p>
                <p>{DEMO_PASS}</p>
              </div>
              <button
                type="button"
                onClick={fillDemo}
                className={cn(
                  'rounded-lg border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs font-medium text-brand',
                  'hover:bg-brand/10 transition-colors'
                )}
              >
                تعبئة تلقائية
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
