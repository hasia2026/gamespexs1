"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV } from "@/lib/nav";
import { APP_TAGLINE } from "@/lib/config";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed left-3 top-3 z-50 rounded border border-gsx-border bg-gsx-panel px-2 py-1 text-sm text-gsx-muted lg:hidden"
        aria-label="Toggle navigation"
      >
        ☰
      </button>
      <aside
        className={`${open ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gsx-border bg-gsx-panel transition-transform lg:translate-x-0`}
      >
        <div className="border-b border-gsx-border px-4 py-4">
          <Link href="/" className="flex flex-col gap-2">
            <Image
              src="/logo.jpg"
              alt="GAMESPEXS"
              width={0}
              height={0}
              sizes="220px"
              className="h-auto w-full max-w-[210px] rounded-md"
              priority
            />
            <div className="text-[10px] uppercase tracking-wider text-gsx-muted">
              {APP_TAGLINE}
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <div key={item.label} className="mb-1">
                <Link
                  href={item.href}
                  className={`flex items-center justify-between rounded px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-gsx-accent/10 font-medium text-gsx-accent"
                      : "text-gsx-text hover:bg-gsx-panel-2"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-5 text-center text-base">{item.icon}</span>
                    {item.label}
                  </span>
                  {item.planned && (
                    <span className="rounded border border-gsx-gold/40 px-1 py-0.5 text-[10px] text-gsx-gold">
                      {item.planned}
                    </span>
                  )}
                </Link>
                {item.children && active && (
                  <div className="mb-2 ml-8 mt-1 flex flex-col gap-0.5 border-l border-gsx-border pl-3">
                    {item.children.map((c) => (
                      <Link
                        key={c.href + c.label}
                        href={c.href}
                        className={`rounded px-2 py-1 text-[13px] transition-colors ${
                          pathname === c.href
                            ? "text-gsx-accent"
                            : "text-gsx-muted hover:text-gsx-text"
                        }`}
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-gsx-border px-5 py-3 text-[11px] text-gsx-muted">
          Blueprint v1 · 36-section build
        </div>
      </aside>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}
    </>
  );
}
