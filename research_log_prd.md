# ResearchLog Product Requirements Document

## 1. Product Overview

### 1.1 Product Name
ResearchLog

### 1.2 One-line Positioning
A research workspace for computer science practitioners that manages ideas, experiments, assets, and automatically builds an LLM-driven idea graph to reveal the structure of ongoing research.

### 1.3 Product Vision
Research work is rarely linear. Ideas branch, merge, fail, revive, and evolve through experiments. Existing tools are fragmented: Markdown tools are good at writing but weak at experiment tracking; experiment platforms are good at metrics but weak at recording reasoning; password managers are good at secret storage but disconnected from the actual research workflow. ResearchLog aims to unify these layers into a single system.

The product should help a user answer questions such as:
- What ideas am I actively pursuing right now?
- Which experiments belong to which idea, and what changed between them?
- Why did I abandon a previous direction?
- Which server, dataset, token, repo, and run were used for a given experiment?
- How are my ideas related, and what is the main research trajectory emerging from them?

### 1.4 Core Value Proposition
ResearchLog provides four forms of value:
1. Structured recording of ideas and experiments
2. Secure management of research assets such as API tokens and server metadata
3. Automatic discovery of relationships between ideas using LLM-based analysis
4. Better recall, reproducibility, and paper-writing support through structured research memory

---

## 2. Target Users

### 2.1 Primary Users
- Graduate students in computer science, machine learning, AI systems, NLP, CV, bioinformatics, and related fields
- Researchers and research engineers who run many experiments across multiple machines
- Independent builders and applied researchers who need to connect notes, experiments, and infrastructure

### 2.2 Typical User Characteristics
- Uses notebooks, Markdown, or Notion to record ideas
- Uses W&B, TensorBoard, logs, scripts, and remote servers for experiments
- Has multiple API keys and platform credentials scattered across devices or notes
- Wants to remember not only results, but the reasoning behind decisions
- Often revisits earlier research directions and struggles to recover context

---

## 3. Product Scope

### 3.1 Core Product Objects
ResearchLog revolves around five primary objects:

1. **Idea**
   A research theme, hypothesis, or direction.

2. **Experiment**
   A concrete attempt under an idea, with configuration, environment, results, and analysis.

3. **Vault Asset**
   A secure or semi-secure research asset such as an API token, server profile, platform entry, or template.

4. **Decision Log**
   A structured record of why a direction was changed, paused, replaced, or continued.

5. **Idea Relation**
   A model-generated connection between two ideas, such as derivation, similarity, replacement, or combination.

### 3.2 Major Modules
- Dashboard
- Ideas
- Experiments
- Vault
- Research Map
- Timeline
- Settings

---

## 4. Product Principles

### 4.1 Research-first, not generic note-taking
The product should not behave like a blank note app. It should treat ideas, experiments, and decisions as first-class objects.

### 4.2 Structured where needed, freeform where useful
Every important record should combine structured fields with a flexible Markdown writing area.

### 4.3 Security by design for sensitive assets
Tokens and secrets should be treated like protected credentials, not ordinary notes.

### 4.4 Explainable AI, not opaque automation
Any LLM-generated relationship in the idea graph should include rationale and evidence.

### 4.5 Support evolution, not just archiving
The system should help users see trajectories, pivots, clusters, and dead ends.

---

## 5. User Problems

### 5.1 Fragmented idea storage
Ideas are scattered across notes, chats, papers, and random markdown files.

### 5.2 Lost experimental context
Users remember a result but forget the exact setup, environment, or run path.

### 5.3 Forgotten infrastructure details
Users lose track of tokens, server aliases, command templates, or platform entry points.

### 5.4 Weak recall of research reasoning
Users can find what they did but not why they did it.

### 5.5 Inability to see the bigger picture
As ideas grow, overlap, or branch, users cannot clearly tell how they are related.

---

## 6. Functional Modules

## 6.1 Dashboard

### Purpose
Provide a compact overview of active research work.

### Core Widgets
- Active ideas
- Recently updated experiments
- Running or unfinished experiments
- Recently added decision logs
- Vault assets recently used
- Latest generated graph changes
- Quick-create actions for idea, experiment, token, and decision log

### User Value
Helps users resume work quickly and maintain situational awareness.

---

## 6.2 Ideas Module

### Purpose
Manage research directions as structured entries rather than loose notes.

### Idea Fields
- id
- title
- summary
- motivation
- hypothesis
- novelty
- status
- priority
- tags
- related papers
- created_at
- updated_at

### Suggested Statuses
- Inbox
- Exploring
- Running
- Iterating
- Paused
- Archived
- Paper-ready

### Idea List View
Displays:
- Title
- Short summary
- Status
- Tags
- Number of experiments
- Last updated
- Recent insight snippet

### Idea Detail View Sections
1. Overview
2. Hypothesis
3. Related Work
4. Experiment Timeline
5. Decision Log
6. Insight Summary
7. Linked Assets
8. Graph Context

### Key Interactions
- Create idea
- Edit idea
- Change status
- Link related papers
- Add experiment under an idea
- Add decision log
- Open graph neighborhood

---

## 6.3 Experiments Module

### Purpose
Record concrete experimental attempts with full context.

### Experiment Fields
- id
- idea_id
- title
- objective
- experiment_type
- status
- model_name
- method_changes
- dataset_name
- dataset_version
- config_json
- loss_summary
- optimizer_summary
- server_asset_id
- runtime_env
- branch_name
- commit_id
- run_command
- wandb_url
- log_path
- ckpt_path
- result_metrics_json
- result_summary
- analysis
- next_steps
- created_at
- updated_at

### Suggested Experiment Types
- Baseline reproduction
- Ablation
- New method trial
- Hyperparameter tuning
- Dataset change
- Failure analysis
- Scaling run
- Inference-only evaluation

### Experiment Statuses
- Planned
- Running
- Done
- Failed
- Superseded

### Experiment Page Sections
1. Basic Info
2. Objective
3. Method and Config
4. Data
5. Runtime Environment
6. Linked Assets
7. Results
8. Analysis
9. Next Steps

### Important Feature
Structured fields on top, Markdown body below.

### Comparison View
Users can select multiple experiments to compare:
- model changes
- config differences
- dataset differences
- metrics
- conclusions

---

## 6.4 Vault Module

### Purpose
Provide a secure, research-oriented vault for tokens, server profiles, platform entries, and reusable templates.

### 6.4.1 Vault Scope
Vault is not a general-purpose password manager. It is a research workflow asset manager.

### Asset Types
1. Token
2. Server
3. Platform
4. Template

### 6.4.2 Token Asset
Fields:
- id
- name
- provider
- usage_scope
- environment
- encrypted_value
- masked_preview
- notes
- status
- created_at
- updated_at
- last_used_at

Supported providers may include:
- OpenAI
- Hugging Face
- DeepSeek
- Anthropic
- Gemini
- Together
- Replicate
- Groq
- Custom

#### Token UX Rules
- Token is entered once and stored encrypted
- Default display is masked only
- Full reveal requires re-authentication
- Reveal is temporary and logged
- One-click copy is supported
- Tokens can be marked expired, revoked, or archived

### 6.4.3 Server Asset
Fields:
- id
- name
- host
- port
- username
- ssh_alias
- workdir
- gpu_type
- queue_name
- conda_envs
- startup_templates
- notes
- created_at
- updated_at

Important boundary:
Do not support plain-text storage of SSH private keys or root passwords in MVP.

### 6.4.4 Platform Asset
Examples:
- W&B project
- Hugging Face dataset repo
- Hugging Face model repo
- GitHub repository
- Internal dashboard URL

Fields:
- name
- platform_type
- url
- default_project_or_repo
- notes

### 6.4.5 Template Asset
Examples:
- training command template
- evaluation command template
- issue checklist
- experiment report template

---

## 6.5 Security Design for Vault

### Security Goals
- No long-term plain text exposure of token values
- Encrypted-at-rest storage
- Sensitive actions require re-authentication
- Audit log for access to secrets

### Security Requirements
1. No token storage in localStorage or plain front-end persistence
2. Database stores only ciphertext and metadata
3. Encryption key must be separated from database storage
4. Masked display by default
5. Sensitive actions such as reveal or copy are logged
6. Optional second-layer vault password for stronger protection

### Recommended Technical Direction
- Encryption: AES-256-GCM
- Key management: environment secret or cloud KMS
- Optional user-derived key wrapping for advanced mode
- Re-authentication for reveal/copy of secrets
- Audit log table with timestamps and action types

### Sensitive Action Types to Log
- create
- update
- reveal
- copy
- revoke
- delete

---

## 6.6 Research Map Module

### Purpose
Automatically build a graph of idea relationships using LLM analysis and structured metadata.

### Why It Matters
Ideas are not isolated. They derive from, overlap with, replace, or combine with one another. Users should be able to see research structure without manually drawing it.

### Core Mechanism
The system automatically analyzes idea entries, experiment summaries, decision logs, and linked metadata to infer relationships.

### Node Definition
Each idea is a node.

Node metadata may include:
- title
- short summary
- status
- tag cluster
- experiment count
- last updated
- importance score

### Edge Definition
Each edge is a relation between two ideas.

### Relation Types
- derived_from
- inspired_by
- split_from
- similar_to
- variant_of
- shares_hypothesis_with
- combines_with
- bridges
- replaces
- contradicts
- abandoned_in_favor_of
- validated_by_same_setup
- same_dataset_family
- same_method_family

### Edge Metadata
- relation_type
- confidence
- rationale
- evidence
- model provider
- model name
- analysis version
- timestamps

---

## 7. AI-driven Graph Analysis Pipeline

### 7.1 Stage 1: Idea Profile Construction
For each idea, the system aggregates:
- title
- summary
- motivation
- hypothesis
- novelty
- tags
- related work notes
- decision logs
- experiment objectives and summaries
- user insights

The system then generates a compact **Idea Profile** containing:
- problem statement
- method summary
- novelty points
- assumptions
- experiment signals
- keywords
- optional embedding

### 7.2 Stage 2: Candidate Retrieval
Use embeddings or other retrieval signals to identify top-k candidate neighboring ideas for each target idea.

Possible retrieval signals:
- semantic similarity
- shared tags
- shared datasets
- shared model families
- overlap in linked papers
- temporal adjacency

### 7.3 Stage 3: LLM Relation Inference
For each candidate pair, the system asks an LLM to determine:
- whether a meaningful relation exists
- relation type
- confidence
- explanation
- evidence snippets

### 7.4 Stage 4: Rule-based Filtering
The system applies constraints such as:
- no self-edges
- remove very low-confidence relations
- limit graph density
- suppress redundant duplicate edges
- prioritize directional relations where appropriate

### 7.5 Stage 5: Graph Generation
Final output includes:
- nodes
- filtered edges
- clusters
- main branches
- bridge nodes
- optional evolution chains

---

## 8. User-configurable AI Settings

The product should allow users to configure the LLM-based graph generation at an appropriate level.

### 8.1 User-facing Analysis Modes
- Conservative: only show high-confidence relations
- Balanced: default mode
- Exploratory: allow weaker but potentially useful relations

### 8.2 Analysis Focus
- Problem-oriented
- Method-oriented
- Evolution-oriented
- Experiment-oriented

### 8.3 Graph Granularity
- Coarse
- Medium
- Fine

### 8.4 Refresh Behavior
- Manual refresh only
- Refresh on idea creation
- Refresh on idea update
- Scheduled batch refresh
- Incremental refresh only for changed nodes

### 8.5 Advanced Settings
- model provider
- model name
- max candidate neighbors
- confidence threshold
- token budget for summary construction
- max graph density
- explanation verbosity

---

## 9. Research Map Views

### 9.1 Network Graph View
Best for overview of the full research landscape.

### 9.2 Evolution Tree View
Highlights derivation, branching, and replacement over time.

### 9.3 Cluster Map View
Groups related ideas into research themes.

### 9.4 Node Detail Panel
On click, show:
- idea summary
- related experiments
- strongest relations
- why this node is placed where it is

### 9.5 Edge Detail Panel
On click, show:
- relation type
- confidence
- rationale
- supporting snippets
- generation metadata

---

## 10. Timeline Module

### Purpose
Show the temporal progression of research actions.

### Timeline Items
- idea created
- experiment added
- decision logged
- idea status changed
- graph relation added or changed
- asset created or updated

### Value
Helps users reconstruct research flow over time.

---

## 11. Data Model

### 11.1 Idea
```text
Idea
- id
- title
- summary
- motivation
- hypothesis
- novelty
- status
- priority
- tags_json
- related_papers_json
- created_at
- updated_at
```

### 11.2 Experiment
```text
Experiment
- id
- idea_id
- title
- objective
- experiment_type
- status
- model_name
- method_changes
- dataset_name
- dataset_version
- config_json
- server_asset_id
- runtime_env
- branch_name
- commit_id
- run_command
- wandb_url
- log_path
- ckpt_path
- result_metrics_json
- result_summary
- analysis
- next_steps
- created_at
- updated_at
```

### 11.3 VaultAsset
```text
VaultAsset
- id
- asset_type
- name
- provider
- metadata_json
- encrypted_secret
- masked_preview
- status
- created_at
- updated_at
- last_used_at
```

### 11.4 DecisionLog
```text
DecisionLog
- id
- idea_id
- experiment_id
- title
- content
- decision_type
- created_at
```

### 11.5 IdeaProfile
```text
IdeaProfile
- idea_id
- profile_summary
- problem_statement
- method_summary
- assumptions_json
- novelty_points_json
- experiment_signals_json
- keywords_json
- embedding_vector
- updated_at
```

### 11.6 IdeaRelation
```text
IdeaRelation
- id
- source_idea_id
- target_idea_id
- relation_type
- confidence
- rationale
- evidence_json
- generated_by_model
- model_provider
- model_name
- analysis_version
- created_at
- updated_at
```

### 11.7 GraphAnalysisJob
```text
GraphAnalysisJob
- id
- scope
- status
- provider
- model_name
- config_json
- started_at
- finished_at
- error_message
```

### 11.8 VaultAuditLog
```text
VaultAuditLog
- id
- asset_id
- action_type
- actor_id
- metadata_json
- created_at
```

---

## 12. Page Architecture

### 12.1 Dashboard
- Summary cards
- Recent activity
- Quick create actions
- Active clusters snapshot

### 12.2 Ideas Page
- searchable list
- filters by status/tag/priority
- create new idea

### 12.3 Idea Detail Page
- overview
- hypothesis
- related work
- experiments timeline
- decision logs
- linked assets
- graph neighborhood

### 12.4 Experiments Page
- all experiments table or cards
- filters by status/type/dataset/server
- comparison mode

### 12.5 Experiment Detail Page
- structured experiment report
- links to runs and assets
- markdown notes

### 12.6 Vault Page
Tabs:
- Tokens
- Servers
- Platforms
- Templates

### 12.7 Research Map Page
- graph canvas
- filters on left
- details panel on right
- regenerate button
- AI settings modal

### 12.8 Timeline Page
- chronological feed
- filter by idea or event type

### 12.9 Settings Page
- user profile
- AI analysis settings
- vault security settings
- integrations

---

## 13. Integrations Roadmap

### Potential Integrations
- Weights & Biases
- GitHub / GitLab
- Hugging Face
- local filesystem references
- cloud object storage

### Suggested MVP Policy
Support manual links first. Auto-sync can be added later.

---

## 14. MVP Definition

### MVP v1
Focus on core research memory loop:
- Idea CRUD
- Experiment CRUD
- Decision logs
- Timeline
- Markdown + structured fields
- Search and filters

### MVP v1.5
Add core Vault support:
- Token storage with encryption
- Server profiles
- Platform entries
- Link assets to experiments
- Audit logs for sensitive actions

### MVP v2
Add Research Map:
- Idea profile generation
- embedding-based candidate retrieval
- LLM relation inference
- graph rendering
- node and edge explanations
- user-configurable AI settings

---

## 15. Non-goals for Early Versions

To keep scope manageable, the following should be excluded from the earliest versions:
- full password-manager functionality
- storage of raw SSH private keys in MVP
- direct remote execution on servers
- automatic code patching or deployment
- highly complex team permission models
- mobile-first experience

---

## 16. Recommended Technical Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Flow or Cytoscape.js for graph rendering
- TipTap or MDX/Markdown editor for structured note editing

### Backend
- Next.js API routes or NestJS
- PostgreSQL
- Prisma ORM

### Security and Auth
- NextAuth or equivalent
- encrypted secret storage
- optional 2FA
- re-auth for vault actions

### AI Layer
- background jobs for profile generation and graph analysis
- provider abstraction for OpenAI / DeepSeek / Anthropic / custom model endpoints
- embedding store or vector support if needed later

---

## 17. Design Tone

The interface should feel like a calm research desk rather than a corporate dashboard.

### Visual Priorities
- clean spacing
- hierarchy over clutter
- graph views that remain readable under growth
- clear distinction between notes, assets, and AI-generated suggestions
- strong affordances around sensitive actions in Vault

---

## 18. Product Differentiation

ResearchLog differs from existing tools in the following way:

### Compared with Markdown/Notion tools
- object-based rather than document-based
- strong experiment and asset linkage
- AI-generated idea graph

### Compared with W&B
- captures the reasoning around experiments, not just metrics
- manages idea evolution and decisions
- includes vault and graph layers

### Compared with password managers
- asset management is embedded in research workflow
- tokens and servers are linked to concrete experiments and ideas

---

## 19. Product Summary

ResearchLog is not merely a note-taking product. It is a structured research memory and cognition system.

It turns:
- ideas into trackable objects
- experiments into contextualized reports
- tokens and infrastructure into linked assets
- hidden semantic overlap between ideas into a navigable graph

The end goal is to help a researcher not only remember what happened, but also understand how their research is evolving.

---

## 20. Future Extensions

Potential future directions include:
- automatic import from W&B and Git
- paper-writing export based on selected ideas and experiments
- AI-generated weekly research summaries
- suggestion of duplicate or mergeable ideas
- detection of bridge opportunities between clusters
- multi-user collaboration for labs and teams
- experiment outcome prediction or planning assistance

