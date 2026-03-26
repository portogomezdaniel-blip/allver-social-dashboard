import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { OnboardingGuard } from "@/components/onboarding-guard";
import { LocaleProvider } from "@/lib/locale-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocaleProvider>
      <OnboardingGuard>
        <div className="mirror-bg min-h-screen">
          <TopBar />
          <main className="relative z-[1] pb-20 md:pb-0">
            <div className="px-5 md:px-8 py-6 max-w-[1100px] mx-auto">{children}</div>
          </main>
          <BottomNav />
        </div>
      </OnboardingGuard>
    </LocaleProvider>
  );
}
