import { Sidebar } from "@/components/sidebar";
import { OnboardingGuard } from "@/components/onboarding-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[var(--bg)]">
        <OnboardingGuard>
          <div className="p-8">{children}</div>
        </OnboardingGuard>
      </main>
    </div>
  );
}
