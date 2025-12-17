"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { KeyRound } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Login attempt with:", email)
  }

  const handleBack = () => {
    console.log("Back button clicked")
  }

  return (
    <>
      <Card className="w-full shadow-2xl border-0">
        <CardHeader className="space-y-6 pb-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-sky-500 rounded-lg">
              <div className="grid grid-cols-2 gap-0.5 w-6 h-6">
                <div className="bg-white rounded-sm" />
                <div className="bg-white rounded-sm" />
                <div className="bg-white rounded-sm" />
                <div className="bg-white rounded-sm" />
              </div>
            </div>
            <span className="text-xl font-semibold text-foreground">Sky Genesis Enterprise</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-normal text-foreground">Se connecter</h1>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="E-mail, téléphone ou identifiant Skype"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base border-b-2 border-t-0 border-x-0 rounded-none border-border focus-visible:border-blue-600 focus-visible:ring-0 px-0"
                autoFocus
              />
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Vous n&apos;avez pas encore de compte ?{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Créez-en un !
                </a>
              </p>
              <a href="#" className="text-blue-600 hover:underline block">
                Votre compte n&apos;est pas accessible ?
              </a>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleBack}
                className="px-6 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              >
                Retour
              </Button>
              <Button type="submit" className="px-8 bg-blue-600 hover:bg-blue-700 text-white">
                Suivant
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Sign-in options */}
      <Card className="w-full mt-4 shadow-lg border-0 hover:shadow-xl transition-shadow cursor-pointer">
        <CardFooter className="py-4 px-6">
          <button className="flex items-center gap-3 w-full text-sm text-foreground">
            <KeyRound className="w-5 h-5" />
            <span>Options de connexion</span>
          </button>
        </CardFooter>
      </Card>
    </>
  )
}
