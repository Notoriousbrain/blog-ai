import Link from "next/link";
import { auth } from "@/src/lib/auth";
import { Button } from "./ui/button";
import { headers } from "next/headers";
import LogoutButton from "./logout-button";

export default async function Header() {
  const session = await auth.api.getSession({ headers: await headers() });

  const isLoggedIn = !!session?.user;

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold">
          BlogAI
        </Link>

        <nav className="flex items-center gap-4">
          {!isLoggedIn ? (
            <Link href="/signin">
              <Button variant="outline">Sign In</Button>
            </Link>
          ) : (
            <>
              <Link href="/blog/create">
                <Button>Create</Button>
              </Link>

              <LogoutButton />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
