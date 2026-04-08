export type IdeaStatus =
  | "Inbox"
  | "Exploring"
  | "Running"
  | "Iterating"
  | "Paused"
  | "Archived"
  | "Paper-ready";

export type ExperimentStatus = "Planned" | "Running" | "Done" | "Failed" | "Superseded";

export type Idea = {
  id: string;
  title: string;
  summary: string;
  motivation: string;
  hypothesis: string;
  novelty: string;
  status: IdeaStatus;
  priority: "Low" | "Medium" | "High";
  tags: string[];
  relatedPapers: string[];
  createdAt: string;
  updatedAt: string;
};

export type Experiment = {
  id: string;
  ideaId: string;
  title: string;
  objective: string;
  experimentType: string;
  status: ExperimentStatus;
  modelName: string;
  methodChanges: string;
  datasetName: string;
  datasetVersion: string;
  configJson: string;
  serverAssetId?: string;
  linkedAssetIds: string[];
  runtimeEnv: string;
  branchName: string;
  commitId: string;
  runCommand: string;
  wandbUrl: string;
  logPath: string;
  ckptPath: string;
  resultMetricsJson: string;
  resultSummary: string;
  analysis: string;
  nextSteps: string;
  createdAt: string;
  updatedAt: string;
};

export type DecisionLog = {
  id: string;
  ideaId: string;
  experimentId?: string;
  title: string;
  decisionType: "continue" | "pause" | "pivot" | "replace" | "archive";
  content: string;
  createdAt: string;
};

export type TimelineEvent = {
  id: string;
  label: string;
  detail: string;
  createdAt: string;
  type: "idea" | "experiment" | "decision" | "asset" | "graph";
};

export type VaultAssetType = "Token" | "Server" | "Platform" | "Template";

export type VaultAsset = {
  id: string;
  assetType: VaultAssetType;
  name: string;
  provider: string;
  metadata: Record<string, string>;
  maskedPreview: string;
  status: "Active" | "Expired" | "Revoked" | "Archived";
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
};

export type VaultAuditAction = "create" | "update" | "reveal" | "copy" | "revoke" | "archive" | "delete";

export type VaultAuditLog = {
  id: string;
  assetId?: string;
  actionType: VaultAuditAction;
  actorId: string;
  metadata: Record<string, string>;
  createdAt: string;
};

export type IdeaProfile = {
  ideaId: string;
  profileSummary: string;
  problemStatement: string;
  methodSummary: string;
  assumptions: string[];
  noveltyPoints: string[];
  experimentSignals: string[];
  keywords: string[];
  embeddingVector?: string;
  updatedAt: string;
};

export type IdeaRelationStatus = "Suggested" | "Accepted" | "Hidden" | "Rejected";

export type IdeaRelation = {
  id: string;
  sourceIdeaId: string;
  targetIdeaId: string;
  relationType: string;
  confidence: number;
  status: IdeaRelationStatus;
  reviewNote: string;
  rationale: string;
  evidence: string[];
  generatedByModel: boolean;
  modelProvider: string;
  modelName: string;
  analysisVersion: string;
  createdAt: string;
  updatedAt: string;
};

export type GraphAnalysisJob = {
  id: string;
  scope: string;
  status: "running" | "done" | "failed";
  provider: string;
  modelName: string;
  config: Record<string, string>;
  relationsProposed: number;
  relationsInserted: number;
  candidatePairs: number;
  fallbackUsed: boolean;
  startedAt: string;
  finishedAt?: string;
  errorMessage?: string;
};

export type ResearchMapSnapshot = {
  profiles: IdeaProfile[];
  relations: IdeaRelation[];
  jobs: GraphAnalysisJob[];
};

export type AIAnalysisMode = "Conservative" | "Balanced" | "Exploratory";
export type AIAnalysisFocus = "Problem-oriented" | "Method-oriented" | "Evolution-oriented" | "Experiment-oriented";
export type GraphGranularity = "Coarse" | "Medium" | "Fine";
export type RefreshBehavior =
  | "Manual refresh only"
  | "Refresh on idea creation"
  | "Refresh on idea update"
  | "Scheduled batch refresh"
  | "Incremental refresh only for changed nodes";

export type AIAnalysisSettings = {
  analysisMode: AIAnalysisMode;
  analysisFocus: AIAnalysisFocus;
  graphGranularity: GraphGranularity;
  refreshBehavior: RefreshBehavior;
  modelProvider: string;
  modelName: string;
  maxCandidateNeighbors: number;
  confidenceThreshold: number;
  tokenBudget: number;
  maxGraphDensity: number;
  explanationVerbosity: "Concise" | "Detailed";
  updatedAt?: string;
};

export type WorkspaceSnapshot = {
  ideas: Idea[];
  experiments: Experiment[];
  decisions: DecisionLog[];
  timeline: TimelineEvent[];
  vaultAssets: VaultAsset[];
  vaultAuditLogs: VaultAuditLog[];
  researchMap: ResearchMapSnapshot;
  aiSettings: AIAnalysisSettings;
};
