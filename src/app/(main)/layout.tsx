import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Sidebar />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </div>
    </>
  );
}
