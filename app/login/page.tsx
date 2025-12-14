"use client"

import type React from "react"

import { useState } from "react"
import { Search, ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "password">("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setIsTransitioning(true)
      setTimeout(() => {
        setStep("password")
        setIsTransitioning(false)
      }, 300)
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Login attempt with:", email, password)
  }

  const handleBack = () => {
    if (step === "password") {
      setIsTransitioning(true)
      setTimeout(() => {
        setStep("email")
        setPassword("")
        setIsTransitioning(false)
      }, 300)
    }
  }

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
        {/* Login card */}
        <div
          className={`bg-white rounded-sm shadow-lg p-11 mb-4 transition-all duration-300 ${
            isTransitioning ? "opacity-0 translate-x-[-20px]" : "opacity-100 translate-x-0"
          }`}
        >
          <div className="mb-6">
            <span className="text-[15px] font-semibold text-[#5e5e5e]">Sky Genesis Enterprise</span>
          </div>

          {step === "email" ? (
            <>
              {/* Title */}
              <h1 className="text-2xl font-semibold mb-4 text-[#1b1b1b]">Se connecter</h1>

              {/* Form */}
              <form onSubmit={handleEmailSubmit}>
                {/* Email input */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-mail, téléphone ou identifiant Skype"
                    className="w-full px-3 py-2 border border-[#8a8886] bg-white text-[15px] text-[#1b1b1b] placeholder:text-[#605e5c] focus:outline-none focus:border-[#0067b8] focus:border-2 hover:border-[#323130] transition-colors"
                  />
                </div>

                {/* Links */}
                <div className="mb-6 space-y-2">
                  <p className="text-[13px] text-[#1b1b1b]">
                    Vous n&apos;avez pas encore de compte ?{" "}
                    <a href="#" className="text-[#0067b8] hover:underline focus:underline">
                      Créez-en un !
                    </a>
                  </p>
                  <p>
                    <a href="#" className="text-[13px] text-[#0067b8] hover:underline focus:underline">
                      Votre compte n&apos;est pas accessible ?
                    </a>
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-6 py-1.5 text-[15px] text-[#1b1b1b] bg-[#edebe9] hover:bg-[#e1dfdd] border border-transparent focus:outline-none focus:border-[#8a8886]"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-1.5 text-[15px] text-white bg-[#0067b8] hover:bg-[#005a9e] border border-transparent focus:outline-none focus:border-[#8a8886]"
                  >
                    Suivant
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Email display with back button */}
              <button
                onClick={handleBack}
                className="flex items-center gap-1 mb-6 text-[13px] text-[#0067b8] hover:underline"
              >
                <ChevronLeft className="w-4 h-4" />
                {email}
              </button>

              <h1 className="text-2xl font-semibold mb-4 text-[#1b1b1b]">Entrer le mot de passe</h1>

              {/* Form */}
              <form onSubmit={handlePasswordSubmit}>
                {/* Password input */}
                <div className="mb-4">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mot de passe"
                    autoFocus
                    className="w-full px-3 py-2 border border-[#8a8886] bg-white text-[15px] text-[#1b1b1b] placeholder:text-[#605e5c] focus:outline-none focus:border-[#0067b8] focus:border-2 hover:border-[#323130] transition-colors"
                  />
                </div>

                {/* Links */}
                <div className="mb-6">
                  <p>
                    <a href="#" className="text-[13px] text-[#0067b8] hover:underline focus:underline">
                      Mot de passe oublié ?
                    </a>
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-1.5 text-[15px] text-[#1b1b1b] bg-[#edebe9] hover:bg-[#e1dfdd] border border-transparent focus:outline-none focus:border-[#8a8886]"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-1.5 text-[15px] text-white bg-[#0067b8] hover:bg-[#005a9e] border border-transparent focus:outline-none focus:border-[#8a8886]"
                  >
                    Se connecter
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {step === "email" && (
          <div
            className={`bg-white rounded-sm shadow-lg transition-all duration-300 ${
              isTransitioning ? "opacity-0 translate-x-[-20px]" : "opacity-100 translate-x-0"
            }`}
          >
            <Link
              href="/login/options"
              className="w-full px-6 py-3 flex items-center gap-3 text-[15px] text-[#1b1b1b] hover:bg-[#f3f2f1] transition-colors"
            >
              <Search className="w-5 h-5 text-[#605e5c]" />
              <span>Options de connexion</span>
            </Link>
          </div>
        )}
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
