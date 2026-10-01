import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ChangePasswordForm, OwnerProfileForm } from "@/features/profile/components/profile-forms";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Owner profile" };

export default async function OwnerProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const [{ data: profile }, { data: owner }] = await Promise.all([
    supabase.from("profiles").select("created_at").eq("id", user.id).maybeSingle(),
    supabase.from("owner_profiles").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Owner profile</h1>
          <p className="text-muted text-sm">
            Member since {profile ? formatDate(profile.created_at) : "—"}
          </p>
        </div>
        <Badge
          tone={
            owner?.verification_status === "verified"
              ? "success"
              : owner?.verification_status === "rejected"
                ? "danger"
                : "warning"
          }
        >
          Verification: {owner?.verification_status ?? "pending"}
        </Badge>
      </div>
      <Card>
        <CardHeader
          title="Profile Information"
          description="Your listing contact number is set per listing; this is your account number."
        />
        <CardBody>
          <OwnerProfileForm
            profile={{
              firstName: user.firstName,
              lastName: user.lastName,
              phone: user.phone,
              email: user.email,
            }}
            owner={{
              businessName: owner?.business_name ?? null,
              businessType: owner?.business_type ?? null,
              experience: owner?.experience ?? null,
              primaryLocation: owner?.primary_location ?? null,
              about: owner?.about ?? null,
            }}
          />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Password" />
        <CardBody>
          <ChangePasswordForm />
        </CardBody>
      </Card>
    </section>
  );
}
