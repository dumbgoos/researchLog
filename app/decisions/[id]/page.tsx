import { notFound } from "next/navigation";
import { DecisionDetailPage } from "@/components/detail-pages";
import { getWorkspaceSnapshot } from "@/lib/repository";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string; popout?: string }>;
};

export default async function DecisionPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const workspace = await getWorkspaceSnapshot();
  const decision = workspace.decisions.find((item) => item.id === id);

  if (!decision) {
    notFound();
  }

  return (
    <DecisionDetailPage
      decision={decision}
      experiment={workspace.experiments.find((experiment) => experiment.id === decision.experimentId)}
      experiments={workspace.experiments.filter((experiment) => experiment.ideaId === decision.ideaId)}
      idea={workspace.ideas.find((idea) => idea.id === decision.ideaId)}
      popout={query.popout === "1"}
      startEditing={query.mode === "edit"}
    />
  );
}
