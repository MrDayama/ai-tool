---
name: git-management
description: >-
  Use this skill to manage branches, synchronize development tracking branches,
  and handle deployment staging on the gh-pages branch in the ai-tool repository.
---

# Git Management Skill

This skill defines the branching model, branch synchronization practices, and deployment branch management rules for the `ai-tool` repository.

## 🗂️ Branch Topology

| Branch | Role | Deployment Pipeline |
|---|---|---|
| **`main`** | Source of truth (latest stable code). | Primary branch for development. |
| **`ai-dev`** | AI agent tracking branch. | Used by automated CI/CD workflows. |
| **`deploy-timebomb`** | Deployment trigger branch. | Triggers Render.com backend builds. |
| **`dev`** | Legacy development branch. | Linked to older environment configurations. |
| **`gh-pages`** | Public static site hosting. | Serves the frontend at `timebomb.html`. |

---

## 🔄 Branch Synchronization Flow

To ensure all deployment and tracking pipelines receive the latest codebase, updates made on `main` must be propagated to all tracking branches.

### Step-by-Step Sync Command
After committing and pushing changes to `main`:
1. Commit and push to `main`:
   `git add -A`
   `git commit -m "feat: your feature summary"`
   `git push origin main`
2. Force-push the current state of `main` to all other target tracking branches:
   `git push origin main:ai-dev --force`
   `git push origin main:deploy-timebomb --force`
   `git push origin main:dev --force`

---

## 🚀 Deployment Branch Staging (`gh-pages`)

GitHub Pages hosts the static HTML directly from the root level of the `gh-pages` branch. Follow this protocol to stage and update frontend deployments without losing history.

1. **Verify Workspace Cleanliness**:
   Ensure `git status` is clean before switching branches to avoid staging conflicts.
2. **Switch to gh-pages**:
   `git checkout gh-pages`
3. **Pull Production Outputs from Main**:
   Fetch the latest HTML/CSS/JS files from the main branch's subdirectory:
   `git checkout main -- timebomb-game/frontend/index.html`
   `git checkout main -- timebomb-game/frontend/spec.html`
4. **Copy to Production Entrypoints**:
   Copy the files to the root of the repository as expected by GitHub Pages:
   - `timebomb-game/frontend/index.html` -> `timebomb.html`
   - `timebomb-game/frontend/spec.html` -> `timebomb-spec.html`
5. **Commit and Push**:
   `git add timebomb.html timebomb-spec.html timebomb-game/frontend/index.html timebomb-game/frontend/spec.html`
   `git commit -m "deploy: release static frontend updates"`
   `git push origin gh-pages`
6. **Return to Main**:
   Always check back to `main` to prevent making modifications inside the deployment branch:
   `git checkout main`

---

## ⚠️ Safety Protocols
- **No direct edits on gh-pages**: Never edit files directly on `gh-pages` branch. Always edit in `main` and copy/merge them over.
- **Merge conflicts**: If a directory (e.g. `icm-calculator`) throws a warning like "unable to rmdir: directory not empty" when switching branches, run `git clean -fd` or ignore the warning, but ensure you don't commit untracked folder states.
