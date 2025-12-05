"use client";

import { Button } from "@/src/components/ui/button";
import { authClient } from "@/src/lib/auth-client";

export default function SigninButton() {
  async function login() {
    const res = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });

    if (res?.error) {
      console.error("Login error:", res.error);
    }
  }

  return (
    <Button variant="outline" onClick={login}>
      Sign In
    </Button>
  );
}
