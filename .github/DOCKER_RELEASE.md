# 🚀 Quick Release Guide

Fast reference for creating MELM-DASH releases.

## First-Time Setup

```bash
# 1. Initialize repository
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/melm-dash.git
git push -u origin main
```

## Creating a Release

### Option 1: Git Tag (Quick)

```bash
git tag v1.0.0
git push origin v1.0.0
# Workflow triggers automatically → ~8min build
```

### Option 2: GitHub Release (With Notes)

1. Go to: Releases → Create new release
2. Tag: `v1.0.0` (create new)
3. Write release notes
4. Publish → Workflow triggers

## Using the Image

```bash
# Pull latest
docker pull ghcr.io/YOUR_USERNAME/melm-dash:latest

# Update docker-compose.yml
image: ghcr.io/YOUR_USERNAME/melm-dash:1.0

# Deploy
docker compose up -d
```

## Tag Naming

| Tag | Meaning | Example |
|-----|---------|---------|
| `v1.0.0` | Exact version | Production deployments |
| `v1.0.1` | Bug fixes | Patch updates |
| `v1.1.0` | New features | Minor updates |
| `v2.0.0` | Breaking changes | Major updates |

## Monitoring

- **Actions**: Build progress
- **Packages**: Published images
- **Security**: Vulnerability scans

## Common Commands

```bash
# Check workflow status
gh run list --workflow=docker-publish.yml

# View latest run
gh run view --log

# Manual trigger
gh workflow run docker-publish.yml

# Pull specific version
docker pull ghcr.io/YOUR_USERNAME/melm-dash:1.2.3
```

---

📚 **Full Documentation**: [claudedocs/docker-ghcr-workflow.md](../claudedocs/docker-ghcr-workflow.md)
