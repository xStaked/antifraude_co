# Despliegue en Dokploy

Este monorepo se despliega mejor como dos aplicaciones separadas:

- `web` usando `Dockerfile.web`
- `api` usando `Dockerfile.api`

La infraestructura se maneja aparte en Dokploy:

- PostgreSQL
- Redis
- S3/R2 o MinIO externo

## 1. Crear proyecto

En Dokploy crea un proyecto, por ejemplo `antifraude`.

## 2. Crear la aplicación `api`

- Type: `Application`
- Source: tu repositorio Git
- Build Type: `Dockerfile`
- Dockerfile Path: `Dockerfile.api`
- Port: `4000`
- Domain: `api.tu-dominio.com`

### Variables de entorno para `api`

```env
PORT=4000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public
REDIS_URL=redis://HOST:6379
PUBLIC_WEB_URL=https://tu-dominio.com
JWT_SECRET=tu-secreto-largo
TURNSTILE_SECRET_KEY=tu-turnstile-secret
GOOGLE_API_KEY=tu-google-api-key
S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com
S3_REGION=auto
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=antifraude-evidence
S3_PUBLIC_URL=https://<bucket>.<account>.r2.dev
```

### Watch Paths para `api`

```txt
apps/api/**
packages/database/**
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
turbo.json
scripts/setup-prisma.js
Dockerfile.api
```

## 3. Crear la aplicación `web`

- Type: `Application`
- Source: tu repositorio Git
- Build Type: `Dockerfile`
- Dockerfile Path: `Dockerfile.web`
- Port: `3000`
- Domain: `tu-dominio.com`

### Variables de entorno para `web`

```env
PORT=3000
NEXT_PUBLIC_API_URL=https://api.tu-dominio.com/api/v1
NEXT_PUBLIC_TURNSTILE_SITE_KEY=tu-turnstile-site-key
```

### Watch Paths para `web`

```txt
apps/web/**
packages/database/**
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
turbo.json
Dockerfile.web
```

## 4. Infraestructura

### PostgreSQL

Usa la base administrada por Dokploy o una externa. Luego conecta su URL en `DATABASE_URL`.

### Redis

Usa Redis administrado por Dokploy o una instancia externa. Luego conecta su URL en `REDIS_URL`.

### Archivos

Para producción conviene usar Cloudflare R2 o S3. MinIO solo tiene sentido si lo vas a operar tú mismo.

## 5. Orden de despliegue

1. Despliega PostgreSQL
2. Despliega Redis
3. Configura variables en `api`
4. Despliega `api`
5. Configura variables en `web`
6. Despliega `web`

## 6. Notas

- `web` ahora compila en modo `standalone`, que es el formato correcto para Docker en Next.js.
- `api` genera Prisma durante el build del contenedor para evitar desincronizaciones del cliente.
- Si cambias `packages/database/prisma/schema.prisma`, redepliega `api`.
