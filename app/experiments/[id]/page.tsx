import { notFound } from "next/navigation";
import { ExperimentDetailPage } from "@/components/detail-pages";
import { getWorkspaceSnapshot } from "@/lib/repository";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string; popout?: string }>;
};

export default async function ExperimentPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const workspace = await getWorkspaceSnapshot();
  const experiment = workspace.experiments.find((item) => item.id === id);

  if (!experiment) {
    notFound();
  }

  return (
    <ExperimentDetailPage
      assets={workspace.vaultAssets}
      experiment={experiment}
      idea={workspace.ideas.find((idea) => idea.id === experiment.ideaId)}
      popout={query.popout === "1"}
      startEditing={query.mode === "edit"}
    />
  );
}
