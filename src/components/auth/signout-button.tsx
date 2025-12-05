"use client";

import { authClient } from "@/src/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "../ui";

export default function SignoutButton() {
  const router = useRouter();

  async function logout() {
    await authClient.signOut();

    router.push("/");
  }

  return (
    <Button variant="destructive" onClick={logout}>
      Logout
    </Button>
  );
}
