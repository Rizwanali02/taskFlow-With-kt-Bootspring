import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ArrowRight, Check, CheckSquare2, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/useAuth'
import { getErrorMessage } from '@/lib/api'

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer'),
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters').max(100, 'Password is too long'),
})

type LoginValues = z.infer<typeof loginSchema>
type RegisterValues = z.infer<typeof registerSchema>

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const { login, register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/projects'
  const isRegister = mode === 'register'

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })
  const registerForm = useForm<RegisterValues>({ resolver: zodResolver(registerSchema), defaultValues: { name: '', email: '', password: '' } })

  if (isAuthenticated) return <Navigate to="/projects" replace />

  const submitLogin = loginForm.handleSubmit(async (values) => {
    try {
      await login(values.email, values.password)
      toast.success('Welcome back!')
      navigate(destination, { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not sign in. Check your details and try again.'))
    }
  })

  const submitRegister = registerForm.handleSubmit(async (values) => {
    try {
      await register(values.name, values.email, values.password)
      toast.success('Your workspace is ready.')
      navigate('/projects', { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not create your account. Please try again.'))
    }
  })

  return (
    <div className="auth-screen">
      <section className="auth-visual">
        <div className="auth-visual-top">
          <Link to="/auth" className="brand-lockup brand-lockup-light"><span className="brand-mark"><CheckSquare2 size={19} strokeWidth={2.5} /></span><span>taskflow<span className="brand-period">.</span></span></Link>
          <span className="visual-pill"><Sparkles size={14} /> Made for momentum</span>
        </div>
        <div className="auth-visual-copy">
          <span className="eyebrow eyebrow-light">YOUR WORK, IN FLOW</span>
          <h1>Make room for<br /><em>great work.</em></h1>
          <p>Bring every project, priority, and small win into one calm space.</p>
          <div className="visual-proof"><div className="proof-avatars"><span>A</span><span>M</span><span>R</span></div><span>A clearer day starts here</span><Check size={15} /></div>
        </div>
        <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
        <div className="auth-visual-footer"><span>Thoughtful work, one task at a time.</span><span>© 2026 TaskFlow</span></div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand"><Link to="/auth" className="brand-lockup"><span className="brand-mark"><CheckSquare2 size={19} strokeWidth={2.5} /></span><span>taskflow<span className="brand-period">.</span></span></Link></div>
          <div className="auth-heading">
            <span className="eyebrow">{isRegister ? 'GET STARTED' : 'WELCOME BACK'}</span>
            <h2>{isRegister ? 'Create your account' : 'Sign in to TaskFlow'}</h2>
            <p>{isRegister ? 'A more focused workday is just ahead.' : 'Pick up right where your team left off.'}</p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button role="tab" aria-selected={!isRegister} className={!isRegister ? 'auth-tab-active' : ''} onClick={() => setMode('login')}>Sign in</button>
            <button role="tab" aria-selected={isRegister} className={isRegister ? 'auth-tab-active' : ''} onClick={() => setMode('register')}>Create account</button>
          </div>

          {isRegister ? (
            <form className="auth-form" onSubmit={submitRegister} noValidate>
              <div className="field-group"><Label htmlFor="register-name">Your name</Label><Input id="register-name" placeholder="e.g. Jamie Parker" autoComplete="name" aria-invalid={Boolean(registerForm.formState.errors.name)} {...registerForm.register('name')} />{registerForm.formState.errors.name && <span className="field-error">{registerForm.formState.errors.name.message}</span>}</div>
              <div className="field-group"><Label htmlFor="register-email">Email address</Label><div className="input-with-icon"><Mail size={17} /><Input id="register-email" type="email" placeholder="you@company.com" autoComplete="email" aria-invalid={Boolean(registerForm.formState.errors.email)} {...registerForm.register('email')} /></div>{registerForm.formState.errors.email && <span className="field-error">{registerForm.formState.errors.email.message}</span>}</div>
              <div className="field-group"><Label htmlFor="register-password">Password</Label><div className="input-with-icon"><LockKeyhole size={17} /><Input id="register-password" type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" autoComplete="new-password" aria-invalid={Boolean(registerForm.formState.errors.password)} {...registerForm.register('password')} /><button className="password-toggle" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{registerForm.formState.errors.password && <span className="field-error">{registerForm.formState.errors.password.message}</span>}</div>
              <Button type="submit" size="lg" className="auth-submit" disabled={registerForm.formState.isSubmitting}>{registerForm.formState.isSubmitting ? 'Creating account…' : 'Create account'} <ArrowRight size={17} /></Button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={submitLogin} noValidate>
              <div className="field-group"><Label htmlFor="login-email">Email address</Label><div className="input-with-icon"><Mail size={17} /><Input id="login-email" type="email" placeholder="you@company.com" autoComplete="email" aria-invalid={Boolean(loginForm.formState.errors.email)} {...loginForm.register('email')} /></div>{loginForm.formState.errors.email && <span className="field-error">{loginForm.formState.errors.email.message}</span>}</div>
              <div className="field-group"><div className="label-row"><Label htmlFor="login-password">Password</Label><button className="quiet-link" type="button" onClick={() => toast.info('Ask your workspace admin to reset your password.')}>Forgot password?</button></div><div className="input-with-icon"><LockKeyhole size={17} /><Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password" aria-invalid={Boolean(loginForm.formState.errors.password)} {...loginForm.register('password')} /><button className="password-toggle" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{loginForm.formState.errors.password && <span className="field-error">{loginForm.formState.errors.password.message}</span>}</div>
              <Button type="submit" size="lg" className="auth-submit" disabled={loginForm.formState.isSubmitting}>{loginForm.formState.isSubmitting ? 'Signing in…' : 'Sign in'} <ArrowRight size={17} /></Button>
            </form>
          )}

          <p className="auth-legal">By continuing, you agree to our <button type="button" className="quiet-link" onClick={() => toast.info('Terms of service will be available soon.')}>Terms</button> and <button type="button" className="quiet-link" onClick={() => toast.info('Privacy policy will be available soon.')}>Privacy Policy</button>.</p>
        </div>
      </section>
    </div>
  )
}
