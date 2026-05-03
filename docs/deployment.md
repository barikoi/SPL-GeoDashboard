# Deployment

## Docker Deployment

### Dockerfile Overview

Multi-stage build with 3 stages:

```
Stage 1 (deps)     → Install dependencies
Stage 2 (builder)  → Install all deps + build Next.js
Stage 3 (runner)   → Copy standalone output + static assets → run
```

**Base image:** `node:22-alpine`

**Production image contains:**
- `.next/standalone` (self-contained Next.js server)
- `.next/static` (static assets)
- `public/` (public assets)
- `entrypoint.sh` (runtime env var substitution)

### Building the Image

```bash
# Build with env vars
docker build \
  --build-arg NEXT_PUBLIC_BASE_URL=https://your-api-url.com/api \
  --build-arg NEXT_PUBLIC_AUTOCOMPLETE_API_KEY=your_api_key \
  -t spl-geodashboard:latest \
  .
```

> **Note:** The Dockerfile uses placeholder values as defaults. The `entrypoint.sh` replaces them at runtime using `sed`. This means you can pass env vars at either build time OR runtime.

### Running with Docker

```bash
# Using docker-compose (production)
export TAG=latest
docker-compose up -d

# Or directly with docker run
docker run -d \
  --name spl-geodashboard \
  -p 80:3000 \
  -e NEXT_PUBLIC_BASE_URL=https://your-api-url.com/api \
  -e NEXT_PUBLIC_AUTOCOMPLETE_API_KEY=your_api_key \
  spl-geodashboard:latest
```

### Docker Compose Configuration

The project includes two compose configurations:

**Staging** (`docker-compose.yaml`):
```yaml
services:
  spl_geodashboard:
    container_name: spl-geodashboard
    image: rilusmahmud/spl-geodashboard:${TAG}
    restart: unless-stopped
    environment:
      - NEXT_PUBLIC_BASE_URL=""
      - NEXT_PUBLIC_AUTOCOMPLETE_API_KEY=""
    ports:
      - "8071:3000"
```

### Runtime Environment Substitution

`entrypoint.sh` performs runtime substitution of environment variables:

1. Verifies `NEXT_PUBLIC_BASE_URL` is set
2. Verifies `NEXT_PUBLIC_AUTOCOMPLETE_API_KEY` is set
3. Replaces placeholder strings in all `.next` files with actual values using `sed`

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_BASE_URL` | Yes | SPL Backend API base URL | `https://na-routing.vng-solutions.com/api/v1` |
| `NEXT_PUBLIC_AUTOCOMPLETE_API_KEY` | Yes | API key for map search autocomplete | `your_autocomplete_api_key` |

### Setting Up Local Environment

```bash
# Copy the env template (create one if needed)
cp .env.example .env

# Edit with your values
# .env
NEXT_PUBLIC_BASE_URL=https://na-routing.vng-solutions.com/api
NEXT_PUBLIC_AUTOCOMPLETE_API_KEY=your_api_key_here
```

> **Warning:** Never commit `.env` to version control. It's listed in `.gitignore`.

---

## Application Path Configuration

The application is served under `/spl` path:

```javascript
// next.config.js
basePath: '/spl',
assetPrefix: '/spl/',
trailingSlash: true,
```

This means:
- App URL: `https://domain.com/spl/`
- Static assets: `https://domain.com/spl/_next/static/...`
- Images: `https://domain.com/spl/images/...`

If deploying at root path, remove `basePath` and `assetPrefix` from `next.config.js`.

---

## Build Output

```
.next/
├── standalone/          # Self-contained server (no node_modules needed)
│   ├── server.js        # Production server entry point
│   └── node_modules/    # Only production dependencies
├── static/              # Static assets (JS, CSS, images)
└── ...
```

The standalone output means the production image doesn't need the full `node_modules`. Only a minimal set of required packages are bundled.

---

## Node.js Version

```
Required: >=18.17.0 <23.0.0
Docker image: node:22-alpine
```

A `.nvmrc` file exists in the project root. Use `nvm use` to switch to the correct Node version locally.

---

## Deployment Checklist

- [ ] Environment variables set (`NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_AUTOCOMPLETE_API_KEY`)
- [ ] Docker image built with correct tag
- [ ] Path prefix `/spl` configured in reverse proxy (if applicable)
- [ ] External API services accessible from deployment network:
  - `na-routing.vng-solutions.com` (SPL Backend)
  - `na-maps.vng-solutions.com` (Map Tiles + Search)
  - `gh.bmapsbd.com` (Isochrone API)
  - `gist.githubusercontent.com` (Static GeoJSON data)
- [ ] CORS enabled on backend for the deployment domain
- [ ] Health check endpoint accessible (Next.js serves on port 3000)

---

## CI/CD

The project has a `.github` directory for GitHub Actions. Husky is configured for commit linting:

- **Commit Convention:** Conventional Commits (enforced via commitlint)
- **Pre-commit:** Husky 9 (previously 8)
- **Linting:** ESLint with Next.js config (build ignores errors currently)

### Docker Registry

Images are published to Docker Hub as `rilusmahbub/spl-geodashboard`.
