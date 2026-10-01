import type { Metadata } from "next";
import Link from "next/link";

import { signOutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Account suspended" };

export default function AccountSuspendedPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">This account is suspended</h1>
      <p className="text-muted max-w-md">
        An administrator has disabled access to this account. If you think this is a mistake, please{" "}
        <Link href="/contact" className="text-primary underline-offset-2 hover:underline">
          contact support
        </Link>
        .
      </p>
      <form action={signOutAction}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </main>
  );
}
