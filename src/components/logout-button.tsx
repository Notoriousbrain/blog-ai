"use client";

import { authClient } from "@/src/lib/auth-client";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await authClient.signOut();

    router.push("/signin");
  }

  return (
    <Button variant="destructive" onClick={logout}>
      Logout
    </Button>
  );
}
