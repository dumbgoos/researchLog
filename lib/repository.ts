import { prisma } from "./prisma";
import { countGraphCandidatePairs, getGraphAnalysisProvider } from "./graph-providers";
import type { GraphRelationCandidate, IdeaForGraph } from "./graph-providers";
import { initialDecisions, initialExperiments, initialIdeas, initialTimeline } from "./sample-data";
import { decryptVaultSecret, encryptVaultSecret, isVaultAuthorized, maskSecret } from "./vault-crypto";
import type {
  DecisionLog,
  Experiment,
  ExperimentResultArtifact,
  Idea,
  IdeaProfile,
  IdeaRelation,
  IdeaRelationStatus,
  GraphAnalysisJob,
  AIAnalysisSettings,
  ResearchMapSnapshot,
  TimelineEvent,
  VaultAsset,
  VaultAssetType,
  VaultAuditLog,
  WorkspaceSnapshot
} from "./types";

type IdeaRecord = Awaited<ReturnType<typeof prisma.idea.findFirst>>;
type ExperimentRecord =
  | (NonNullable<Awaited<ReturnType<typeof prisma.experiment.findFirst>>> & { assetLinks?: { assetId: string }[] })
  | null;
type DecisionRecord = Awaited<ReturnType<typeof prisma.decisionLog.findFirst>>;
type TimelineRecord = Awaited<ReturnType<typeof prisma.timelineEvent.findFirst>>;
type VaultAssetRecord = Awaited<ReturnType<typeof prisma.vaultAsset.findFirst>>;
type VaultAuditRecord = Awaited<ReturnType<typeof prisma.vaultAuditLog.findFirst>>;
type IdeaProfileRecord = Awaited<ReturnType<typeof prisma.ideaProfile.findFirst>>;
type IdeaRelationRecord = Awaited<ReturnType<typeof prisma.ideaRelation.findFirst>>;
type GraphAnalysisJobRecord = Awaited<ReturnType<typeof prisma.graphAnalysisJob.findFirst>>;
type AIAnalysisSettingsRecord = Awaited<ReturnType<typeof prisma.aIAnalysisSettings.findFirst>>;

export type CreateVaultAssetInput = {
  assetType: VaultAssetType;
  name: string;
  provider: string;
  metadata: Record<string, string>;
  secret?: string;
  status?: VaultAsset["status"];
};

export type UpdateVaultAssetInput = Partial<CreateVaultAssetInput>;

export async function getWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  await seedWorkspaceIfEmpty();

  const [ideas, experiments, decisions, timeline] = await Promise.all([
    prisma.idea.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.experiment.findMany({ include: { assetLinks: { select: { assetId: true } } }, orderBy: { updatedAt: "desc" } }),
    prisma.decisionLog.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.timelineEvent.findMany({ orderBy: { createdAt: "desc" } })
  ]);
  const [vaultAssets, vaultAuditLogs] = await Promise.all([
    prisma.vaultAsset.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.vaultAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 25 })
  ]);
  const researchMap = await getResearchMapSnapshot();
  const aiSettings = await getAIAnalysisSettings();

  return {
    ideas: ideas.map(mapIdea),
    experiments: experiments.map(mapExperiment),
    decisions: decisions.map(mapDecision),
    timeline: timeline.map(mapTimelineEvent),
    vaultAssets: vaultAssets.map(mapVaultAsset),
    vaultAuditLogs: vaultAuditLogs.map(mapVaultAuditLog),
    researchMap,
    aiSettings
  };
}

export async function getAIAnalysisSettings(): Promise<AIAnalysisSettings> {
  const settings = await prisma.aIAnalysisSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {}
  });

  return mapAIAnalysisSettings(settings);
}

export async function updateAIAnalysisSettings(input: Partial<AIAnalysisSettings>): Promise<AIAnalysisSettings> {
  const settings = await prisma.aIAnalysisSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      ...serializeAIAnalysisSettings(input)
    },
    update: serializeAIAnalysisSettings(input)
  });

  return mapAIAnalysisSettings(settings);
}

export async function getResearchMapSnapshot(): Promise<ResearchMapSnapshot> {
  const [profiles, relations, jobs] = await Promise.all([
    prisma.ideaProfile.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.ideaRelation.findMany({ orderBy: [{ confidence: "desc" }, { updatedAt: "desc" }] }),
    prisma.graphAnalysisJob.findMany({ orderBy: { startedAt: "desc" }, take: 10 })
  ]);

  return {
    profiles: profiles.map(mapIdeaProfile),
    relations: relations.map(mapIdeaRelation),
    jobs: jobs.map(mapGraphAnalysisJob)
  };
}

export async function regenerateResearchMap(): Promise<ResearchMapSnapshot> {
  const settings = await getAIAnalysisSettings();
  const baseJobConfig = { ...settings, fallbackUsed: false };
  const job = await prisma.graphAnalysisJob.create({
    data: {
      id: `graph-job-${crypto.randomUUID()}`,
      scope: "all",
      status: "running",
      provider: settings.modelProvider,
      modelName: settings.modelName,
      configJson: JSON.stringify(baseJobConfig)
    }
  });

  try {
    const ideas = await prisma.idea.findMany({
      include: {
        decisionLogs: true,
        experiments: true
      },
      orderBy: { updatedAt: "desc" }
    });

    await prisma.$transaction([
      ...ideas.map((idea) => {
        const profile = buildIdeaProfile(idea);
        return prisma.ideaProfile.upsert({
          where: { ideaId: idea.id },
          update: profile,
          create: { ideaId: idea.id, ...profile }
        });
      }),
      prisma.ideaRelation.deleteMany({
        where: {
          analysisVersion: { contains: `${settings.modelProvider}-` },
          status: "Suggested"
        }
      })
    ]);

    const candidatePairs = countGraphCandidatePairs(ideas, settings);
    const inference = await inferRelationsWithFallback(ideas, settings);

    if (inference.providerUsed !== settings.modelProvider) {
      await prisma.ideaRelation.deleteMany({
        where: {
          analysisVersion: { contains: `${inference.providerUsed}-` },
          status: "Suggested"
        }
      });
    }

    const relationCandidates = inference.relations.map((relation) => ({
      id: `relation-${crypto.randomUUID()}`,
      sourceIdeaId: relation.sourceIdeaId,
      targetIdeaId: relation.targetIdeaId,
      relationType: relation.relationType,
      confidence: relation.confidence,
      status: "Suggested" as const,
      rationale: relation.rationale,
      evidenceJson: JSON.stringify(relation.evidence),
      generatedByModel: relation.generatedByModel,
      modelProvider: relation.modelProvider,
      modelName: relation.modelName,
      analysisVersion: relation.analysisVersion
    }));
    const existingRelationKeys = new Set(
      (
        await prisma.ideaRelation.findMany({
          select: {
            sourceIdeaId: true,
            targetIdeaId: true,
            relationType: true,
            analysisVersion: true
          }
        })
      ).map((relation) => relationKey(relation))
    );
    const relations = relationCandidates.filter((relation) => !existingRelationKeys.has(relationKey(relation)));

    if (relations.length > 0) {
      await prisma.ideaRelation.createMany({
        data: relations
      });
    }

    await prisma.graphAnalysisJob.update({
      where: { id: job.id },
      data: {
        status: "done",
        configJson: JSON.stringify({
          ...settings,
          fallbackReason: inference.fallbackReason ?? "",
          fallbackUsed: inference.fallbackUsed,
          providerUsed: inference.providerUsed
        }),
        errorMessage: inference.fallbackReason,
        fallbackUsed: inference.fallbackUsed,
        candidatePairs,
        finishedAt: new Date(),
        relationsInserted: relations.length,
        relationsProposed: relationCandidates.length
      }
    });

    await createTimelineEvent({
      label: "Research map regenerated",
      detail: `${ideas.length} ideas, ${relations.length} relations`,
      type: "graph"
    });
  } catch (error) {
    await prisma.graphAnalysisJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        fallbackUsed: settings.modelProvider !== "rule-engine",
        errorMessage: error instanceof Error ? error.message : "Unknown graph analysis error"
      }
    });
  }

  return getResearchMapSnapshot();
}

async function inferRelationsWithFallback(
  ideas: IdeaForGraph[],
  settings: AIAnalysisSettings
): Promise<{
  fallbackReason?: string;
  fallbackUsed: boolean;
  providerUsed: string;
  relations: GraphRelationCandidate[];
}> {
  try {
    return {
      fallbackUsed: false,
      providerUsed: settings.modelProvider,
      relations: await getGraphAnalysisProvider(settings).inferRelations(ideas, settings)
    };
  } catch (error) {
    if (settings.modelProvider === "rule-engine") {
      throw error;
    }

    const fallbackSettings = {
      ...settings,
      modelProvider: "rule-engine",
      modelName: "local-rules-v1"
    };

    return {
      fallbackReason: error instanceof Error ? error.message : "Unknown graph provider error",
      fallbackUsed: true,
      providerUsed: fallbackSettings.modelProvider,
      relations: await getGraphAnalysisProvider(fallbackSettings).inferRelations(ideas, fallbackSettings)
    };
  }
}

export async function updateIdeaRelationStatus(
  id: string,
  status: IdeaRelationStatus,
  reviewNote?: string
): Promise<IdeaRelation> {
  const relation = await prisma.ideaRelation.update({
    where: { id },
    data: {
      status,
      ...(reviewNote !== undefined ? { reviewNote } : {})
    }
  });

  await createTimelineEvent({
    label: `Research relation ${status.toLowerCase()}`,
    detail: `${relation.relationType} relation at ${Math.round(relation.confidence * 100)}% confidence`,
    type: "graph"
  });

  return mapIdeaRelation(relation);
}

async function refreshResearchMapIfNeeded(changeType: "create" | "update"): Promise<void> {
  const settings = await getAIAnalysisSettings();
  const shouldRefresh =
    settings.refreshBehavior === "Incremental refresh only for changed nodes" ||
    (changeType === "create" && settings.refreshBehavior === "Refresh on idea creation") ||
    (changeType === "update" && settings.refreshBehavior === "Refresh on idea update");

  if (shouldRefresh) {
    await regenerateResearchMap();
  }
}

export async function deleteIdeaRelation(id: string): Promise<void> {
  const relation = await prisma.ideaRelation.delete({ where: { id } });

  await createTimelineEvent({
    label: "Research relation deleted",
    detail: `${relation.relationType} relation removed from the map`,
    type: "graph"
  });
}

export async function createIdea(input: Omit<Idea, "id" | "priority" | "createdAt" | "updatedAt">): Promise<Idea> {
  const idea = await prisma.idea.create({
    data: {
      id: `idea-${crypto.randomUUID()}`,
      title: input.title,
      summary: input.summary,
      motivation: input.motivation,
      hypothesis: input.hypothesis,
      novelty: input.novelty,
      status: input.status,
      priority: "Medium",
      tagsJson: JSON.stringify(input.tags),
      relatedPapersJson: JSON.stringify(input.relatedPapers)
    }
  });

  await createTimelineEvent({
    label: "Idea created",
    detail: input.title,
    type: "idea"
  });

  await refreshResearchMapIfNeeded("create");
  return mapIdea(idea);
}

export async function updateIdea(
  id: string,
  input: Partial<
    Pick<Idea, "title" | "summary" | "motivation" | "hypothesis" | "novelty" | "status" | "priority" | "tags" | "relatedPapers">
  >
): Promise<Idea> {
  const previous = await prisma.idea.findUnique({ where: { id }, select: { status: true } });
  const idea = await prisma.idea.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.summary !== undefined ? { summary: input.summary } : {}),
      ...(input.motivation !== undefined ? { motivation: input.motivation } : {}),
      ...(input.hypothesis !== undefined ? { hypothesis: input.hypothesis } : {}),
      ...(input.novelty !== undefined ? { novelty: input.novelty } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.tags !== undefined ? { tagsJson: JSON.stringify(input.tags) } : {}),
      ...(input.relatedPapers !== undefined ? { relatedPapersJson: JSON.stringify(input.relatedPapers) } : {})
    }
  });

  await createTimelineEvent({
    label: previous?.status !== idea.status ? "Idea status changed" : "Idea updated",
    detail: previous?.status !== idea.status ? `${idea.title}: ${previous?.status ?? "Unknown"} -> ${idea.status}` : idea.title,
    type: "idea"
  });

  await refreshResearchMapIfNeeded("update");
  return mapIdea(idea);
}

export async function deleteIdea(id: string): Promise<void> {
  const idea = await prisma.idea.findUnique({ where: { id }, select: { title: true } });

  if (!idea) {
    return;
  }

  await prisma.idea.delete({ where: { id } });
  await createTimelineEvent({
    label: "Idea deleted",
    detail: idea.title,
    type: "idea"
  });
  await refreshResearchMapIfNeeded("update");
}

export async function createExperiment(
  input: Omit<Experiment, "id" | "createdAt" | "updatedAt">
): Promise<Experiment> {
  const experiment = await prisma.experiment.create({
    data: {
      id: `exp-${crypto.randomUUID()}`,
      ideaId: input.ideaId,
      title: input.title,
      objective: input.objective,
      experimentType: input.experimentType,
      status: input.status,
      modelName: input.modelName,
      methodChanges: input.methodChanges,
      datasetName: input.datasetName,
      datasetVersion: input.datasetVersion,
      configJson: input.configJson,
      serverAssetId: input.serverAssetId,
      runtimeEnv: input.runtimeEnv,
      branchName: input.branchName,
      commitId: input.commitId,
      runCommand: input.runCommand,
      wandbUrl: input.wandbUrl,
      logPath: input.logPath,
      ckptPath: input.ckptPath,
      resultMetricsJson: input.resultMetricsJson,
      resultSummary: input.resultSummary,
      resultArtifactsJson: JSON.stringify(input.resultArtifacts),
      analysis: input.analysis,
      nextSteps: input.nextSteps,
      assetLinks: input.linkedAssetIds.length
        ? {
            create: input.linkedAssetIds.map((assetId) => ({
              id: `link-${crypto.randomUUID()}`,
              asset: { connect: { id: assetId } }
            }))
          }
        : undefined
    }
  });

  await createTimelineEvent({
    label: "Experiment added",
    detail: input.title,
    type: "experiment"
  });

  await refreshResearchMapIfNeeded("update");
  return mapExperiment(experiment);
}

export async function updateExperiment(
  id: string,
  input: Partial<
    Pick<
      Experiment,
      | "title"
      | "objective"
      | "experimentType"
      | "status"
      | "modelName"
      | "methodChanges"
      | "datasetName"
      | "datasetVersion"
      | "configJson"
      | "serverAssetId"
      | "linkedAssetIds"
      | "runtimeEnv"
      | "branchName"
      | "commitId"
      | "runCommand"
      | "wandbUrl"
      | "logPath"
      | "ckptPath"
      | "resultMetricsJson"
      | "resultSummary"
      | "resultArtifacts"
      | "analysis"
      | "nextSteps"
    >
  >
): Promise<Experiment> {
  const previous = await prisma.experiment.findUnique({ where: { id }, select: { status: true } });
  const experiment = await prisma.experiment.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.objective !== undefined ? { objective: input.objective } : {}),
      ...(input.experimentType !== undefined ? { experimentType: input.experimentType } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.modelName !== undefined ? { modelName: input.modelName } : {}),
      ...(input.methodChanges !== undefined ? { methodChanges: input.methodChanges } : {}),
      ...(input.datasetName !== undefined ? { datasetName: input.datasetName } : {}),
      ...(input.datasetVersion !== undefined ? { datasetVersion: input.datasetVersion } : {}),
      ...(input.configJson !== undefined ? { configJson: input.configJson } : {}),
      ...(input.serverAssetId !== undefined ? { serverAssetId: input.serverAssetId || null } : {}),
      ...(input.runtimeEnv !== undefined ? { runtimeEnv: input.runtimeEnv } : {}),
      ...(input.branchName !== undefined ? { branchName: input.branchName } : {}),
      ...(input.commitId !== undefined ? { commitId: input.commitId } : {}),
      ...(input.runCommand !== undefined ? { runCommand: input.runCommand } : {}),
      ...(input.wandbUrl !== undefined ? { wandbUrl: input.wandbUrl } : {}),
      ...(input.logPath !== undefined ? { logPath: input.logPath } : {}),
      ...(input.ckptPath !== undefined ? { ckptPath: input.ckptPath } : {}),
      ...(input.resultMetricsJson !== undefined ? { resultMetricsJson: input.resultMetricsJson } : {}),
      ...(input.resultSummary !== undefined ? { resultSummary: input.resultSummary } : {}),
      ...(input.resultArtifacts !== undefined ? { resultArtifactsJson: JSON.stringify(input.resultArtifacts) } : {}),
      ...(input.analysis !== undefined ? { analysis: input.analysis } : {}),
      ...(input.nextSteps !== undefined ? { nextSteps: input.nextSteps } : {})
    }
  });

  if (input.linkedAssetIds !== undefined) {
    await prisma.$transaction([
      prisma.experimentAssetLink.deleteMany({ where: { experimentId: id } }),
      ...input.linkedAssetIds.map((assetId) =>
        prisma.experimentAssetLink.create({
          data: {
            id: `link-${crypto.randomUUID()}`,
            experimentId: id,
            assetId
          }
        })
      )
    ]);
  }

  await createTimelineEvent({
    label: previous?.status !== experiment.status ? "Experiment status changed" : "Experiment updated",
    detail:
      previous?.status !== experiment.status
        ? `${experiment.title}: ${previous?.status ?? "Unknown"} -> ${experiment.status}`
        : experiment.title,
    type: "experiment"
  });

  await refreshResearchMapIfNeeded("update");
  const updatedExperiment = await prisma.experiment.findUnique({
    where: { id },
    include: { assetLinks: { select: { assetId: true } } }
  });

  return mapExperiment(updatedExperiment ?? experiment);
}

export async function deleteExperiment(id: string): Promise<void> {
  const experiment = await prisma.experiment.findUnique({ where: { id }, select: { title: true } });

  if (!experiment) {
    return;
  }

  await prisma.experiment.delete({ where: { id } });
  await createTimelineEvent({
    label: "Experiment deleted",
    detail: experiment.title,
    type: "experiment"
  });
  await refreshResearchMapIfNeeded("update");
}

export async function createDecision(input: Omit<DecisionLog, "id" | "createdAt">): Promise<DecisionLog> {
  const decision = await prisma.decisionLog.create({
    data: {
      id: `decision-${crypto.randomUUID()}`,
      ideaId: input.ideaId,
      experimentId: input.experimentId,
      title: input.title,
      content: input.content,
      decisionType: input.decisionType
    }
  });

  await createTimelineEvent({
    label: "Decision logged",
    detail: input.title,
    type: "decision"
  });

  await refreshResearchMapIfNeeded("update");
  return mapDecision(decision);
}

export async function updateDecision(
  id: string,
  input: Partial<Pick<DecisionLog, "title" | "content" | "decisionType" | "experimentId">>
): Promise<DecisionLog> {
  const previous = await prisma.decisionLog.findUnique({ where: { id }, select: { decisionType: true } });
  const decision = await prisma.decisionLog.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.decisionType !== undefined ? { decisionType: input.decisionType } : {}),
      ...(input.experimentId !== undefined ? { experimentId: input.experimentId || null } : {})
    }
  });

  await createTimelineEvent({
    label: previous?.decisionType !== decision.decisionType ? "Decision type changed" : "Decision updated",
    detail:
      previous?.decisionType !== decision.decisionType
        ? `${decision.title}: ${previous?.decisionType ?? "unknown"} -> ${decision.decisionType}`
        : decision.title,
    type: "decision"
  });

  await refreshResearchMapIfNeeded("update");
  return mapDecision(decision);
}

export async function deleteDecision(id: string): Promise<void> {
  const decision = await prisma.decisionLog.findUnique({ where: { id }, select: { title: true } });

  if (!decision) {
    return;
  }

  await prisma.decisionLog.delete({ where: { id } });
  await createTimelineEvent({
    label: "Decision deleted",
    detail: decision.title,
    type: "decision"
  });
  await refreshResearchMapIfNeeded("update");
}

export async function createVaultAsset(input: CreateVaultAssetInput): Promise<VaultAsset> {
  const secret = input.secret?.trim() ?? "";
  const asset = await prisma.vaultAsset.create({
    data: {
      id: `asset-${crypto.randomUUID()}`,
      assetType: input.assetType,
      name: input.name,
      provider: input.provider,
      metadataJson: JSON.stringify(input.metadata),
      encryptedSecret: secret ? encryptVaultSecret(secret) : null,
      maskedPreview: input.assetType === "Token" ? maskSecret(secret) : "",
      status: input.status ?? "Active"
    }
  });

  await logVaultAudit(asset.id, "create", { assetType: input.assetType });

  await createTimelineEvent({
    label: "Vault asset created",
    detail: asset.name,
    type: "asset"
  });

  return mapVaultAsset(asset);
}

export async function updateVaultAsset(id: string, input: UpdateVaultAssetInput): Promise<VaultAsset> {
  const secret = input.secret?.trim();
  const asset = await prisma.vaultAsset.update({
    where: { id },
    data: {
      ...(input.assetType !== undefined ? { assetType: input.assetType } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.provider !== undefined ? { provider: input.provider } : {}),
      ...(input.metadata !== undefined ? { metadataJson: JSON.stringify(input.metadata) } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(secret !== undefined && secret
        ? {
            encryptedSecret: encryptVaultSecret(secret),
            maskedPreview: input.assetType === "Token" || input.assetType === undefined ? maskSecret(secret) : ""
          }
        : {})
    }
  });

  await logVaultAudit(id, input.status === "Revoked" ? "revoke" : input.status === "Archived" ? "archive" : "update");
  await createTimelineEvent({
    label: "Vault asset updated",
    detail: asset.name,
    type: "asset"
  });

  return mapVaultAsset(asset);
}

export async function deleteVaultAsset(id: string): Promise<void> {
  const asset = await prisma.vaultAsset.findUnique({ where: { id }, select: { name: true } });

  if (!asset) {
    return;
  }

  await logVaultAudit(id, "delete");
  await prisma.vaultAsset.delete({ where: { id } });
  await createTimelineEvent({
    label: "Vault asset deleted",
    detail: asset.name,
    type: "asset"
  });
}

export async function accessVaultSecret(
  id: string,
  password: string,
  actionType: "reveal" | "copy"
): Promise<{ secret: string; maskedPreview: string }> {
  const existingAsset = await prisma.vaultAsset.findUnique({ where: { id }, select: { id: true, encryptedSecret: true } });

  if (!existingAsset?.encryptedSecret) {
    throw new Error("This vault asset does not contain a secret.");
  }

  if (!isVaultAuthorized(password)) {
    await logVaultAudit(id, actionType, { authorized: "false" });
    throw new Error("Vault authorization failed.");
  }

  const asset = await prisma.vaultAsset.update({
    where: { id },
    data: { lastUsedAt: new Date() }
  });

  await logVaultAudit(id, actionType, { authorized: "true" });
  return {
    secret: decryptVaultSecret(existingAsset.encryptedSecret),
    maskedPreview: asset.maskedPreview
  };
}

async function seedWorkspaceIfEmpty() {
  const ideaCount = await prisma.idea.count();

  if (ideaCount > 0) {
    return;
  }

  await prisma.$transaction([
    ...initialIdeas.map((idea) =>
      prisma.idea.create({
        data: {
          id: idea.id,
          title: idea.title,
          summary: idea.summary,
          motivation: idea.motivation,
          hypothesis: idea.hypothesis,
          novelty: idea.novelty,
          status: idea.status,
          priority: idea.priority,
          tagsJson: JSON.stringify(idea.tags),
          relatedPapersJson: JSON.stringify(idea.relatedPapers),
          createdAt: new Date(`${idea.createdAt}T00:00:00.000Z`),
          updatedAt: new Date(`${idea.updatedAt}T00:00:00.000Z`)
        }
      })
    ),
    ...initialExperiments.map((experiment) =>
      prisma.experiment.create({
        data: {
          id: experiment.id,
          ideaId: experiment.ideaId,
          title: experiment.title,
          objective: experiment.objective,
          experimentType: experiment.experimentType,
          status: experiment.status,
          modelName: experiment.modelName,
          methodChanges: experiment.methodChanges,
          datasetName: experiment.datasetName,
          datasetVersion: experiment.datasetVersion,
          configJson: experiment.configJson,
          serverAssetId: experiment.serverAssetId,
          runtimeEnv: experiment.runtimeEnv,
          branchName: experiment.branchName,
          commitId: experiment.commitId,
          runCommand: experiment.runCommand,
          wandbUrl: experiment.wandbUrl,
          logPath: experiment.logPath,
          ckptPath: experiment.ckptPath,
          resultMetricsJson: experiment.resultMetricsJson,
          resultSummary: experiment.resultSummary,
          resultArtifactsJson: JSON.stringify(experiment.resultArtifacts),
          analysis: experiment.analysis,
          nextSteps: experiment.nextSteps,
          createdAt: new Date(`${experiment.createdAt}T00:00:00.000Z`),
          updatedAt: new Date(`${experiment.updatedAt}T00:00:00.000Z`)
        }
      })
    ),
    ...initialDecisions.map((decision) =>
      prisma.decisionLog.create({
        data: {
          id: decision.id,
          ideaId: decision.ideaId,
          experimentId: decision.experimentId,
          title: decision.title,
          content: decision.content,
          decisionType: decision.decisionType,
          createdAt: new Date(`${decision.createdAt}T00:00:00.000Z`)
        }
      })
    ),
    ...initialTimeline.map((event) =>
      prisma.timelineEvent.create({
        data: {
          id: event.id,
          label: event.label,
          detail: event.detail,
          type: event.type,
          createdAt: new Date(`${event.createdAt}T00:00:00.000Z`)
        }
      })
    )
  ]);
}

async function createTimelineEvent(input: Omit<TimelineEvent, "id" | "createdAt">) {
  await prisma.timelineEvent.create({
    data: {
      id: `timeline-${crypto.randomUUID()}`,
      label: input.label,
      detail: input.detail,
      type: input.type
    }
  });
}

async function logVaultAudit(
  assetId: string,
  actionType: VaultAuditLog["actionType"],
  metadata: Record<string, string> = {}
) {
  await prisma.vaultAuditLog.create({
    data: {
      id: `audit-${crypto.randomUUID()}`,
      assetId,
      actionType,
      metadataJson: JSON.stringify(metadata)
    }
  });
}

function mapIdea(record: NonNullable<IdeaRecord>): Idea {
  return {
    id: record.id,
    title: record.title,
    summary: record.summary,
    motivation: record.motivation,
    hypothesis: record.hypothesis,
    novelty: record.novelty,
    status: record.status as Idea["status"],
    priority: record.priority as Idea["priority"],
    tags: parseStringArray(record.tagsJson),
    relatedPapers: parseStringArray(record.relatedPapersJson),
    createdAt: formatDate(record.createdAt),
    updatedAt: formatDate(record.updatedAt)
  };
}

function mapExperiment(record: NonNullable<ExperimentRecord>): Experiment {
  return {
    id: record.id,
    ideaId: record.ideaId,
    title: record.title,
    objective: record.objective,
    experimentType: record.experimentType,
    status: record.status as Experiment["status"],
    modelName: record.modelName,
    methodChanges: record.methodChanges,
    datasetName: record.datasetName,
    datasetVersion: record.datasetVersion,
    configJson: record.configJson,
    serverAssetId: record.serverAssetId ?? undefined,
    linkedAssetIds: "assetLinks" in record && Array.isArray(record.assetLinks) ? record.assetLinks.map((link) => link.assetId) : [],
    runtimeEnv: record.runtimeEnv,
    branchName: record.branchName,
    commitId: record.commitId,
    runCommand: record.runCommand,
    wandbUrl: record.wandbUrl,
    logPath: record.logPath,
    ckptPath: record.ckptPath,
    resultMetricsJson: record.resultMetricsJson,
    resultSummary: record.resultSummary,
    resultArtifacts: parseExperimentArtifacts(record.resultArtifactsJson),
    analysis: record.analysis,
    nextSteps: record.nextSteps,
    createdAt: formatDate(record.createdAt),
    updatedAt: formatDate(record.updatedAt)
  };
}

function mapDecision(record: NonNullable<DecisionRecord>): DecisionLog {
  return {
    id: record.id,
    ideaId: record.ideaId,
    experimentId: record.experimentId ?? undefined,
    title: record.title,
    content: record.content,
    decisionType: record.decisionType as DecisionLog["decisionType"],
    createdAt: formatDate(record.createdAt)
  };
}

function mapTimelineEvent(record: NonNullable<TimelineRecord>): TimelineEvent {
  return {
    id: record.id,
    label: record.label,
    detail: record.detail,
    type: record.type as TimelineEvent["type"],
    createdAt: formatDate(record.createdAt)
  };
}

function mapVaultAsset(record: NonNullable<VaultAssetRecord>): VaultAsset {
  return {
    id: record.id,
    assetType: record.assetType as VaultAsset["assetType"],
    name: record.name,
    provider: record.provider,
    metadata: parseStringRecord(record.metadataJson),
    maskedPreview: record.maskedPreview,
    status: record.status as VaultAsset["status"],
    createdAt: formatDate(record.createdAt),
    updatedAt: formatDate(record.updatedAt),
    lastUsedAt: record.lastUsedAt ? formatDate(record.lastUsedAt) : undefined
  };
}

function mapVaultAuditLog(record: NonNullable<VaultAuditRecord>): VaultAuditLog {
  return {
    id: record.id,
    assetId: record.assetId ?? undefined,
    actionType: record.actionType as VaultAuditLog["actionType"],
    actorId: record.actorId,
    metadata: parseStringRecord(record.metadataJson),
    createdAt: formatDate(record.createdAt)
  };
}

function mapIdeaProfile(record: NonNullable<IdeaProfileRecord>): IdeaProfile {
  return {
    ideaId: record.ideaId,
    profileSummary: record.profileSummary,
    problemStatement: record.problemStatement,
    methodSummary: record.methodSummary,
    assumptions: parseStringArray(record.assumptionsJson),
    noveltyPoints: parseStringArray(record.noveltyPointsJson),
    experimentSignals: parseStringArray(record.experimentSignalsJson),
    keywords: parseStringArray(record.keywordsJson),
    embeddingVector: record.embeddingVector ?? undefined,
    updatedAt: formatDate(record.updatedAt)
  };
}

function relationKey(relation: {
  sourceIdeaId: string;
  targetIdeaId: string;
  relationType: string;
  analysisVersion: string;
}): string {
  return [relation.sourceIdeaId, relation.targetIdeaId, relation.relationType, relation.analysisVersion].join("::");
}

function mapIdeaRelation(record: NonNullable<IdeaRelationRecord>): IdeaRelation {
  return {
    id: record.id,
    sourceIdeaId: record.sourceIdeaId,
    targetIdeaId: record.targetIdeaId,
    relationType: record.relationType,
    confidence: record.confidence,
    status: record.status as IdeaRelationStatus,
    reviewNote: record.reviewNote,
    rationale: record.rationale,
    evidence: parseStringArray(record.evidenceJson),
    generatedByModel: record.generatedByModel,
    modelProvider: record.modelProvider,
    modelName: record.modelName,
    analysisVersion: record.analysisVersion,
    createdAt: formatDate(record.createdAt),
    updatedAt: formatDate(record.updatedAt)
  };
}

function mapGraphAnalysisJob(record: NonNullable<GraphAnalysisJobRecord>): GraphAnalysisJob {
  return {
    id: record.id,
    scope: record.scope,
    status: record.status as GraphAnalysisJob["status"],
    provider: record.provider,
    modelName: record.modelName,
    config: parseStringRecord(record.configJson),
    fallbackUsed: record.fallbackUsed,
    candidatePairs: record.candidatePairs,
    relationsInserted: record.relationsInserted,
    relationsProposed: record.relationsProposed,
    startedAt: formatDate(record.startedAt),
    finishedAt: record.finishedAt ? formatDate(record.finishedAt) : undefined,
    errorMessage: record.errorMessage ?? undefined
  };
}

function mapAIAnalysisSettings(record: NonNullable<AIAnalysisSettingsRecord>): AIAnalysisSettings {
  return {
    analysisMode: record.analysisMode as AIAnalysisSettings["analysisMode"],
    analysisFocus: record.analysisFocus as AIAnalysisSettings["analysisFocus"],
    graphGranularity: record.graphGranularity as AIAnalysisSettings["graphGranularity"],
    refreshBehavior: record.refreshBehavior as AIAnalysisSettings["refreshBehavior"],
    modelProvider: record.modelProvider,
    modelName: record.modelName,
    maxCandidateNeighbors: record.maxCandidateNeighbors,
    confidenceThreshold: record.confidenceThreshold,
    tokenBudget: record.tokenBudget,
    maxGraphDensity: record.maxGraphDensity,
    explanationVerbosity: record.explanationVerbosity as AIAnalysisSettings["explanationVerbosity"],
    updatedAt: formatDate(record.updatedAt)
  };
}

function serializeAIAnalysisSettings(input: Partial<AIAnalysisSettings>) {
  return {
    ...(input.analysisMode !== undefined ? { analysisMode: input.analysisMode } : {}),
    ...(input.analysisFocus !== undefined ? { analysisFocus: input.analysisFocus } : {}),
    ...(input.graphGranularity !== undefined ? { graphGranularity: input.graphGranularity } : {}),
    ...(input.refreshBehavior !== undefined ? { refreshBehavior: input.refreshBehavior } : {}),
    ...(input.modelProvider !== undefined ? { modelProvider: input.modelProvider } : {}),
    ...(input.modelName !== undefined ? { modelName: input.modelName } : {}),
    ...(input.maxCandidateNeighbors !== undefined ? { maxCandidateNeighbors: input.maxCandidateNeighbors } : {}),
    ...(input.confidenceThreshold !== undefined ? { confidenceThreshold: input.confidenceThreshold } : {}),
    ...(input.tokenBudget !== undefined ? { tokenBudget: input.tokenBudget } : {}),
    ...(input.maxGraphDensity !== undefined ? { maxGraphDensity: input.maxGraphDensity } : {}),
    ...(input.explanationVerbosity !== undefined ? { explanationVerbosity: input.explanationVerbosity } : {})
  };
}

function buildIdeaProfile(idea: IdeaLikeForGraph): Omit<
  IdeaProfile,
  "ideaId" | "assumptions" | "noveltyPoints" | "experimentSignals" | "keywords" | "updatedAt" | "embeddingVector"
> & {
  assumptionsJson: string;
  noveltyPointsJson: string;
  experimentSignalsJson: string;
  keywordsJson: string;
  embeddingVector: string;
} {
  const experimentSignals = idea.experiments
    .map((experiment) => [experiment.title, experiment.status, experiment.resultSummary].filter(Boolean).join(": "))
    .filter(Boolean);
  const keywords = uniqueStrings([
    ...parseStringArray(idea.tagsJson),
    ...idea.experiments.map((experiment) => experiment.datasetName).filter(Boolean),
    ...idea.experiments.map((experiment) => experiment.modelName).filter(Boolean)
  ]).slice(0, 16);

  return {
    profileSummary: [idea.summary, idea.hypothesis].filter(Boolean).join(" "),
    problemStatement: idea.motivation || idea.summary,
    methodSummary: idea.experiments.map((experiment) => experiment.methodChanges || experiment.objective).filter(Boolean).join("\n"),
    assumptionsJson: JSON.stringify(extractPhrases(idea.hypothesis)),
    noveltyPointsJson: JSON.stringify(extractPhrases(idea.novelty)),
    experimentSignalsJson: JSON.stringify(experimentSignals),
    keywordsJson: JSON.stringify(keywords),
    embeddingVector: JSON.stringify(buildLocalEmbedding([idea.title, idea.summary, idea.motivation, idea.hypothesis, idea.novelty, ...keywords].join(" ")))
  };
}

type IdeaLikeForGraph = {
  id: string;
  title: string;
  summary: string;
  motivation: string;
  hypothesis: string;
  novelty: string;
  tagsJson: string;
  experiments: {
    title: string;
    objective: string;
    status: string;
    modelName: string;
    methodChanges: string;
    datasetName: string;
    resultSummary: string;
  }[];
  decisionLogs: {
    title: string;
    content: string;
  }[];
};

function extractPhrases(value: string): string[] {
  return value
    .split(/[.;\n。；]/)
    .map((phrase) => phrase.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function buildLocalEmbedding(value: string): number[] {
  const dimensions = 16;
  const vector = Array.from({ length: dimensions }, () => 0);
  const tokens = value
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/u)
    .filter((token) => token.length > 2);

  for (const token of tokens) {
    vector[hashToken(token) % dimensions] += 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, item) => sum + item * item, 0)) || 1;
  return vector.map((item) => Number((item / magnitude).toFixed(4)));
}

function hashToken(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseStringRecord(value: string): Record<string, string> {
  try {
    const parsed = JSON.parse(value);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string")
    );
  } catch {
    return {};
  }
}

function parseExperimentArtifacts(value: string): ExperimentResultArtifact[] {
  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const record = item as Record<string, unknown>;
      const title = String(record.title ?? "").trim();
      const kind = String(record.kind ?? "").trim();
      const content = String(record.content ?? "");

      if (!title || !content || !["markdown", "image", "table"].includes(kind)) {
        return [];
      }

      return [
        {
          id: String(record.id ?? `artifact-${crypto.randomUUID()}`),
          title,
          kind: kind as ExperimentResultArtifact["kind"],
          content,
          fileName: typeof record.fileName === "string" ? record.fileName : undefined,
          mimeType: typeof record.mimeType === "string" ? record.mimeType : undefined
        }
      ];
    });
  } catch {
    return [];
  }
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
