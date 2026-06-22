# Vercel Docker Proxy deployment design

## Goal

Deploy `mai-hn/Vercel-Docker-Proxy` as one Vercel project and expose the supported registries through separate hostnames under `proxy.xecho.me`.

## Architecture

One Vercel production deployment receives all registry traffic. The existing `api/proxy.js` function selects its upstream from the left-most hostname label, so the required domain order is `<registry>.proxy.xecho.me`.

Cloudflare is authoritative DNS for `xecho.me`. Each hostname is added to the Vercel project and receives Vercel's required DNS-only A record (`76.76.21.21`). DNS-only mode preserves Docker client compatibility and allows Vercel to provision and renew TLS certificates.

## Hostname routing

| Hostname | Upstream registry |
| --- | --- |
| `docker.proxy.xecho.me` | Docker Hub (`registry-1.docker.io`) |
| `gcr.proxy.xecho.me` | Google Container Registry (`gcr.io`) |
| `k8s.proxy.xecho.me` | Kubernetes Registry (`registry.k8s.io`) |
| `ghcr.proxy.xecho.me` | GitHub Container Registry (`ghcr.io`) |
| `quay.proxy.xecho.me` | Quay (`quay.io`) |
| `cloudsmith.proxy.xecho.me` | Cloudsmith (`docker.cloudsmith.io`) |
| `nvcr.proxy.xecho.me` | NVIDIA GPU Cloud (`nvcr.io`) |

## Deployment sequence

1. Deploy the repository as a new production Vercel project in `zAura's projects`.
2. Attach all seven custom domains to that project and retrieve Vercel's required DNS target for each.
3. Create or update the corresponding Cloudflare DNS-only A records to `76.76.21.21`.
4. Wait for Vercel domain verification and TLS issuance.
5. Verify each hostname reaches the expected registry through `GET /v2/`; verify Docker Hub's authentication challenge points back to `docker.proxy.xecho.me`.

## Failure handling

If a Vercel domain is not verified, retain the deployment and correct only its associated Cloudflare record. If a registry returns an upstream error, keep the hostname and inspect Vercel runtime logs before changing proxy code. No broad wildcard DNS record is used, so each registry remains independently diagnosable.

## Out of scope

This deployment does not modify proxy routing code, configure private-registry credentials, or introduce cache/storage infrastructure.
