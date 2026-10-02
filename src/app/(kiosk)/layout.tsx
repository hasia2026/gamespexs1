import type { ReactNode } from "react";

export default function KioskLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gsx-bg px-4 py-10 text-gsx-text">
      {children}
    </div>
  );
}
