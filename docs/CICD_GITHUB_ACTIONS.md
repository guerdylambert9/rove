# CI/CD with GitHub Actions (Rové learning guide)

This document teaches **CI/CD in general**, then walks through **this project's** workflow:
`.github/workflows/deploy-staging.yml`.

Use it as a study guide. Re-read after every Actions run.

---

## 1. What is CI/CD?

**CI** = Continuous Integration  
**CD** = Continuous Delivery (or Continuous Deployment)

| Term | Meaning |
| --- | --- |
| **CI** | Automatically build/test your code whenever it changes, so bugs show up early |
| **Continuous Delivery** | Code is always in a deployable state; a human still clicks “go live” |
| **Continuous Deployment** | Passing CI automatically ships to an environment (e.g. staging) |

Rové’s current workflow is closer to **CI + Continuous Deployment to staging**:

1. Code changes on GitHub  
2. GitHub spins up a temporary machine  
3. It installs dependencies, builds the app, deploys to Vercel  

Without CI/CD you would do those steps by hand (`npm run build`, `npm run deploy:staging`) on your laptop every time.

---

## 2. What is a workflow?

A **workflow** is an automated recipe stored as YAML in:

```text
.github/workflows/<name>.yml
```

It answers three questions:

1. **When** should this run? (`on:`)
2. **What jobs** should run? (`jobs:`)
3. **What steps** does each job take? (`steps:`)

GitHub Actions is the product that **reads** that YAML and **executes** it.

Think of it like this:

```text
Event (push / PR / button)
        ↓
   Workflow (the YAML file)
        ↓
     Job(s)  (work units, often 1 for small projects)
        ↓
    Step(s)  (checkout → install → build → deploy)
```

---

## 3. Core vocabulary

| Term | What it is |
| --- | --- |
| **Event** | Something that starts a run (push, pull request, manual click) |
| **Workflow** | The whole YAML automation |
| **Run** | One execution of a workflow (what you see in the Actions list: #1, #2, #3) |
| **Job** | A named unit of work (`deploy:`). Each job gets its **own** fresh machine |
| **Runner** | The machine that runs the job (`runs-on: ubuntu-latest`) |
| **Step** | One command or reusable action inside a job |
| **Action** | A reusable package (`uses: actions/checkout@v4`) |
| **Secret** | Encrypted value (token, API key) injected at runtime |
| **Artifact** | Files saved from a run (optional; we don’t use them yet) |

### Correcting a common misconception

> “`deploy:` holds the physical and software configuration of a virtual machine on which we deploy the job.”

Almost — small correction:

- `deploy:` is the **job name** (you could call it `build-and-ship`).
- `runs-on: ubuntu-latest` is what requests the **virtual machine** (the runner).
- That machine does **not** host your website permanently.
- It is a **temporary build worker**. It builds the app, uploads it to **Vercel**, then GitHub throws the machine away.

Your live staging site still lives on **Vercel**, not on the GitHub runner.

```text
GitHub runner (temporary)          Vercel (permanent hosting)
─────────────────────────          ─────────────────────────
checkout code                      serves https://rove-staging...
npm install / build
vercel deploy  ─────────────────►  stores the built site
machine deleted
```

---

## 4. This project’s workflow (overview)

**File:** `.github/workflows/deploy-staging.yml`  
**Name shown in UI:** `Deploy staging`

### When it runs (`on:`)

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:
```

| Trigger | Meaning for Rové |
| --- | --- |
| `push` to `main` | Someone merged/pushed to main → build + deploy + **alias staging URL** |
| `pull_request` targeting `main` | PR opened/updated → build + deploy a **preview** URL (no staging alias) |
| `workflow_dispatch` | Manual **Run workflow** button in Actions |

Your three successful runs likely matched:

1. PR opened → `pull_request`
2. PR merged → `push` to `main`
3. Manual click → `workflow_dispatch`

### Why “Run workflow” was missing at first

GitHub only shows the **Run workflow** button if the workflow file with `workflow_dispatch` exists on the **default branch** (`main`).

While the file lived only on `phase8-impl`, PRs could still trigger it, but the manual button stayed hidden until merge.

---

## 5. Line-by-line walkthrough

### Header / name

```yaml
name: Deploy staging
```

Label in the Actions UI. Does not affect behavior.

### Job + runner

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
```

- One job named `deploy`
- GitHub provisions a fresh Ubuntu VM for this job
- Larger projects often have multiple jobs: `test`, then `deploy`

### Step 1–2: Checkout + Node

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: npm
```

| Step | Purpose |
| --- | --- |
| `checkout` | Download this repo’s code onto the runner |
| `setup-node` | Install Node.js so `npm` works; cache speeds later runs |

(`uses:` = run a maintained Action. `run:` = shell command.)

### Step 3: Install dependencies

```yaml
- name: Install dependencies
  run: npm ci
```

`npm ci` = clean install from `package-lock.json` (preferred in CI over `npm install`).

### Step 4: App build (Vite)

```yaml
- name: Build
  run: npm run build
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    ...
```

Vite **bakes** `VITE_*` values into the JS bundle at build time.

`${{ secrets.NAME }}` pulls from **GitHub → Settings → Secrets and variables → Actions**.

If a secret is missing, the build may succeed but Stripe/Supabase won’t work in the deployed site.

### Steps 5–8: Vercel deploy

```yaml
- Install Vercel CLI
- vercel pull   # download project settings for this Vercel project
- vercel build  # produce a Vercel-ready build
- vercel deploy --prebuilt  # upload that build; print a preview URL
```

`VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` authenticate and target the Flex `rove` project.

The deploy step also does:

```yaml
id: deploy
url=$(vercel deploy --prebuilt ...)
echo "url=$url" >> "$GITHUB_OUTPUT"
```

That saves the preview URL as an **output** named `url` for later steps.

### Step 9: Alias staging (conditional)

```yaml
- name: Alias staging
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
```

This step **only** runs when:

- branch is `main`, **and**
- event is `push` (merge/push), **not** a PR and **not** (by this condition) a manual run unless you ran from `main` *and* the event is push — manual runs are `workflow_dispatch`, so **alias does not run on manual dispatch**.

| Event | Deploys? | Updates `rove-staging.vercel.app`? |
| --- | --- | --- |
| PR into `main` | Yes (preview URL) | No |
| Push/merge to `main` | Yes | **Yes** |
| Manual run from `main` | Yes (preview URL) | **No** (current `if`) |

That is intentional caution: only merges to `main` move the stable staging alias.

---

## 6. Secrets: what belongs where

| Secret | Used for | Keep in GitHub? |
| --- | --- | --- |
| `VERCEL_TOKEN` | Auth to Vercel API | Yes |
| `VERCEL_ORG_ID` | Flex team id | Yes |
| `VERCEL_PROJECT_ID` | `rove` project id | Yes |
| `VITE_SUPABASE_URL` | Frontend build | Yes |
| `VITE_SUPABASE_ANON_KEY` | Frontend build | Yes |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Frontend build | Yes |
| `STRIPE_SECRET_KEY` | Edge Functions | **No** — Supabase secrets only |
| `STRIPE_WEBHOOK_SECRET` | Webhook verify | **No** — Supabase secrets only |

Rule of thumb:

- **GitHub Secrets** → needed to **build/deploy** the frontend from Actions  
- **Supabase secrets** → needed by **server-side** Edge Functions  

---

## 7. How to read an Actions run (practice)

Open a green run → click the `deploy` job → expand each step.

Ask yourself:

1. Which **event** started this? (PR / push / workflow_dispatch)
2. Did **Build** succeed? (CI)
3. Did **Deploy preview** print a URL?
4. Did **Alias staging** run or get **Skipped**? (check the `if:`)

Skipped steps are normal — not failures.

---

## 8. CI vs CD in *this* workflow

| Part of the file | CI or CD? |
| --- | --- |
| `npm ci` + `npm run build` | **CI** (integrate/verify the code builds) |
| `vercel deploy` | **CD** (deliver to an environment) |
| `vercel alias set ... rove-staging` | **CD** to a stable staging URL |

There are **no automated tests** yet. A stronger CI job would add:

```yaml
- run: npm test   # when you have tests
```

and often split into:

- Job `ci` on every PR (build + test only)
- Job `deploy` only on `main` (needs CI to pass first)

That split is a great next learning exercise.

---

## 9. Suggested learning path (next steps)

1. **Read a failed run on purpose**  
   Temporarily break `npm run build` on a branch, open a PR, watch which step fails.

2. **Split CI and deploy**  
   - `ci.yml`: build on every PR  
   - `deploy-staging.yml`: deploy only on `main` after CI passes  

3. **Add a status check**  
   Repo Settings → Branches → protect `main` → require the CI workflow to pass before merge.

4. **Environments**  
   Create a GitHub Environment named `staging` and move deploy secrets there (optional approvals).

5. **Compare to local deploy**  
   `npm run deploy:staging` does similar Vercel work on your laptop. Actions does it on GitHub’s runner so anyone’s merge can ship staging without your machine.

---

## 10. Quick glossary cheat sheet

| You say… | GitHub means… |
| --- | --- |
| “The pipeline ran” | A **workflow run** started |
| “The VM” | The **runner** (`ubuntu-latest`) |
| “The deploy job” | Job id `deploy` under `jobs:` |
| “It deployed staging” | Vercel got a new build; alias may or may not have updated |
| “I triggered it by hand” | `workflow_dispatch` |

---

## 11. Mental model (one picture)

```text
You push / open PR / click Run workflow
              │
              ▼
     GitHub Actions reads YAML
              │
              ▼
   Fresh Ubuntu runner starts
              │
     ┌────────┴────────┐
     │ checkout code   │
     │ npm ci          │  ← CI
     │ npm run build   │
     └────────┬────────┘
              │
     ┌────────┴────────┐
     │ vercel deploy   │  ← CD
     │ (optional alias)│
     └────────┬────────┘
              │
              ▼
     Runner deleted; site lives on Vercel
```

---

*Update this doc as the pipeline grows (tests, production deploy, Supabase migrations).*
