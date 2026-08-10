---
name: deploy-pages-render
description: >-
  Use this skill to deploy or redeploy a web application with a static frontend
  to GitHub Pages (gh-pages branch) and a Node.js Socket.io backend to Render.com.
---

# Deploy Pages & Render Skill

This skill outlines the standard operational procedure for deploying and updating the Timebomb Online application (static HTML frontend + Express Socket.io backend).

## Procedures

### 1. Backend Update (Render.com)
The backend is hosted on Render.com and automatically redeploys whenever updates are pushed to the main branch or tracking branches.

1. Commit changes to `main` branch.
2. Push `main` to origin:
   `git push origin main`
3. Force-push to all other tracking development branches (`ai-dev`, `deploy-timebomb`, `dev`) to ensure Render triggers a deployment regardless of the configured branch:
   `git push origin main:ai-dev --force; git push origin main:deploy-timebomb --force; git push origin main:dev --force`

### 2. Frontend Update (GitHub Pages)
The static frontend is hosted on GitHub Pages from the `gh-pages` branch. The file `timebomb.html` in the root of the `gh-pages` branch acts as the production entry point, and `timebomb-spec.html` acts as the PDF specification sheet.

1. Switch to the `gh-pages` branch:
   `git checkout gh-pages`
2. Checkout the latest `index.html` and `spec.html` from `main`:
   `git checkout main -- timebomb-game/frontend/index.html`
   `git checkout main -- timebomb-game/frontend/spec.html`
3. Copy the files to the root-level filenames expected by GitHub Pages:
   - Copy `timebomb-game/frontend/index.html` to `timebomb.html`
   - Copy `timebomb-game/frontend/spec.html` to `timebomb-spec.html`
4. Stage, commit, and push the updates:
   `git add timebomb.html timebomb-spec.html timebomb-game/frontend/index.html timebomb-game/frontend/spec.html`
   `git commit -m "deploy: update timebomb frontend and specs"`
   `git push origin gh-pages`
5. Switch back to the `main` branch:
   `git checkout main`

## Verification
- Frontend URL: `https://mrdayama.github.io/ai-tool/timebomb.html`
- Specs URL: `https://mrdayama.github.io/ai-tool/timebomb-spec.html`
- Wait 30 seconds after push, then test responsiveness of the URLs using `read_url_content`.
