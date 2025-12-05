"use client";

import { Button } from "@/src/components/ui/button";
import { authClient } from "@/src/lib/auth-client";

export default function LoginPage() {
  async function login() {
    const res = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });

    if (res?.error) {
      console.error(res.error);
      return;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Button size="lg" onClick={login}>
        Sign in with Google
      </Button>
    </div>
  );
}
