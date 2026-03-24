import { Sidebar } from "@/components/sidebar";
import { OnboardingGuard } from "@/components/onboarding-guard";
import { LocaleProvider } from "@/lib/locale-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocaleProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[var(--bg)]">
          <OnboardingGuard>
            <div className="p-8">{children}</div>
          </OnboardingGuard>
        </main>
      </div>
    </LocaleProvider>
  );
}
