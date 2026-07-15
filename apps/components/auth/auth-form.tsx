'use client'

import { useId, useState } from 'react'
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { authApi } from '@/lib/api/auth'
import { loginSchema, registerSchema } from '@/lib/auth/schemas'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'

type Mode = 'login' | 'register'

// Types pour les formulaires
interface LoginFormData {
  email: string
  password: string
}

interface RegisterFormData {
  displayName: string
  email: string
  password: string
  confirmPassword: string
  workspaceName?: string
}

export function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const nameId = useId()
  const emailId = useId()
  const passwordId = useId()
  const confirmPasswordId = useId()

  const isRegister = mode === 'register'

  // Initialisation des formulaires avec react-hook-form et zod
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      workspaceName: '',
    },
  })

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)

    try {
      if (isRegister) {
        // Soumission du formulaire d'inscription
        const formData = registerForm.getValues()
        
        // Préparer le payload pour l'API
        const payload = {
          displayName: formData.displayName,
          email: formData.email,
          password: formData.password,
          workspaceName: formData.workspaceName || undefined,
        }

        const response = await authApi.register(payload)
        
        if (response) {
          toast({
            title: 'Account created',
            description: 'Your account has been created successfully.',
            variant: 'default',
          })
          router.push('/home')
        }
      } else {
        // Soumission du formulaire de connexion
        const formData = loginForm.getValues()
        
        const payload = {
          email: formData.email,
          password: formData.password,
        }

        const response = await authApi.login(payload)
        
        if (response) {
          toast({
            title: 'Welcome back',
            description: 'You have been logged in successfully.',
            variant: 'default',
          })
          router.push('/home')
        }
      }
    } catch (error) {
      // Gestion des erreurs
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Mode toggle */}
      <div className="mb-8 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {(['login', 'register'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-all',
              mode === value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {value === 'login' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {isRegister ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isRegister
            ? 'Start building with frontier AI in seconds.'
            : 'Sign in to continue to your workspace.'}
        </p>
      </div>

      {/* Social auth */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="lg" className="h-11">
          <GoogleIcon className="size-4" />
          Google
        </Button>
        <Button variant="outline" size="lg" className="h-11">
          <GithubIcon className="size-4" />
          GitHub
        </Button>
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <Field
            id={nameId}
            label="Full name"
            icon={<User className="size-4" />}
            type="text"
            autoComplete="name"
            placeholder="Ada Lovelace"
            required
            {...registerForm.register('displayName')}
            error={registerForm.formState.errors.displayName?.message}
          />
        )}

        <Field
          id={emailId}
          label="Email"
          icon={<Mail className="size-4" />}
          type="email"
          autoComplete="email"
          placeholder="john.doe@company.com"
          required
          {...(isRegister ? registerForm.register('email') : loginForm.register('email'))}
          error={isRegister ? registerForm.formState.errors.email?.message : loginForm.formState.errors.email?.message}
        />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor={passwordId}
              className="text-sm font-medium text-foreground"
            >
              Password
            </label>
            {!isRegister && (
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </button>
            )}
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Lock className="size-4" />
            </span>
            <input
              id={passwordId}
              type={showPassword ? 'text' : 'password'}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              placeholder="••••••••"
              required
              className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-10 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
              {...(isRegister ? registerForm.register('password') : loginForm.register('password'))}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {isRegister && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Must be at least 12 characters.
            </p>
          )}
          {isRegister ? (
            registerForm.formState.errors.password && (
              <p className="mt-1 text-xs text-destructive">
                {registerForm.formState.errors.password.message}
              </p>
            )
          ) : (
            loginForm.formState.errors.password && (
              <p className="mt-1 text-xs text-destructive">
                {loginForm.formState.errors.password.message}
              </p>
            )
          )}
        </div>

        {isRegister && (
          <Field
            id={confirmPasswordId}
            label="Confirm password"
            icon={<Lock className="size-4" />}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            required
            {...registerForm.register('confirmPassword')}
            error={registerForm.formState.errors.confirmPassword?.message}
          />
        )}

        {isRegister && (
          <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <input
              type="checkbox"
              required
              className="mt-0.5 size-4 rounded border-input accent-primary"
            />
            <span>
              I agree to the{' '}
              <a href="#" className="font-medium text-primary hover:underline">
                Terms
              </a>{' '}
              and{' '}
              <a href="#" className="font-medium text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </span>
          </label>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="h-11 w-full text-sm"
        >
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {isRegister ? 'Create account' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          onClick={() => setMode(isRegister ? 'login' : 'register')}
          className="font-medium text-primary hover:underline"
        >
          {isRegister ? 'Sign in' : 'Create one'}
        </button>
      </p>
    </div>
  )
}

function Field({
  id,
  label,
  icon,
  error,
  ...props
}: {
  id: string
  label: string
  icon: React.ReactNode
  error?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        <input
          id={id}
          className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 1C5.92 1 1 5.92 1 12c0 4.86 3.15 8.98 7.52 10.44.55.1.75-.24.75-.53v-1.86c-3.06.67-3.71-1.47-3.71-1.47-.5-1.28-1.22-1.62-1.22-1.62-1-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.68 2.57 1.2 3.2.92.1-.71.38-1.2.7-1.47-2.44-.28-5.01-1.22-5.01-5.44 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.4.11-2.92 0 0 .92-.3 3.02 1.13a10.5 10.5 0 0 1 5.5 0c2.1-1.43 3.02-1.13 3.02-1.13.6 1.52.22 2.64.11 2.92.7.77 1.13 1.75 1.13 2.95 0 4.23-2.58 5.15-5.03 5.43.39.34.74 1.01.74 2.04v3.03c0 .29.2.64.76.53A11.01 11.01 0 0 0 23 12c0-6.08-4.92-11-11-11Z"
      />
    </svg>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  )
}
