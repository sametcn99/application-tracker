# Application Tracker

Application Tracker is a self-hosted workspace for people who want one place to manage their job search. It helps you keep applications, company notes, follow-ups, documents, and progress history together in a single private dashboard.

## Table of Contents

- [Overview](#overview)
- [What You Can Do](#what-you-can-do)
- [Install from a Local Clone](#install-from-a-local-clone)
- [Install from GitHub Packages](#install-from-github-packages)
- [License](#license)

## Overview

Application Tracker is designed for people who want more structure than a spreadsheet and more privacy than a hosted service.

### What You Can Do

- **Track applications**: Keep role titles, companies, compensation notes, statuses, links, and next steps in one place.
- **Organize company records**: Save company-specific notes and see every related application in context.
- **Manage documents**: Attach files to applications so resumes, cover letters, and other materials stay easy to find.
- **Follow your progress**: Use the dashboard and activity history to understand what changed and what needs attention next.
- **Customize your workflow**: Use your own tags, source lists, and currencies instead of forcing everything into a fixed template.

## Install from a Local Clone

Prerequisites:

- Docker 24+
- Docker Compose plugin

1. Clone the repository.
2. Create your environment file.
3. Fill in the values in `.env`, especially your admin account and password values.
4. Start the application stack.

```bash
git clone https://github.com/sametcn99/application-tracker.git
cd application-tracker
cp .env.example .env
docker compose up --build -d
```

After the containers start, open `http://localhost:3000` and sign in with the admin email and password you set in `.env`.

## Install from GitHub Packages

If you prefer using the published container image instead of building locally, use the package published to GitHub Container Registry.

Published image format:

```text
ghcr.io/sametcn99/application-tracker:<version>
```

Pull a published version:

```bash
docker pull ghcr.io/sametcn99/application-tracker:<version>
```

Before starting the published image, provide these environment variables directly in your deployment platform, compose file, or container configuration:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `AUTH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`

For a container-based deployment, keep the supporting services in your compose stack and run the `app` service from the published image while passing those values directly:

```yaml
services:
  app:
    image: ghcr.io/sametcn99/application-tracker:<version>
    environment:
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: change-me-postgres-password
      POSTGRES_DB: appdb
      AUTH_SECRET: change-me-to-a-long-random-string
      ADMIN_EMAIL: admin@example.com
      ADMIN_PASSWORD: Change-me-123!
      ADMIN_NAME: Admin
      MINIO_ROOT_USER: change-me-minio-user
      MINIO_ROOT_PASSWORD: change-me-minio-password
```

The supporting PostgreSQL and MinIO services should use the same values so the application, database, and object storage all start with matching credentials.

## License

Licensed under GPL-3.0. See [LICENSE](LICENSE).
