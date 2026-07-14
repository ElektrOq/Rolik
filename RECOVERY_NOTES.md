# Recovered project

This folder contains the actual application source recovered from the supplied archive.

Changes made:
- Removed 43 one-off root patch/fix/update scripts that were not imported by the application.
- Kept `app`, `components`, `lib`, `types`, API routes, and required configuration files.
- Pinned dependencies to exact versions (no `^` or `~`).
- Aligned `eslint-config-next` with Next.js.
- Pinned Next.js to 15.4.10 to avoid the Next 15.5 devtools/React Client Manifest runtime corruption seen in the logs.

Required environment variables should be copied from `.env.example` into the deployment environment. Do not commit real secrets.

Commands:

```bash
npm ci
npm run build
npm run start
```
