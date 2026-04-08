"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CreateDecisionPanel,
  CreateExperimentPanel,
  CreateIdeaPanel,
  CreateVaultAssetPanel,
  ActiveThreadsPanel,
  DecisionDetailPanel,
  DecisionList,
  ExperimentComparisonPanel,
  ExperimentDetailPanel,
  ExperimentList,
  IdeaDetailPanel,
  IdeaList,
  RelationDetailPanel,
  ResearchMapCanvas,
  AISettingsPanel,
  ResearchMapSummary,
  StatCard,
  StaleExperimentsPanel,
  TimelineList,
  TodayPanel,
  VaultAssetDetailPanel,
  VaultAssetList,
  VaultAuditList,
} from "@/components/workspace-ui";
import { decisionTypes, experimentStatuses, ideaStatuses, sections } from "@/lib/constants";
import type { Section } from "@/lib/constants";
import { parseMetadataLines } from "@/lib/form-utils";
import { useWorkspace } from "@/lib/use-workspace";
import type {
  DecisionLog,
  Experiment,
  ExperimentStatus,
  AIAnalysisSettings,
  Idea,
  IdeaRelationStatus,
  IdeaStatus,
  ResearchMapSnapshot,
  VaultAsset,
  VaultAssetType,
} from "@/lib/types";

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const {
    decisions,
    aiSettings,
    error,
    experiments,
    ideas,
    isLoading,
    loadWorkspace,
    researchMap,
    setError,
    setResearchMap,
    setAISettings,
    timeline,
    vaultAssets,
    vaultAuditLogs
  } = useWorkspace();
  const [isSaving, setIsSaving] = useState(false);
  const [ideaQuery, setIdeaQuery] = useState("");
  const [ideaStatusFilter, setIdeaStatusFilter] = useState<IdeaStatus | "All">("All");
  const [experimentQuery, setExperimentQuery] = useState("");
  const [experimentStatusFilter, setExperimentStatusFilter] = useState<ExperimentStatus | "All">("All");
  const [decisionQuery, setDecisionQuery] = useState("");
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const [comparedExperimentIds, setComparedExperimentIds] = useState<string[]>([]);
  const [selectedVaultAssetId, setSelectedVaultAssetId] = useState<string | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<{ assetId: string; value: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(null);
  const [relationStatusFilter, setRelationStatusFilter] = useState<IdeaRelationStatus | "All">("All");
  const [relationTypeFilter, setRelationTypeFilter] = useState("All");
  const [relationProviderFilter, setRelationProviderFilter] = useState("All");
  const [relationMinConfidence, setRelationMinConfidence] = useState(0);
  const [graphViewMode, setGraphViewMode] = useState<"Network" | "Evolution" | "Clusters">("Network");

  const activeIdeas = ideas.filter((idea) => !["Archived", "Paused"].includes(idea.status));
  const runningExperiments = experiments.filter((experiment) => experiment.status === "Running");
  const selectedIdea = ideas.find((idea) => idea.id === selectedIdeaId) ?? null;
  const selectedExperiment = experiments.find((experiment) => experiment.id === selectedExperimentId) ?? null;
  const selectedDecision = decisions.find((decision) => decision.id === selectedDecisionId) ?? null;
  const selectedVaultAsset = vaultAssets.find((asset) => asset.id === selectedVaultAssetId) ?? null;
  const selectedRelation = researchMap.relations.find((relation) => relation.id === selectedRelationId) ?? null;
  const comparedExperiments = comparedExperimentIds
    .map((id) => experiments.find((experiment) => experiment.id === id))
    .filter((experiment): experiment is Experiment => Boolean(experiment));

  const filteredIdeas = useMemo(() => {
    const query = ideaQuery.trim().toLowerCase();

    return ideas.filter((idea) => {
      const matchesQuery =
        !query ||
        [
          idea.title,
          idea.summary,
          idea.motivation,
          idea.hypothesis,
          idea.novelty,
          ...idea.tags,
          ...idea.relatedPapers
        ].some((value) => value.toLowerCase().includes(query));
      const matchesStatus = ideaStatusFilter === "All" || idea.status === ideaStatusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [ideaQuery, ideaStatusFilter, ideas]);

  const filteredExperiments = useMemo(() => {
    const query = experimentQuery.trim().toLowerCase();

    return experiments.filter((experiment) => {
      const matchesQuery =
        !query ||
        [
          experiment.title,
          experiment.objective,
          experiment.experimentType,
          experiment.modelName,
          experiment.methodChanges,
          experiment.datasetName,
          experiment.datasetVersion,
          experiment.runtimeEnv,
          experiment.branchName,
          experiment.commitId,
          experiment.runCommand,
          experiment.wandbUrl,
          experiment.logPath,
          experiment.ckptPath,
          experiment.resultSummary,
          experiment.analysis,
          experiment.nextSteps
        ].some((value) => value.toLowerCase().includes(query));
      const matchesStatus = experimentStatusFilter === "All" || experiment.status === experimentStatusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [experimentQuery, experimentStatusFilter, experiments]);

  const filteredDecisions = useMemo(() => {
    const query = decisionQuery.trim().toLowerCase();

    return decisions.filter(
      (decision) =>
        !query ||
        [decision.title, decision.content, decision.decisionType].some((value) => value.toLowerCase().includes(query))
    );
  }, [decisionQuery, decisions]);

  const experimentCounts = useMemo(() => {
    return experiments.reduce<Record<string, number>>((counts, experiment) => {
      counts[experiment.ideaId] = (counts[experiment.ideaId] ?? 0) + 1;
      return counts;
    }, {});
  }, [experiments]);

  const relationFilterOptions = useMemo(() => {
    return {
      providers: Array.from(new Set(researchMap.relations.map((relation) => relation.modelProvider))),
      types: Array.from(new Set(researchMap.relations.map((relation) => relation.relationType)))
    };
  }, [researchMap.relations]);

  const filteredRelations = useMemo(() => {
    return researchMap.relations.filter((relation) => {
      const matchesStatus = relationStatusFilter === "All" || relation.status === relationStatusFilter;
      const matchesType = relationTypeFilter === "All" || relation.relationType === relationTypeFilter;
      const matchesProvider = relationProviderFilter === "All" || relation.modelProvider === relationProviderFilter;
      const matchesConfidence = relation.confidence >= relationMinConfidence;
      return matchesStatus && matchesType && matchesProvider && matchesConfidence;
    });
  }, [relationMinConfidence, relationProviderFilter, relationStatusFilter, relationTypeFilter, researchMap.relations]);

  async function createIdea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const summary = String(form.get("summary") ?? "").trim();

    if (!title || !summary) {
      return;
    }

    setIsSaving(true);
    setError(null);
    const response = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        summary,
        motivation: String(form.get("motivation") ?? "").trim(),
        hypothesis: String(form.get("hypothesis") ?? "").trim() || "Hypothesis to be refined.",
        novelty: String(form.get("novelty") ?? "").trim(),
        status: String(form.get("status")) as IdeaStatus,
        tags: String(form.get("tags") ?? "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        relatedPapers: String(form.get("relatedPapers") ?? "")
          .split("\n")
          .map((paper) => paper.trim())
          .filter(Boolean)
      })
    });

    if (!response.ok) {
      setError("Could not save idea.");
      setIsSaving(false);
      return;
    }

    event.currentTarget.reset();
    setNotice("Idea saved.");
    await loadWorkspace();
    setIsSaving(false);
  }

  async function createExperiment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();

    if (!title) {
      return;
    }

    setIsSaving(true);
    setError(null);
    const response = await fetch("/api/experiments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ideaId: String(form.get("ideaId")),
        title,
        objective: String(form.get("objective") ?? "").trim() || "Objective to be clarified.",
        experimentType: String(form.get("experimentType") ?? "New method trial"),
        status: String(form.get("status")) as ExperimentStatus,
        modelName: String(form.get("modelName") ?? "").trim(),
        methodChanges: String(form.get("methodChanges") ?? "").trim(),
        datasetName: String(form.get("datasetName") ?? "").trim() || "Not specified",
        datasetVersion: String(form.get("datasetVersion") ?? "").trim(),
        configJson: String(form.get("configJson") ?? "").trim() || "{}",
        linkedAssetIds: form.getAll("linkedAssetIds").map(String),
        runtimeEnv: String(form.get("runtimeEnv") ?? "").trim(),
        branchName: String(form.get("branchName") ?? "").trim(),
        commitId: String(form.get("commitId") ?? "").trim(),
        runCommand: String(form.get("runCommand") ?? "").trim(),
        wandbUrl: String(form.get("wandbUrl") ?? "").trim(),
        logPath: String(form.get("logPath") ?? "").trim(),
        ckptPath: String(form.get("ckptPath") ?? "").trim(),
        resultMetricsJson: String(form.get("resultMetricsJson") ?? "").trim() || "{}",
        resultSummary: String(form.get("resultSummary") ?? "").trim() || "Pending analysis.",
        analysis: String(form.get("analysis") ?? "").trim(),
        nextSteps: String(form.get("nextSteps") ?? "").trim()
      })
    });

    if (!response.ok) {
      setError("Could not save experiment.");
      setIsSaving(false);
      return;
    }

    event.currentTarget.reset();
    setNotice("Experiment saved.");
    await loadWorkspace();
    setIsSaving(false);
  }

  async function createDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const content = String(form.get("content") ?? "").trim();

    if (!title || !content) {
      return;
    }

    setIsSaving(true);
    setError(null);
    const response = await fetch("/api/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ideaId: String(form.get("ideaId")),
        experimentId: String(form.get("experimentId") ?? ""),
        title,
        content,
        decisionType: String(form.get("decisionType")) as DecisionLog["decisionType"]
      })
    });

    if (!response.ok) {
      setError("Could not save decision.");
      setIsSaving(false);
      return;
    }

    event.currentTarget.reset();
    setNotice("Decision saved.");
    await loadWorkspace();
    setIsSaving(false);
  }

  async function createVaultAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const assetType = String(form.get("assetType") ?? "Token") as VaultAssetType;
    const metadata = parseMetadataLines(String(form.get("metadata") ?? ""));

    setIsSaving(true);
    setError(null);
    const response = await fetch("/api/vault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetType,
        name: String(form.get("name") ?? "").trim(),
        provider: String(form.get("provider") ?? "").trim(),
        secret: String(form.get("secret") ?? "").trim(),
        metadata,
        status: "Active"
      })
    });

    if (!response.ok) {
      setError("Could not save vault asset.");
      setIsSaving(false);
      return;
    }

    event.currentTarget.reset();
    setNotice("Vault asset saved.");
    await loadWorkspace();
    setIsSaving(false);
  }

  async function updateIdeaStatus(id: string, status: IdeaStatus) {
    await mutateRecord(`/api/ideas/${encodeURIComponent(id)}`, "PATCH", { status }, "Could not update idea.");
  }

  async function updateIdeaDetails(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await mutateRecord(
      `/api/ideas/${encodeURIComponent(id)}`,
      "PATCH",
      {
        title: String(form.get("title") ?? "").trim(),
        summary: String(form.get("summary") ?? "").trim(),
        motivation: String(form.get("motivation") ?? "").trim(),
        hypothesis: String(form.get("hypothesis") ?? "").trim(),
        novelty: String(form.get("novelty") ?? "").trim(),
        status: String(form.get("status")) as IdeaStatus,
        priority: String(form.get("priority")) as Idea["priority"],
        tags: String(form.get("tags") ?? "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        relatedPapers: String(form.get("relatedPapers") ?? "")
          .split("\n")
          .map((paper) => paper.trim())
          .filter(Boolean)
      },
      "Could not update idea."
    );
  }

  async function updateExperimentStatus(id: string, status: ExperimentStatus) {
    await mutateRecord(
      `/api/experiments/${encodeURIComponent(id)}`,
      "PATCH",
      { status },
      "Could not update experiment."
    );
  }

  async function updateExperimentDetails(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await mutateRecord(
      `/api/experiments/${encodeURIComponent(id)}`,
      "PATCH",
      {
        title: String(form.get("title") ?? "").trim(),
        objective: String(form.get("objective") ?? "").trim(),
        experimentType: String(form.get("experimentType") ?? "").trim(),
        status: String(form.get("status")) as ExperimentStatus,
        modelName: String(form.get("modelName") ?? "").trim(),
        methodChanges: String(form.get("methodChanges") ?? "").trim(),
        datasetName: String(form.get("datasetName") ?? "").trim(),
        datasetVersion: String(form.get("datasetVersion") ?? "").trim(),
        configJson: String(form.get("configJson") ?? "").trim() || "{}",
        runtimeEnv: String(form.get("runtimeEnv") ?? "").trim(),
        branchName: String(form.get("branchName") ?? "").trim(),
        commitId: String(form.get("commitId") ?? "").trim(),
        runCommand: String(form.get("runCommand") ?? "").trim(),
        wandbUrl: String(form.get("wandbUrl") ?? "").trim(),
        logPath: String(form.get("logPath") ?? "").trim(),
        ckptPath: String(form.get("ckptPath") ?? "").trim(),
        resultMetricsJson: String(form.get("resultMetricsJson") ?? "").trim() || "{}",
        resultSummary: String(form.get("resultSummary") ?? "").trim(),
        analysis: String(form.get("analysis") ?? "").trim(),
        nextSteps: String(form.get("nextSteps") ?? "").trim()
      },
      "Could not update experiment."
    );
  }

  async function updateDecisionType(id: string, decisionType: DecisionLog["decisionType"]) {
    await mutateRecord(
      `/api/decisions/${encodeURIComponent(id)}`,
      "PATCH",
      { decisionType },
      "Could not update decision."
    );
  }

  async function updateDecisionDetails(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await mutateRecord(
      `/api/decisions/${encodeURIComponent(id)}`,
      "PATCH",
      {
        title: String(form.get("title") ?? "").trim(),
        content: String(form.get("content") ?? "").trim(),
        decisionType: String(form.get("decisionType")) as DecisionLog["decisionType"],
        experimentId: String(form.get("experimentId") ?? "")
      },
      "Could not update decision."
    );
  }

  async function deleteRecord(url: string, message: string) {
    if (!window.confirm("Delete this record? This cannot be undone.")) {
      return;
    }

    await mutateRecord(url, "DELETE", undefined, message);
  }

  async function mutateRecord(url: string, method: "PATCH" | "DELETE", body: unknown, message: string) {
    setIsSaving(true);
    setError(null);
    const response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    if (!response.ok) {
      setError(message);
      setIsSaving(false);
      return;
    }

    setNotice("Changes saved.");
    await loadWorkspace();
    setIsSaving(false);
  }

  async function updateVaultAssetDetails(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await mutateRecord(
      `/api/vault/${encodeURIComponent(id)}`,
      "PATCH",
      {
        assetType: String(form.get("assetType") ?? "Token") as VaultAssetType,
        name: String(form.get("name") ?? "").trim(),
        provider: String(form.get("provider") ?? "").trim(),
        secret: String(form.get("secret") ?? "").trim(),
        status: String(form.get("status") ?? "Active") as VaultAsset["status"],
        metadata: parseMetadataLines(String(form.get("metadata") ?? ""))
      },
      "Could not update vault asset."
    );
  }

  async function accessVaultSecret(assetId: string, actionType: "reveal" | "copy") {
    const vaultPassword = window.prompt("Enter vault password to continue.");

    if (!vaultPassword) {
      return;
    }

    setIsSaving(true);
    setError(null);
    const response = await fetch(`/api/vault/${encodeURIComponent(assetId)}/secret`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionType, vaultPassword })
    });

    if (!response.ok) {
      setError("Could not access vault secret.");
      setIsSaving(false);
      return;
    }

    const payload = (await response.json()) as { secret: string };

    if (actionType === "copy") {
      await navigator.clipboard.writeText(payload.secret);
      setNotice("Secret copied. Access was logged.");
      setRevealedSecret(null);
    } else {
      setRevealedSecret({ assetId, value: payload.secret });
      setNotice("Secret revealed temporarily. Access was logged.");
      window.setTimeout(() => setRevealedSecret((current) => (current?.assetId === assetId ? null : current)), 30000);
    }

    await loadWorkspace();
    setIsSaving(false);
  }

  async function regenerateMap() {
    setIsSaving(true);
    setError(null);
    const response = await fetch("/api/research-map", { method: "POST" });

    if (!response.ok) {
      setError("Could not regenerate research map.");
      setIsSaving(false);
      return;
    }

    setResearchMap((await response.json()) as ResearchMapSnapshot);
    setNotice("Research map regenerated.");
    await loadWorkspace();
    setIsSaving(false);
  }

  async function updateAISettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsSaving(true);
    setError(null);
    const response = await fetch("/api/ai-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analysisMode: String(form.get("analysisMode")),
        analysisFocus: String(form.get("analysisFocus")),
        graphGranularity: String(form.get("graphGranularity")),
        refreshBehavior: String(form.get("refreshBehavior")),
        modelProvider: String(form.get("modelProvider") ?? "").trim(),
        modelName: String(form.get("modelName") ?? "").trim(),
        maxCandidateNeighbors: String(form.get("maxCandidateNeighbors")),
        confidenceThreshold: String(form.get("confidenceThreshold")),
        tokenBudget: String(form.get("tokenBudget")),
        maxGraphDensity: String(form.get("maxGraphDensity")),
        explanationVerbosity: String(form.get("explanationVerbosity")) as AIAnalysisSettings["explanationVerbosity"]
      })
    });

    if (!response.ok) {
      setError("Could not update AI settings.");
      setIsSaving(false);
      return;
    }

    setAISettings((await response.json()) as AIAnalysisSettings);
    setNotice("AI settings saved.");
    setIsSaving(false);
  }

  async function updateRelationStatus(id: string, status: IdeaRelationStatus, reviewNote?: string) {
    await mutateRecord(
      `/api/research-map/relations/${encodeURIComponent(id)}`,
      "PATCH",
      { status, reviewNote },
      "Could not update relation."
    );
    setNotice(`Research relation ${status.toLowerCase()}.`);
  }

  async function deleteRelation(id: string) {
    await mutateRecord(
      `/api/research-map/relations/${encodeURIComponent(id)}`,
      "DELETE",
      undefined,
      "Could not delete relation."
    );
    setSelectedRelationId(null);
    setNotice("Research relation deleted.");
  }

  function toggleExperimentComparison(id: string) {
    setComparedExperimentIds((current) =>
      current.includes(id) ? current.filter((experimentId) => experimentId !== id) : [...current, id]
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-title">ResearchLog</div>
          <div className="brand-copy">Structured memory for research ideas, experiments, decisions, and assets.</div>
        </div>
        <nav className="nav-list" aria-label="ResearchLog sections">
          {sections.map((section) => (
            <button
              className={`nav-button ${activeSection === section.id ? "active" : ""}`}
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              type="button"
            >
              {section.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="main">
        <header className="page-header">
          <div>
            <div className="eyebrow">MVP workspace</div>
            <h1>Resume the thread of your research.</h1>
            <p className="header-copy">
              Capture ideas as objects, connect experiments to the question they test, and keep the reasoning behind
              pivots close to the work.
            </p>
          </div>
          <div className="toolbar">
            <button className="button" onClick={() => setActiveSection("ideas")} type="button">
              New idea
            </button>
            <button className="secondary-button" onClick={() => setActiveSection("experiments")} type="button">
              New experiment
            </button>
          </div>
        </header>

        {error && <div className="notice error-notice">{error}</div>}
        {notice && (
          <div className="notice">
            {notice}
            <button className="link-button" onClick={() => setNotice(null)} type="button">
              Dismiss
            </button>
          </div>
        )}
        {isLoading && <div className="notice">Loading workspace data...</div>}

        {activeSection === "dashboard" && (
          <>
            <section className="grid dashboard-grid">
              <StatCard label="Active ideas" value={activeIdeas.length} detail="Not paused or archived" />
              <StatCard label="Experiments" value={experiments.length} detail={`${runningExperiments.length} running`} />
              <StatCard label="Decisions" value={decisions.length} detail="Reasoning captured" />
              <StatCard label="Graph relations" value={researchMap.relations.length} detail={`${researchMap.profiles.length} profiles`} />
            </section>

            <section className="grid workbench-grid">
              <div className="side-stack">
                <TodayPanel
                  activeIdeas={activeIdeas}
                  experiments={experiments}
                  onOpenExperiment={(id) => {
                    setSelectedExperimentId(id);
                    setActiveSection("experiments");
                  }}
                />
                <ActiveThreadsPanel
                  experimentCounts={experimentCounts}
                  ideas={activeIdeas}
                  onOpenIdea={(id) => {
                    setSelectedIdeaId(id);
                    setActiveSection("ideas");
                  }}
                />
              </div>
              <div className="side-stack">
                <StaleExperimentsPanel
                  experiments={experiments}
                  onOpenExperiment={(id) => {
                    setSelectedExperimentId(id);
                    setActiveSection("experiments");
                  }}
                />
                <div className="card">
                  <div className="card-title">
                    <h2>Recent Decisions</h2>
                    <span className="pill">{decisions.length} logged</span>
                  </div>
                  <DecisionList decisions={decisions.slice(0, 4)} ideas={ideas} onOpenDecision={(id) => {
                    setSelectedDecisionId(id);
                    setActiveSection("decisions");
                  }} />
                </div>
                <div className="card">
                  <div className="card-title">
                    <h2>Recent Activity</h2>
                  </div>
                  <TimelineList timeline={timeline.slice(0, 5)} />
                </div>
              </div>
            </section>
          </>
        )}

        {activeSection === "ideas" && (
          <section className="grid workbench-grid">
            <div className="card">
              <div className="card-title">
                <h2>Ideas</h2>
                <span className="pill">{filteredIdeas.length} shown</span>
              </div>
              <div className="filters">
                <input
                  aria-label="Search ideas"
                  onChange={(event) => setIdeaQuery(event.target.value)}
                  placeholder="Search title, summary, hypothesis, tags"
                  value={ideaQuery}
                />
                <select
                  aria-label="Filter ideas by status"
                  onChange={(event) => setIdeaStatusFilter(event.target.value as IdeaStatus | "All")}
                  value={ideaStatusFilter}
                >
                  <option>All</option>
                  {ideaStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>
              <IdeaList
                disabled={isSaving}
                experimentCounts={experimentCounts}
                ideas={filteredIdeas}
                onDeleteIdea={(id) => deleteRecord(`/api/ideas/${encodeURIComponent(id)}`, "Could not delete idea.")}
                onOpenIdea={setSelectedIdeaId}
                onStatusChange={updateIdeaStatus}
                selectedIdeaId={selectedIdeaId}
              />
            </div>
            <div className="side-stack">
              {selectedIdea && (
                <IdeaDetailPanel
                  disabled={isSaving}
                  idea={selectedIdea}
                  onClose={() => setSelectedIdeaId(null)}
                  onSubmit={updateIdeaDetails}
                />
              )}
              <CreateIdeaPanel disabled={isSaving} onSubmit={createIdea} />
            </div>
          </section>
        )}

        {activeSection === "experiments" && (
          <section className="grid workbench-grid">
            <div className="card">
              <div className="card-title">
                <h2>Experiments</h2>
                <span className="pill">{filteredExperiments.length} shown</span>
              </div>
              <div className="filters">
                <input
                  aria-label="Search experiments"
                  onChange={(event) => setExperimentQuery(event.target.value)}
                  placeholder="Search title, objective, dataset, results"
                  value={experimentQuery}
                />
                <select
                  aria-label="Filter experiments by status"
                  onChange={(event) => setExperimentStatusFilter(event.target.value as ExperimentStatus | "All")}
                  value={experimentStatusFilter}
                >
                  <option>All</option>
                  {experimentStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>
              {comparedExperiments.length > 0 && (
                <ExperimentComparisonPanel
                  experiments={comparedExperiments}
                  ideaById={new Map(ideas.map((idea) => [idea.id, idea.title]))}
                  onClear={() => setComparedExperimentIds([])}
                />
              )}
              <ExperimentList
                comparedExperimentIds={comparedExperimentIds}
                disabled={isSaving}
                experiments={filteredExperiments}
                ideas={ideas}
                onDeleteExperiment={(id) =>
                  deleteRecord(`/api/experiments/${encodeURIComponent(id)}`, "Could not delete experiment.")
                }
                onOpenExperiment={setSelectedExperimentId}
                onStatusChange={updateExperimentStatus}
                onToggleCompare={toggleExperimentComparison}
                selectedExperimentId={selectedExperimentId}
              />
            </div>
            <div className="side-stack">
              {selectedExperiment && (
                <ExperimentDetailPanel
                  disabled={isSaving}
                  experiment={selectedExperiment}
                  ideaTitle={ideas.find((idea) => idea.id === selectedExperiment.ideaId)?.title ?? "Unlinked idea"}
                  vaultAssets={vaultAssets}
                  onClose={() => setSelectedExperimentId(null)}
                  onSubmit={updateExperimentDetails}
                />
              )}
              <CreateExperimentPanel disabled={isSaving || ideas.length === 0} ideas={ideas} onSubmit={createExperiment} />
            </div>
          </section>
        )}

        {activeSection === "decisions" && (
          <section className="grid workbench-grid">
            <div className="card">
              <div className="card-title">
                <h2>Decision Log</h2>
                <span className="pill">{filteredDecisions.length} shown</span>
              </div>
              <div className="filters">
                <input
                  aria-label="Search decisions"
                  onChange={(event) => setDecisionQuery(event.target.value)}
                  placeholder="Search title, reasoning, decision type"
                  value={decisionQuery}
                />
              </div>
              <DecisionList
                decisions={filteredDecisions}
                disabled={isSaving}
                ideas={ideas}
                onDeleteDecision={(id) =>
                  deleteRecord(`/api/decisions/${encodeURIComponent(id)}`, "Could not delete decision.")
                }
                onOpenDecision={setSelectedDecisionId}
                onTypeChange={updateDecisionType}
                selectedDecisionId={selectedDecisionId}
              />
            </div>
            <div className="side-stack">
              {selectedDecision && (
                <DecisionDetailPanel
                  decision={selectedDecision}
                  disabled={isSaving}
                  experiments={experiments.filter((experiment) => experiment.ideaId === selectedDecision.ideaId)}
                  ideaTitle={ideas.find((idea) => idea.id === selectedDecision.ideaId)?.title ?? "Unlinked idea"}
                  onClose={() => setSelectedDecisionId(null)}
                  onSubmit={updateDecisionDetails}
                />
              )}
              <CreateDecisionPanel
                disabled={isSaving || ideas.length === 0}
                experiments={experiments}
                ideas={ideas}
                onSubmit={createDecision}
              />
            </div>
          </section>
        )}

        {activeSection === "timeline" && (
          <section className="card">
            <div className="card-title">
              <h2>Timeline</h2>
              <span className="pill">Chronological research memory</span>
            </div>
            <TimelineList timeline={timeline} />
          </section>
        )}

        {activeSection === "vault" && (
          <section className="grid workbench-grid">
            <div className="card">
              <div className="card-title">
                <h2>Vault Assets</h2>
                <span className="pill">{vaultAssets.length} assets</span>
              </div>
              <VaultAssetList
                assets={vaultAssets}
                onOpenAsset={setSelectedVaultAssetId}
                selectedAssetId={selectedVaultAssetId}
              />
            </div>
            <div className="side-stack">
              {selectedVaultAsset && (
                <VaultAssetDetailPanel
                  asset={selectedVaultAsset}
                  disabled={isSaving}
                  onAccessSecret={accessVaultSecret}
                  onClose={() => setSelectedVaultAssetId(null)}
                  onDeleteAsset={(id) => deleteRecord(`/api/vault/${encodeURIComponent(id)}`, "Could not delete vault asset.")}
                  onSubmit={updateVaultAssetDetails}
                  revealedSecret={revealedSecret?.assetId === selectedVaultAsset.id ? revealedSecret.value : null}
                />
              )}
              <CreateVaultAssetPanel disabled={isSaving} onSubmit={createVaultAsset} />
              <div className="card">
                <div className="card-title">
                  <h2>Audit Trail</h2>
                  <span className="pill">{vaultAuditLogs.length} recent</span>
                </div>
                <VaultAuditList audits={vaultAuditLogs} assets={vaultAssets} />
              </div>
            </div>
          </section>
        )}

        {activeSection === "map" && (
          <section className="grid workbench-grid">
            <div className="card">
              <div className="card-title">
                <div>
                  <h2>Research Map</h2>
                  <p className="microcopy">Generate relation candidates, then review what belongs in memory.</p>
                </div>
                <button className="button" disabled={isSaving} onClick={regenerateMap} type="button">
                  Regenerate
                </button>
              </div>
              <div className="filters graph-filters">
                <select
                  aria-label="Filter relations by status"
                  onChange={(event) => setRelationStatusFilter(event.target.value as IdeaRelationStatus | "All")}
                  value={relationStatusFilter}
                >
                  <option>All</option>
                  <option>Suggested</option>
                  <option>Accepted</option>
                  <option>Hidden</option>
                  <option>Rejected</option>
                </select>
                <select
                  aria-label="Filter relations by type"
                  onChange={(event) => setRelationTypeFilter(event.target.value)}
                  value={relationTypeFilter}
                >
                  <option>All</option>
                  {relationFilterOptions.types.map((relationType) => (
                    <option key={relationType}>{relationType}</option>
                  ))}
                </select>
                <select
                  aria-label="Filter relations by provider"
                  onChange={(event) => setRelationProviderFilter(event.target.value)}
                  value={relationProviderFilter}
                >
                  <option>All</option>
                  {relationFilterOptions.providers.map((provider) => (
                    <option key={provider}>{provider}</option>
                  ))}
                </select>
                <label className="inline-control confidence-filter">
                  <span>Min confidence</span>
                  <input
                    aria-label="Minimum relation confidence"
                    max="0.95"
                    min="0"
                    onChange={(event) => setRelationMinConfidence(Number(event.target.value))}
                    step="0.05"
                    type="number"
                    value={relationMinConfidence}
                  />
                </label>
                <select
                  aria-label="Choose research map view"
                  onChange={(event) => setGraphViewMode(event.target.value as "Network" | "Evolution" | "Clusters")}
                  value={graphViewMode}
                >
                  <option>Network</option>
                  <option>Evolution</option>
                  <option>Clusters</option>
                </select>
              </div>
              <ResearchMapCanvas
                ideas={ideas}
                relations={filteredRelations}
                selectedRelationId={selectedRelationId}
                viewMode={graphViewMode}
                onSelectRelation={setSelectedRelationId}
              />
            </div>
            <div className="side-stack">
              <ResearchMapSummary ideas={ideas} map={researchMap} visibleRelations={filteredRelations.length} />
              <AISettingsPanel disabled={isSaving} onSubmit={updateAISettings} settings={aiSettings} />
              {selectedRelation && (
                <RelationDetailPanel
                  key={selectedRelation.id}
                  ideaById={new Map(ideas.map((idea) => [idea.id, idea]))}
                  disabled={isSaving}
                  onDeleteRelation={deleteRelation}
                  onUpdateStatus={updateRelationStatus}
                  relation={selectedRelation}
                />
              )}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

