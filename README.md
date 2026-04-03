# SN8Labs — AntiFraude Colombia

MVP de plataforma comunitaria para reportar, consultar y prevenir estafas con comprobantes falsos de Nequi en Colombia.

## Documentación técnica

- [`DESIGN.md`](./DESIGN.md) — Arquitectura completa, flujos, modelo de datos, endpoints, seguridad, legal y roadmap.

## Monorepo

```
antifraude/
├── apps/
│   ├── web/       # Next.js 15
│   └── api/       # NestJS 11
├── packages/
│   ├── database/  # Prisma schema + cliente compartido
│   └── typescript-config/
├── scripts/
│   └── setup-prisma.js   # Crea symlinks necesarios para Prisma + pnpm
```

## Requisitos

- [pnpm](https://pnpm.io/) `>= 10`
- PostgreSQL 15+ (local o cloud)
- Node.js `>= 20`

## Arranque local

### 1. Variables de entorno

```bash
cp .env.example .env
# Edita .env si es necesario. Para local con PostgreSQL nativo:
# DATABASE_URL="postgresql://TU_USUARIO@localhost:5432/antifraude?schema=public"
```

### 2. Instalar dependencias

```bash
pnpm install
```

> El `postinstall` creará automáticamente los symlinks que Prisma necesita en el monorepo con pnpm.

### 3. Base de datos

Asegúrate de que PostgreSQL esté corriendo y la base de datos `antifraude` exista.

```bash
# Generar cliente Prisma y sincronizar schema
pnpm db:generate
pnpm db:push
```

### 4. Seed de prueba (opcional)

```bash
cd packages/database
DATABASE_URL="postgresql://TU_USUARIO@localhost:5432/antifraude?schema=public" node seed.js
```

### 5. Arrancar servicios

En dos terminales distintas:

**Backend:**
```bash
cd apps/api
DATABASE_URL="postgresql://TU_USUARIO@localhost:5432/antifraude?schema=public" PORT=3001 npx tsc && node dist/main.js
```

> En desarrollo puedes usar `npx nest start --watch` en lugar de `tsc && node`, pero asegúrate de que el puerto 3001 esté libre.

**Frontend:**
```bash
cd apps/web
npx next dev
```

- Web: http://localhost:3000 (o el puerto que Next.js asigne si 3000 está ocupado)
- API: http://localhost:3001/api/v1

### 6. Probar el endpoint de búsqueda

```bash
curl -s -X POST http://localhost:3001/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"phone":"3102345678"}'
```

## Estructura de endpoints (MVP)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/search` | Consultar riesgo por número celular |

## Notas de desarrollo

- **Prisma + pnpm workspaces:** el script `scripts/setup-prisma.js` se ejecuta automáticamente en `postinstall` para crear los symlinks necesarios (`apps/api/node_modules/.prisma/client`).
- **CORS:** en desarrollo se permite `localhost:3000` y `localhost:3002`.
- **Rate limiting:** configurado globalmente con `@nestjs/throttler` (10 req/min por IP en endpoints públicos).

## Nota legal

Este proyecto es una herramienta comunitaria de prevención. No tiene afiliación con Nequi, Daviplata ni ninguna entidad financiera.
