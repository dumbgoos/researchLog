import { notFound } from "next/navigation";
import { DecisionDetailPage } from "@/components/detail-pages";
import { getWorkspaceSnapshot } from "@/lib/repository";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DecisionPage({ params }: PageProps) {
  const { id } = await params;
  const workspace = await getWorkspaceSnapshot();
  const decision = workspace.decisions.find((item) => item.id === id);

  if (!decision) {
    notFound();
  }

  return (
    <DecisionDetailPage
      decision={decision}
      experiment={workspace.experiments.find((experiment) => experiment.id === decision.experimentId)}
      idea={workspace.ideas.find((idea) => idea.id === decision.ideaId)}
    />
  );
}
