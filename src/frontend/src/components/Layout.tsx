import { Toaster } from "@/components/ui/sonner";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const year = new Date().getFullYear();
  const url = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>

        <footer className="border-t border-border/50 bg-sidebar px-6 py-3 text-center text-xs text-muted-foreground">
          © {year}.{" "}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Built with love using caffeine.ai
          </a>
        </footer>
      </div>

      <Toaster position="bottom-right" richColors />
    </div>
  );
}
