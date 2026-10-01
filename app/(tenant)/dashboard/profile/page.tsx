import type { Metadata } from "next";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ChangePasswordForm, ProfileForm } from "@/features/profile/components/profile-forms";
import { getCurrentUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profile" };

export default async function TenantProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile Information</h1>
        <p className="text-muted text-sm">
          Member since {profile ? formatDate(profile.created_at) : "—"}. Owners see your name, phone
          and email when you send a request.
        </p>
      </div>
      <Card>
        <CardHeader title="Your details" />
        <CardBody>
          <ProfileForm
            profile={{
              firstName: user.firstName,
              lastName: user.lastName,
              phone: user.phone,
              email: user.email,
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
