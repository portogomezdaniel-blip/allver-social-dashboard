"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Don't redirect if already on onboarding or settings
    if (pathname === "/onboarding" || pathname === "/settings") {
      setChecked(true);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setChecked(true);
        return;
      }

      const { data: identity } = await supabase
        .from("creator_identity")
        .select("onboarding_status")
        .eq("user_id", data.user.id)
        .single();

      if (!identity || identity.onboarding_status === "not_started") {
        router.push("/onboarding");
      } else if (identity.onboarding_status === "in_progress") {
        router.push("/onboarding");
      } else {
        setChecked(true);
      }
    });
  }, [pathname, router]);

  if (!checked && pathname !== "/onboarding" && pathname !== "/settings") {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-tertiary)] text-sm">
        Verificando...
      </div>
    );
  }

  return <>{children}</>;
}
