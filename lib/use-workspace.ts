"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  DecisionLog,
  Experiment,
  Idea,
  ResearchMapSnapshot,
  AIAnalysisSettings,
  TimelineEvent,
  VaultAsset,
  VaultAuditLog,
  WorkspaceSnapshot
} from "./types";

export function useWorkspace() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [decisions, setDecisions] = useState<DecisionLog[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [vaultAssets, setVaultAssets] = useState<VaultAsset[]>([]);
  const [vaultAuditLogs, setVaultAuditLogs] = useState<VaultAuditLog[]>([]);
  const [researchMap, setResearchMap] = useState<ResearchMapSnapshot>({ profiles: [], relations: [], jobs: [] });
  const [aiSettings, setAISettings] = useState<AIAnalysisSettings>({
    analysisMode: "Balanced",
    analysisFocus: "Evolution-oriented",
    graphGranularity: "Medium",
    refreshBehavior: "Manual refresh only",
    modelProvider: "rule-engine",
    modelName: "local-rules-v1",
    maxCandidateNeighbors: 8,
    confidenceThreshold: 0.55,
    tokenBudget: 4000,
    maxGraphDensity: 0.35,
    explanationVerbosity: "Concise"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    setError(null);
    const response = await fetch("/api/workspace");

    if (!response.ok) {
      setError("Could not load workspace data.");
      setIsLoading(false);
      return null;
    }

    const snapshot = (await response.json()) as WorkspaceSnapshot;
    setIdeas(snapshot.ideas);
    setExperiments(snapshot.experiments);
    setDecisions(snapshot.decisions);
    setTimeline(snapshot.timeline);
    setVaultAssets(snapshot.vaultAssets);
    setVaultAuditLogs(snapshot.vaultAuditLogs);
    setResearchMap(snapshot.researchMap);
    setAISettings(snapshot.aiSettings);
    setIsLoading(false);
    return snapshot;
  }, []);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  return {
    decisions,
    aiSettings,
    error,
    experiments,
    ideas,
    isLoading,
    loadWorkspace,
    researchMap,
    setAISettings,
    setError,
    setResearchMap,
    timeline,
    vaultAssets,
    vaultAuditLogs
  };
}
