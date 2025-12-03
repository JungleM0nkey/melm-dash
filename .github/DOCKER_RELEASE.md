# Docker Release Guide

Fast reference for creating MELM-DASH releases with Docker images.

## Release Process

### Creating a Release (Recommended)

1. Go to: **Releases** → **Create new release**
2. Create a new tag: `v1.0.0` (semantic versioning)
3. Write release notes
4. Click **Publish release**

The workflow will automatically:
1. Run tests, linting, and type checking
2. Build the Docker image
3. Scan for vulnerabilities (fails on CRITICAL)
4. Sign the image with Cosign
5. Push to GHCR with proper tags
6. Update release notes with Docker info

### Tag Naming Convention

| Tag | Meaning | Example Use |
|-----|---------|-------------|
| `v1.0.0` | Exact version | Production deployments |
| `v1.0.1` | Bug fixes | Patch updates |
| `v1.1.0` | New features | Minor updates |
| `v2.0.0` | Breaking changes | Major updates |

## Using the Image

```bash
# Pull latest stable
docker pull ghcr.io/YOUR_USERNAME/melm-dash:latest

# Pull specific version
docker pull ghcr.io/YOUR_USERNAME/melm-dash:1.2.3

# Verify signature
cosign verify ghcr.io/YOUR_USERNAME/melm-dash:latest \
  --certificate-identity-regexp="https://github.com/YOUR_USERNAME/melm-dash/*" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com"

# Run with docker-compose (recommended)
docker compose up -d

# Or run directly
docker run -d \
  -p 3001:3001 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  ghcr.io/YOUR_USERNAME/melm-dash:latest
```

## Workflow Details

### Triggers

- **GitHub Release**: Publishing a release triggers the full pipeline
- **Manual**: Use `workflow_dispatch` for testing (with optional `skip_tests`)

### Pipeline Stages

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Validate   │────▶│  Build & Scan   │────▶│    Push      │
│  (tests,    │     │  (Trivy before  │     │  (multi-arch │
│   lint,     │     │   push)         │     │   + sign)    │
│   types)    │     │                 │     │              │
└─────────────┘     └─────────────────┘     └──────────────┘
                            │                      │
                            ▼                      ▼
                    ┌──────────────┐     ┌──────────────────┐
                    │ CRITICAL     │     │ Update Release   │
                    │ vulns? FAIL  │     │ Notes            │
                    └──────────────┘     └──────────────────┘
```

### Security Features

| Feature | Description |
|---------|-------------|
| **Trivy Scan** | Fails on CRITICAL vulnerabilities before push |
| **Cosign Signing** | Keyless signing with Sigstore |
| **SBOM** | Software Bill of Materials attached to image |
| **Provenance** | Build attestation for supply chain security |
| **Non-root** | Container runs as non-root user |

### Generated Tags

For a release `v1.2.3`:
- `1.2.3` - Exact version
- `1.2` - Minor version (auto-updates with patches)
- `1` - Major version (if not v0.x.x)
- `latest` - Always points to newest release
- `sha-abc1234` - Git commit SHA

## Monitoring & Troubleshooting

### Check Workflow Status

```bash
# List recent runs
gh run list --workflow=docker-publish.yml

# View specific run
gh run view <run-id> --log

# Manual trigger (for testing)
gh workflow run docker-publish.yml
```

### Common Issues

**Build fails on tests**
- Check the validate job logs
- Run `pnpm test` locally to reproduce

**Trivy scan fails**
- Review the Security tab for vulnerabilities
- Update base image or dependencies
- If false positive, add to `.trivyignore`

**Cosign signing fails**
- Ensure `id-token: write` permission is set
- Check GitHub OIDC provider status

### Rollback Procedure

If a bad image is published:

```bash
# Option 1: Delete the bad version (requires admin)
gh api -X DELETE /user/packages/container/melm-dash/versions/<version_id>

# Option 2: Retag a known good version as latest
docker pull ghcr.io/YOUR_USERNAME/melm-dash:<known-good-tag>
docker tag ghcr.io/YOUR_USERNAME/melm-dash:<known-good-tag> \
           ghcr.io/YOUR_USERNAME/melm-dash:latest
docker push ghcr.io/YOUR_USERNAME/melm-dash:latest
```

### Failure Notifications

On workflow failure, an issue is automatically created with:
- Link to failed workflow run
- Rollback instructions
- Labels: `bug`, `ci/cd`

## CI Workflow (PRs & Commits)

A separate CI workflow runs on PRs and pushes to `main`/`dev`:

- Lint & type check
- Run tests
- Build verification
- Docker build test (no push)

This ensures code quality before it reaches the release pipeline.
