# Vercel Docker Proxy Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy one production Vercel proxy for seven registry hostnames under `proxy.xecho.me` and verify their routing.

**Architecture:** The existing Vercel Serverless Function resolves registry type from the left-most hostname label. One Vercel project therefore serves the seven explicit hostnames named in Task 2. Cloudflare DNS-only CNAME records delegate TLS and request handling to Vercel.

**Tech Stack:** Vercel Serverless Functions, Vercel Domains API/CLI, Cloudflare DNS API, Docker Registry HTTP API v2.

---

### Task 1: Create the production Vercel deployment

**Files:**
- Read: `vercel.json`
- Read: `api/proxy.js`
- Create: Vercel project `vercel-docker-proxy`

- [ ] **Step 1: Verify Vercel authentication and deployment configuration**

Run: `vercel whoami` from the checked-out repository.

Expected: The authenticated account can deploy to team `z-aura-s-projects`; `vercel.json` rewrites all paths to `/api/proxy`.

- [ ] **Step 2: Deploy the repository to production**

Run: `vercel --prod --yes --scope z-aura-s-projects` from the checked-out repository.

Expected: A production deployment URL is returned and its deployment state is `READY`.

- [ ] **Step 3: Verify the baseline registry endpoint**

Run: `curl.exe -i https://DEPLOYMENT_URL_RETURNED_BY_STEP_2/v2/`, replacing `DEPLOYMENT_URL_RETURNED_BY_STEP_2` with the exact URL printed by the deployment command.

Expected: A Docker Registry v2 authentication response, not a Vercel routing error.

### Task 2: Attach and delegate registry hostnames

**Files:**
- Modify: Vercel project domain configuration
- Modify: Cloudflare zone `xecho.me` DNS records

- [ ] **Step 1: Add the seven hostnames to the Vercel project**

Add exactly these domains: `docker.proxy.xecho.me`, `gcr.proxy.xecho.me`, `k8s.proxy.xecho.me`, `ghcr.proxy.xecho.me`, `quay.proxy.xecho.me`, `cloudsmith.proxy.xecho.me`, and `nvcr.proxy.xecho.me`.

Expected: Vercel returns its required DNS target or validates each domain as configured.

- [ ] **Step 2: Create DNS-only CNAME records in Cloudflare**

For each Vercel custom domain, create or update its CNAME record to the Vercel-assigned target with `proxied: false` and automatic TTL.

Expected: Cloudflare has seven independently managed DNS-only CNAME records; no wildcard record is created.

- [ ] **Step 3: Wait for domain validation and certificate issuance**

Poll the Vercel project domain status until all seven hostnames are valid.

Expected: Every hostname resolves to the production deployment over HTTPS with a valid Vercel-managed certificate.

### Task 3: Verify registry routing

**Files:**
- Read: Vercel production deployment/runtime logs

- [ ] **Step 1: Verify Docker Hub authentication rewriting**

Run: `curl.exe -i https://docker.proxy.xecho.me/v2/`.

Expected: `401 Unauthorized` with a `WWW-Authenticate` realm whose hostname is `docker.proxy.xecho.me`.

- [ ] **Step 2: Verify each non-Docker-Hub registry endpoint**

Run: `curl.exe -i https://gcr.proxy.xecho.me/v2/`, `curl.exe -i https://k8s.proxy.xecho.me/v2/`, `curl.exe -i https://ghcr.proxy.xecho.me/v2/`, `curl.exe -i https://quay.proxy.xecho.me/v2/`, `curl.exe -i https://cloudsmith.proxy.xecho.me/v2/`, and `curl.exe -i https://nvcr.proxy.xecho.me/v2/`.

Expected: Each response is an upstream registry response and none is served by Docker Hub or fails with a Vercel 404/500.

- [ ] **Step 3: Inspect error logs and record the endpoints**

Query the production runtime logs for errors generated during verification and record the final deployment URL plus seven custom domains.

Expected: No proxy runtime errors; any registry-specific authentication response is recorded as expected behavior.
