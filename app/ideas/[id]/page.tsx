import { notFound } from "next/navigation";
import { IdeaDetailPage } from "@/components/detail-pages";
import { getWorkspaceSnapshot } from "@/lib/repository";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string; popout?: string }>;
};

export default async function IdeaPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const workspace = await getWorkspaceSnapshot();
  const idea = workspace.ideas.find((item) => item.id === id);

  if (!idea) {
    notFound();
  }

  return (
    <IdeaDetailPage
      experimentCount={workspace.experiments.filter((experiment) => experiment.ideaId === idea.id).length}
      idea={idea}
      popout={query.popout === "1"}
      startEditing={query.mode === "edit"}
    />
  );
}
