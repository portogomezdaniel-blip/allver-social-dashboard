import Sidebar from "@/components/layout/Sidebar";
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
        <div className="mirror-bg min-h-screen relative">
          <div className="flex min-h-screen relative z-[1]">
            {/* Sidebar — desktop only */}
            <div className="hidden md:block">
              <Sidebar />
            </div>

            {/* Main content */}
            <main className="flex-1 px-4 py-5 pb-24 md:px-10 md:py-7 md:pb-10 max-w-[840px]">
              {children}
            </main>
          </div>

          {/* Bottom Nav — mobile only */}
          <div className="md:hidden">
            <BottomNav />
          </div>
        </div>
      </OnboardingGuard>
    </LocaleProvider>
  );
}
