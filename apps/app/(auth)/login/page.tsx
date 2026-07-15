import { AuthForm } from '@/components/auth/auth-form'
import { AuthShowcase } from '@/components/auth/auth-showcase'

export default function Page() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <AuthShowcase />

      <section className="flex flex-col px-6 py-8 sm:px-10">
        {/* Mobile brand header */}
        <header className="flex items-center gap-2.5 lg:hidden">
          <span className="text-lg font-semibold tracking-tight">Sky Genesis Enterprise</span>
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <AuthForm />
        </div>

        <footer className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Sky Genesis Enterprise. All rights reserved.
        </footer>
      </section>
    </main>
  )
}
