import { Shield } from 'lucide-react'

const features = [
  'Your account, your data — fully private by design',
  'Seamless access across all enterprise services',
  'Enterprise-grade security with SSO integration',
]

export function AuthShowcase() {
  return (
    <section className="relative hidden overflow-hidden bg-[#0f0f1a] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      {/* indigo-night gradient wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-85"
        style={{
          background:
            'radial-gradient(120% 120% at 15% 0%, #4f46e5 0%, #3730a3 32%, #1e1b4b 55%, #0f0f1a 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          background:
            'radial-gradient(80% 80% at 90% 90%, #818cf8 0%, transparent 60%)',
        }}
      />

      <header className="relative z-10 flex items-center gap-3">
        <span className="text-lg font-semibold tracking-tight text-white">
          Sky Genesis Enterprise
        </span>
      </header>

      <div className="relative z-10 max-w-md">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          <Shield className="size-3.5" />
          Enterprise account platform
        </div>
        <h2 className="text-pretty text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">
          Your central hub for all enterprise services.
        </h2>
        <p className="mt-4 text-pretty text-base leading-relaxed text-white/75">
          Sign in to manage your profile, security, applications, and connected
          services across the Sky Genesis ecosystem.
        </p>

        <ul className="mt-8 space-y-3">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-3 text-sm text-white/85"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold text-white ring-1 ring-white/30">
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <footer className="relative z-10 text-sm text-white/50">
        {'“Intelligence is the ability to avoid doing work, yet getting the work done.”'}
        <span className="mt-1 block font-medium text-white/75">
          Linus Torvalds — Linux creator and open source advocate
        </span>
      </footer>
    </section>
  )
}
