"use client"

import { ArrowLeft, Fingerprint, Github, Building2 } from "lucide-react"
import Link from "next/link"

export default function LoginOptionsPage() {
  return (
    <div className="min-h-screen relative bg-[#e8eef4] flex items-center justify-center p-4">
      {/* Background pattern - subtle hexagon shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <svg className="absolute top-20 right-40 w-96 h-96" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <polygon points="100,10 172,50 172,130 100,170 28,130 28,50" fill="none" stroke="#0067b8" strokeWidth="0.5" />
          <polygon points="100,30 152,60 152,120 100,150 48,120 48,60" fill="none" stroke="#0067b8" strokeWidth="0.5" />
        </svg>
        <svg className="absolute top-60 left-20 w-64 h-64" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <polygon points="100,10 172,50 172,130 100,170 28,130 28,50" fill="none" stroke="#50bfdc" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Main card container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Options card */}
        <div className="bg-white rounded-sm shadow-lg p-11">
          <div className="mb-6">
            <span className="text-[15px] font-semibold text-[#5e5e5e]">Sky Genesis Enterprise</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold mb-6 text-[#1b1b1b]">Options de connexion</h1>

          {/* Options list */}
          <div className="space-y-2 mb-8">
            {/* Windows Hello / Biometric option */}
            <button className="w-full p-4 text-left hover:bg-[#f3f2f1] border border-[#8a8886] hover:border-[#323130] transition-colors">
              <div className="flex items-start gap-3">
                <Fingerprint className="w-6 h-6 text-[#605e5c] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[15px] text-[#1b1b1b] font-semibold mb-1">
                    Visage, empreinte digitale, code PIN ou clé de sécurité
                  </div>
                  <div className="text-[13px] text-[#605e5c]">
                    Utilisez votre appareil pour vous connecter avec une clé d&apos;accès.
                  </div>
                </div>
              </div>
            </button>

            {/* GitHub option */}
            <button className="w-full p-4 text-left hover:bg-[#f3f2f1] border border-[#8a8886] hover:border-[#323130] transition-colors">
              <div className="flex items-start gap-3">
                <Github className="w-6 h-6 text-[#605e5c] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[15px] text-[#1b1b1b] font-semibold">Vous connecter à GitHub</div>
                </div>
              </div>
            </button>

            {/* Organization option */}
            <button className="w-full p-4 text-left hover:bg-[#f3f2f1] border border-[#8a8886] hover:border-[#323130] transition-colors">
              <div className="flex items-start gap-3">
                <Building2 className="w-6 h-6 text-[#605e5c] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[15px] text-[#1b1b1b] font-semibold mb-1">Se connecter à une organisation</div>
                  <div className="text-[13px] text-[#605e5c]">
                    Recherchez une entreprise ou une organisation avec laquelle vous travaillez.
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Back button */}
          <div className="flex justify-start">
            <Link
              href="/login"
              className="px-6 py-1.5 text-[15px] text-[#1b1b1b] bg-[#edebe9] hover:bg-[#e1dfdd] border border-transparent focus:outline-none focus:border-[#8a8886] flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 py-3 px-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-[#605e5c]">
        <button className="hover:underline focus:underline">...</button>
        <a href="#" className="hover:underline focus:underline">
          Conditions d&apos;utilisation
        </a>
        <a href="#" className="hover:underline focus:underline">
          Confidentialité et cookies
        </a>
        <a href="#" className="hover:underline focus:underline">
          Accessibilité : partiellement conforme
        </a>
      </footer>
    </div>
  )
}
