import { Database } from "bun:sqlite";

export function createTestDatabase(path: string) {
  const db = new Database(path);
  db.run(`
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS Idea (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  motivation TEXT NOT NULL DEFAULT '',
  hypothesis TEXT NOT NULL,
  novelty TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  tagsJson TEXT NOT NULL DEFAULT '[]',
  relatedPapersJson TEXT NOT NULL DEFAULT '[]',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS Experiment (
  id TEXT PRIMARY KEY NOT NULL,
  ideaId TEXT NOT NULL,
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  experimentType TEXT NOT NULL,
  status TEXT NOT NULL,
  modelName TEXT NOT NULL DEFAULT '',
  methodChanges TEXT NOT NULL DEFAULT '',
  datasetName TEXT NOT NULL,
  datasetVersion TEXT NOT NULL DEFAULT '',
  configJson TEXT NOT NULL DEFAULT '{}',
  serverAssetId TEXT,
  runtimeEnv TEXT NOT NULL DEFAULT '',
  branchName TEXT NOT NULL DEFAULT '',
  commitId TEXT NOT NULL DEFAULT '',
  runCommand TEXT NOT NULL DEFAULT '',
  wandbUrl TEXT NOT NULL DEFAULT '',
  logPath TEXT NOT NULL DEFAULT '',
  ckptPath TEXT NOT NULL DEFAULT '',
  resultMetricsJson TEXT NOT NULL DEFAULT '{}',
  resultSummary TEXT NOT NULL,
  resultArtifactsJson TEXT NOT NULL DEFAULT '[]',
  analysis TEXT NOT NULL DEFAULT '',
  nextSteps TEXT NOT NULL DEFAULT '',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT Experiment_ideaId_fkey FOREIGN KEY (ideaId) REFERENCES Idea (id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS DecisionLog (
  id TEXT PRIMARY KEY NOT NULL,
  ideaId TEXT NOT NULL,
  experimentId TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  decisionType TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT DecisionLog_ideaId_fkey FOREIGN KEY (ideaId) REFERENCES Idea (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT DecisionLog_experimentId_fkey FOREIGN KEY (experimentId) REFERENCES Experiment (id) ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS TimelineEvent (
  id TEXT PRIMARY KEY NOT NULL,
  label TEXT NOT NULL,
  detail TEXT NOT NULL,
  type TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS VaultAsset (
  id TEXT PRIMARY KEY NOT NULL,
  assetType TEXT NOT NULL,
  name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT '',
  metadataJson TEXT NOT NULL DEFAULT '{}',
  encryptedSecret TEXT,
  maskedPreview TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lastUsedAt DATETIME
);
CREATE TABLE IF NOT EXISTS VaultAuditLog (
  id TEXT PRIMARY KEY NOT NULL,
  assetId TEXT,
  actionType TEXT NOT NULL,
  actorId TEXT NOT NULL DEFAULT 'local-user',
  metadataJson TEXT NOT NULL DEFAULT '{}',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT VaultAuditLog_assetId_fkey FOREIGN KEY (assetId) REFERENCES VaultAsset (id) ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS ExperimentAssetLink (
  id TEXT PRIMARY KEY NOT NULL,
  experimentId TEXT NOT NULL,
  assetId TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ExperimentAssetLink_experimentId_fkey FOREIGN KEY (experimentId) REFERENCES Experiment (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ExperimentAssetLink_assetId_fkey FOREIGN KEY (assetId) REFERENCES VaultAsset (id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS ExperimentAssetLink_experimentId_assetId_key ON ExperimentAssetLink(experimentId, assetId);
CREATE TABLE IF NOT EXISTS IdeaProfile (
  ideaId TEXT PRIMARY KEY NOT NULL,
  profileSummary TEXT NOT NULL,
  problemStatement TEXT NOT NULL,
  methodSummary TEXT NOT NULL,
  assumptionsJson TEXT NOT NULL DEFAULT '[]',
  noveltyPointsJson TEXT NOT NULL DEFAULT '[]',
  experimentSignalsJson TEXT NOT NULL DEFAULT '[]',
  keywordsJson TEXT NOT NULL DEFAULT '[]',
  embeddingVector TEXT,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT IdeaProfile_ideaId_fkey FOREIGN KEY (ideaId) REFERENCES Idea (id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS IdeaRelation (
  id TEXT PRIMARY KEY NOT NULL,
  sourceIdeaId TEXT NOT NULL,
  targetIdeaId TEXT NOT NULL,
  relationType TEXT NOT NULL,
  confidence REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Suggested',
  reviewNote TEXT NOT NULL DEFAULT '',
  rationale TEXT NOT NULL,
  evidenceJson TEXT NOT NULL DEFAULT '[]',
  generatedByModel BOOLEAN NOT NULL DEFAULT false,
  modelProvider TEXT NOT NULL DEFAULT 'rule-engine',
  modelName TEXT NOT NULL DEFAULT 'local-rules-v1',
  analysisVersion TEXT NOT NULL DEFAULT 'rules-v1',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT IdeaRelation_sourceIdeaId_fkey FOREIGN KEY (sourceIdeaId) REFERENCES Idea (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT IdeaRelation_targetIdeaId_fkey FOREIGN KEY (targetIdeaId) REFERENCES Idea (id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS IdeaRelation_sourceIdeaId_targetIdeaId_relationType_analysisVersion_key ON IdeaRelation(sourceIdeaId, targetIdeaId, relationType, analysisVersion);
CREATE TABLE IF NOT EXISTS GraphAnalysisJob (
  id TEXT PRIMARY KEY NOT NULL,
  scope TEXT NOT NULL,
  status TEXT NOT NULL,
  provider TEXT NOT NULL,
  modelName TEXT NOT NULL,
  configJson TEXT NOT NULL DEFAULT '{}',
  relationsProposed INTEGER NOT NULL DEFAULT 0,
  relationsInserted INTEGER NOT NULL DEFAULT 0,
  candidatePairs INTEGER NOT NULL DEFAULT 0,
  fallbackUsed BOOLEAN NOT NULL DEFAULT false,
  startedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finishedAt DATETIME,
  errorMessage TEXT
);
CREATE TABLE IF NOT EXISTS AIAnalysisSettings (
  id TEXT PRIMARY KEY NOT NULL,
  analysisMode TEXT NOT NULL DEFAULT 'Balanced',
  analysisFocus TEXT NOT NULL DEFAULT 'Evolution-oriented',
  graphGranularity TEXT NOT NULL DEFAULT 'Medium',
  refreshBehavior TEXT NOT NULL DEFAULT 'Manual refresh only',
  modelProvider TEXT NOT NULL DEFAULT 'rule-engine',
  modelName TEXT NOT NULL DEFAULT 'local-rules-v1',
  maxCandidateNeighbors INTEGER NOT NULL DEFAULT 8,
  confidenceThreshold REAL NOT NULL DEFAULT 0.55,
  tokenBudget INTEGER NOT NULL DEFAULT 4000,
  maxGraphDensity REAL NOT NULL DEFAULT 0.35,
  explanationVerbosity TEXT NOT NULL DEFAULT 'Concise',
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);
  db.close();
}
