import { Suspense } from "react";
import { ArchitectureWorkspace } from "@/features/architecture/ui/ArchitectureWorkspace";
import { uiLabels } from "@/shared/ui/ui-labels";

export default function Home() {
  return <Suspense fallback={<main className="workspace-loading">{uiLabels.loading}</main>}><ArchitectureWorkspace /></Suspense>;
}
