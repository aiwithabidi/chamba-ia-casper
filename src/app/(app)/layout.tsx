import { Suspense } from "react";
import { RequireProfile, Spinner } from "@/components/gate";
import { OutcomePrompt } from "@/components/outcome-prompt";
import { TabBar } from "@/components/tab-bar";
import { Tour } from "@/components/tour";

// A fixed app shell exactly one screen tall, so the page never rubber-bands and nothing slides under
// the status bar. <main> does not scroll: each page puts its header first and its scrolling content
// in a .scroll-body sibling (see globals.css), and a deck page fills the height as a flex child.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Spinner />}>
      <RequireProfile>
        <div className="pt-safe screen flex flex-col overflow-hidden">
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
          <TabBar />
        </div>
        <OutcomePrompt />
        <Tour />
      </RequireProfile>
    </Suspense>
  );
}
