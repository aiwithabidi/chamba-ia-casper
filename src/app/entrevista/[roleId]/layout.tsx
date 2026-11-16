import { Suspense } from "react";
import { Spinner } from "@/components/gate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Spinner />}>{children}</Suspense>;
}
