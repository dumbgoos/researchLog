import type { DecisionLog, ExperimentStatus, IdeaStatus, VaultAssetType } from "./types";

export type Section = "dashboard" | "ideas" | "experiments" | "decisions" | "timeline" | "vault" | "map";

export const sections: { id: Section; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "ideas", label: "Ideas" },
  { id: "experiments", label: "Experiments" },
  { id: "decisions", label: "Decision Log" },
  { id: "timeline", label: "Timeline" },
  { id: "vault", label: "Vault" },
  { id: "map", label: "Research Map" }
];

export const ideaStatuses: IdeaStatus[] = [
  "Inbox",
  "Exploring",
  "Running",
  "Iterating",
  "Paused",
  "Archived",
  "Paper-ready"
];

export const experimentStatuses: ExperimentStatus[] = ["Planned", "Running", "Done", "Failed", "Superseded"];

export const decisionTypes: DecisionLog["decisionType"][] = ["continue", "pause", "pivot", "replace", "archive"];

export const vaultAssetTypes: VaultAssetType[] = ["Token", "Server", "Platform", "Template"];
