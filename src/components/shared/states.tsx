"use client";

import { useLocale } from "@/lib/locale-context";

export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 bg-[var(--bg-card)] rounded-lg w-48" />
      <div className="h-4 bg-[var(--bg-card)] rounded w-96" />
      <div className="grid grid-cols-4 gap-3 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-[var(--bg-card)] rounded-[10px]" />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className="text-[var(--red)] text-sm font-medium mb-2">{t("common.error")}</div>
      <div className="text-[var(--text-secondary)] text-sm text-center max-w-md">
        {message}
      </div>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 text-xs bg-[var(--bg-card)] border border-[var(--border)] rounded-md hover:border-[var(--border-focus)] transition-colors"
      >
        {t("common.retry")}
      </button>
    </div>
  );
}

export function EmptyState({
  message,
}: {
  message?: string;
}) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className="text-[var(--text-tertiary)] text-sm">{message || t("common.no_data")}</div>
    </div>
  );
}
