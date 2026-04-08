import type { DecisionLog, Experiment, Idea, TimelineEvent } from "./types";

export const initialIdeas: Idea[] = [
  {
    id: "idea-graph-memory",
    title: "LLM-assisted idea graph for experiment recall",
    summary: "Generate explainable relationships between research directions from notes and experiment summaries.",
    motivation: "Research context is hard to recover once ideas branch across notes, runs, and decisions.",
    hypothesis: "Researchers can recover context faster when semantic links are generated from structured research objects.",
    novelty: "Combine structured experiment memory with explainable relation discovery between research directions.",
    status: "Running",
    priority: "High",
    tags: ["llm", "knowledge-graph", "research-memory"],
    relatedPapers: [],
    createdAt: "2026-04-08",
    updatedAt: "2026-04-08"
  },
  {
    id: "idea-vault-linkage",
    title: "Research vault linked to experiments",
    summary: "Track tokens, servers, platforms, and templates as research assets instead of loose credentials.",
    motivation: "Credentials and infrastructure details are often disconnected from the experiments that used them.",
    hypothesis: "Experiment reproducibility improves when assets are linked to runs without exposing secrets.",
    novelty: "Treat research infrastructure as linkable workflow assets rather than generic password entries.",
    status: "Exploring",
    priority: "Medium",
    tags: ["vault", "security", "reproducibility"],
    relatedPapers: [],
    createdAt: "2026-04-07",
    updatedAt: "2026-04-07"
  }
];

export const initialExperiments: Experiment[] = [
  {
    id: "exp-profile-ablation",
    ideaId: "idea-graph-memory",
    title: "Idea profile field ablation",
    objective: "Compare relation quality with and without hypothesis, novelty, and experiment signals.",
    experimentType: "Ablation",
    status: "Planned",
    modelName: "gpt-4.1-mini",
    methodChanges: "Remove one profile section at a time before relation inference.",
    datasetName: "local research notes",
    datasetVersion: "seed-v0",
    configJson: "{\n  \"topK\": 8,\n  \"mode\": \"balanced\"\n}",
    linkedAssetIds: [],
    runtimeEnv: "local",
    branchName: "main",
    commitId: "",
    runCommand: "bun run graph:analyze -- --mode balanced",
    wandbUrl: "",
    logPath: "logs/profile-ablation.log",
    ckptPath: "",
    resultMetricsJson: "{}",
    resultSummary: "Pending first run.",
    analysis: "Define a small hand-labeled set before running the ablation.",
    nextSteps: "Prepare candidate idea pairs and rubric.",
    createdAt: "2026-04-08",
    updatedAt: "2026-04-08"
  },
  {
    id: "exp-vault-copy-audit",
    ideaId: "idea-vault-linkage",
    title: "Vault copy audit flow",
    objective: "Sketch how reveal and copy events should be logged without storing plaintext.",
    experimentType: "Failure analysis",
    status: "Done",
    modelName: "",
    methodChanges: "Review vault UX against security requirements.",
    datasetName: "security requirements",
    datasetVersion: "prd-v1",
    configJson: "{}",
    linkedAssetIds: [],
    runtimeEnv: "local",
    branchName: "main",
    commitId: "",
    runCommand: "",
    wandbUrl: "",
    logPath: "",
    ckptPath: "",
    resultMetricsJson: "{}",
    resultSummary: "Keep copy/reveal behind re-auth and record audit metadata.",
    analysis: "The MVP should not store SSH private keys or root passwords.",
    nextSteps: "Add Vault models in v1.5.",
    createdAt: "2026-04-07",
    updatedAt: "2026-04-07"
  }
];

export const initialDecisions: DecisionLog[] = [
  {
    id: "decision-mvp-first",
    ideaId: "idea-graph-memory",
    title: "Defer graph inference until after research memory loop",
    decisionType: "continue",
    content: "Ship Idea, Experiment, Decision Log, and Timeline flows before adding the AI graph pipeline.",
    createdAt: "2026-04-08"
  }
];

export const initialTimeline: TimelineEvent[] = [
  {
    id: "timeline-1",
    label: "Idea updated",
    detail: "LLM-assisted idea graph moved to Running.",
    createdAt: "2026-04-08",
    type: "idea"
  },
  {
    id: "timeline-2",
    label: "Experiment planned",
    detail: "Idea profile field ablation added under graph memory.",
    createdAt: "2026-04-08",
    type: "experiment"
  },
  {
    id: "timeline-3",
    label: "Decision logged",
    detail: "MVP will focus on the research memory loop first.",
    createdAt: "2026-04-08",
    type: "decision"
  }
];
