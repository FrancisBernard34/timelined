"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export type AuthUser = { id: string; email: string; name: string | null };

type Mode = "login" | "signup";

export function AuthForm({
  onAuthenticated,
}: {
  onAuthenticated: (user: AuthUser) => void;
}) {
  const t = useTranslations("Auth");
  const tApp = useTranslations("App");

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorForStatus = (status: number) => {
    if (status === 401) return t("invalidCredentials");
    if (status === 409) return t("emailTaken");
    if (status === 400) return t("invalidInput");
    return t("genericError");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const payload =
        mode === "login"
          ? { email, password }
          : { email, password, name: name || undefined };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(errorForStatus(response.status));
        return;
      }

      onAuthenticated(data as AuthUser);
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{tApp("brand")}</CardTitle>
          <CardDescription>
            {mode === "login" ? t("loginSubtitle") : t("signupSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1">
                <Label htmlFor="name">{t("name")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t("namePlaceholder")}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("emailPlaceholder")}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("passwordPlaceholder")}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
            >
              {isSubmitting
                ? t("submitting")
                : mode === "login"
                  ? t("submitLogin")
                  : t("submitSignup")}
            </Button>
          </form>

          <button
            type="button"
            onClick={switchMode}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:underline cursor-pointer"
          >
            {mode === "login" ? t("toSignup") : t("toLogin")}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
