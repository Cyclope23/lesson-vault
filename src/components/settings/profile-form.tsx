"use client";

import { useActionState, useEffect, useState } from "react";
import { updateProfile, changePassword, getProfile } from "@/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Lock } from "lucide-react";
import { toast } from "sonner";

export function ProfileForm() {
  const [profileState, profileAction, isProfilePending] = useActionState(updateProfile, undefined);
  const [passwordState, passwordAction, isPasswordPending] = useActionState(changePassword, undefined);
  const [profile, setProfile] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    discipline: { name: string } | null;
  } | null>(null);

  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  useEffect(() => {
    if (profileState?.success) {
      toast.success("Profilo aggiornato!");
      getProfile().then(setProfile);
    }
  }, [profileState]);

  useEffect(() => {
    if (passwordState?.success) {
      toast.success("Password aggiornata!");
    }
  }, [passwordState]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Profilo</CardTitle>
          </div>
          <CardDescription>Aggiorna le tue informazioni personali.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={profileAction} className="space-y-4">
            {profileState?.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {profileState.error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  defaultValue={profile?.firstName ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Cognome</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  defaultValue={profile?.lastName ?? ""}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={profile?.email ?? ""}
                required
              />
            </div>
            <Button type="submit" disabled={isProfilePending}>
              {isProfilePending ? "Salvataggio..." : "Salva profilo"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>Cambia password</CardTitle>
          </div>
          <CardDescription>Aggiorna la tua password di accesso.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={passwordAction} className="space-y-4">
            {passwordState?.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {passwordState.error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Password attuale</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nuova password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                minLength={6}
                required
              />
            </div>
            <Button type="submit" disabled={isPasswordPending}>
              {isPasswordPending ? "Aggiornamento..." : "Aggiorna password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
