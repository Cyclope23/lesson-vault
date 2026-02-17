"use client";

import { useActionState } from "react";
import { registerAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { BookOpen, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, undefined);

  if (state?.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-accent">
            <CheckCircle className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Registrazione completata</h2>
            <p className="text-sm text-muted-foreground">
              Il tuo account è in attesa di approvazione da parte dell&apos;amministratore.
              Riceverai una notifica quando sarà attivo.
            </p>
          </div>
          <Link href="/login">
            <Button className="w-full">Torna al login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Lesson Vault</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            La piattaforma per la didattica intelligente
          </h1>
          <p className="text-lg text-primary-foreground/80">
            Carica i tuoi programmi, genera lezioni strutturate con l&apos;AI e condividi con il tuo istituto.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/50">
          Lesson Vault &mdash; Didattica assistita dall&apos;intelligenza artificiale
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-2 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-6 w-6" />
            </div>
            <span className="text-xl font-semibold tracking-tight">Lesson Vault</span>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight">Registrati</h2>
            <p className="text-sm text-muted-foreground">Crea un nuovo account docente</p>
          </div>

          <form action={formAction} className="space-y-4">
            {state?.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {state.error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input id="firstName" name="firstName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Cognome</Label>
                <Input id="lastName" name="lastName" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="docente@scuola.it"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Registrazione in corso..." : "Registrati"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Hai già un account?{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline font-medium">
              Accedi
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
