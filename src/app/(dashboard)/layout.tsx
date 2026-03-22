import { Sidebar } from "@/components/sidebar";
import { TilesBackground } from "@/components/tiles-background";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative">
        <TilesBackground />
        <div className="relative z-10 p-8">{children}</div>
      </main>
    </div>
  );
}
