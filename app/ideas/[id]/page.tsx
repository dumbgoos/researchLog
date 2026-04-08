import { notFound } from "next/navigation";
import { IdeaDetailPage } from "@/components/detail-pages";
import { getWorkspaceSnapshot } from "@/lib/repository";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function IdeaPage({ params }: PageProps) {
  const { id } = await params;
  const workspace = await getWorkspaceSnapshot();
  const idea = workspace.ideas.find((item) => item.id === id);

  if (!idea) {
    notFound();
  }

  return (
    <IdeaDetailPage
      experimentCount={workspace.experiments.filter((experiment) => experiment.ideaId === idea.id).length}
      idea={idea}
    />
  );
}
