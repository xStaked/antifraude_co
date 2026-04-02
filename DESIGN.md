# SN8Labs — AntiFraude Colombia: Comprobantes Nequi
## Documento de Arquitectura & Diseño Técnico (MVP)

> **Versión:** 1.0  
> **Fecha:** 2026-04-01  
> **Enfoque:** MVP práctico para equipo pequeño (2–3 devs). Colombia únicamente.  
> **Stack:** NestJS + Next.js + PostgreSQL + Redis + Object Storage (S3-compatible).

---

## 1. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USUARIO FINAL                               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────▼──────────────────────────────────────┐
│  Next.js 15 (App Router)                                            │
│  ├─ Landing + Buscador                                             │
│  ├─ Formulario de reporte (< 2 min)                                │
│  ├─ Panel de resultado (riesgo / reportes)                         │
│  └─ Páginas legales (T&C, Privacidad, Apelación)                   │
│     Deploy: Vercel / VPS (Docker)                                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ JSON/REST
┌──────────────────────────────▼──────────────────────────────────────┐
│  API Gateway / NestJS 11                                            │
│  ├─ Módulo Público  (search, reports, reviews)                     │
│  ├─ Módulo Admin    (moderation, auth, audit)                      │
│  ├─ Rate Limiter    (Redis)                                        │
│  ├─ Captcha Guard   (Turnstile)                                    │
│  └─ File Service    (Presigned URLs S3/MinIO/R2)                   │
│     Deploy: VPS (Docker Compose / Coolify / Railway)               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
┌────────▼─────────┐  ┌────────▼─────────┐  ┌───────▼────────┐
│   PostgreSQL 16  │  │      Redis 7     │  │  Object Store  │
│   (Render / RDS  │  │  (Rate limit +   │  │  (Cloudflare   │
│   / Self-hosted) │  │   cache risk)    │  │   R2 / MinIO)  │
└──────────────────┘  └──────────────────┘  └────────────────┘
```

### Principios arquitectónicos
1. **API stateless** → JWT cortos (access 15 min / refresh 7 días) para admins. Público sin login.
2. **Búsqueda rápida** → índice funcional en `report_targets.normalized_phone` + caché Redis de 5 min para resultados de búsqueda frecuentes.
3. **Escritura async** → el score de riesgo se recalcula vía trigger de DB o job en background (NestJS `Bull` con Redis) para no bloquear el POST de reporte.
4. **Segregación de lectura/escritura** (simple): el endpoint de búsqueda lee de la tabla `report_targets` y su `risk_snapshot` cacheado.

---

## 2. Flujo del Usuario Final

### 2.1 Consultar riesgo
1. Entra a `/` → campo único: "Ingresa el número de celular".
2. Sistema normaliza y redirige a `/consultar/{id-o-hash}` (usamos UUID del target, nunca el teléfono crudo en URL por privacidad, pero en MVP puede ser query string enmascarada).
3. Pantalla de resultado:
   * **Sin reportes:** "No tenemos reportes registrados para este número. Eso no garantiza que sea seguro: verifica siempre en la app de Nequi antes de entregar."
   * **Con reportes:** Banner con nivel de riesgo (Bajo / Medio / Alto). Lista de incidentes recientes (solo fecha aproximada, tipo y canal). Disclaimer legal prominente.
4. CTA secundario: "¿Te intentaron estafar con este número? Reportarlo toma 90 segundos."

### 2.2 Reportar un incidente
1. `/reportar?phone=...` (pre-cargado si viene de búsqueda).
2. Formulario de 4 pasos visuales (pero en una sola página scrolleable):
   * **Paso 1:** Número del supuesto estafador (obligatorio).
   * **Paso 2:** Datos del incidente: monto, fecha, tipo, canal, descripción corta (máx 500 chars).
   * **Paso 3:** Evidencia opcional (máx 2 imágenes, 2 MB c/u). Upload directo a presigned URL.
   * **Paso 4:** Checkbox de consentimiento legal + CAPTCHA + submit.
3. Sistema valida deduplicación. Si existe duplicado reciente, muestra: "Ya recibimos un reporte muy similar en las últimas 24 horas. Estamos revisándolo."
4. Confirmación: "Gracias. Tu reporte está en revisión. Suele tardar menos de 24 horas en aparecer públicamente."

### 2.3 Solicitar revisión / eliminación (Derecho de petición Habeas Data)
1. En la página de resultado, botón "Solicitar revisión de este número".
2. Formulario simple: nombre, correo, motivo (select + texto libre).
3. Confirmación: "Hemos registrado tu solicitud. Te contactaremos en máximo 10 días hábiles."

---

## 3. Flujo del Moderador

### 3.1 Login
* `/admin/login` → email + contraseña + 2FA opcional en MVP v1.1 (post-MVP).
* JWT seguro, `HttpOnly`, `SameSite=Strict`.

### 3.2 Dashboard de Moderación
* **KPIs:** reportes pendientes hoy, reportes aprobados esta semana, solicitudes de revisión abiertas.
* **Cola principal:** tabla de reportes con estado `pending`.
* Acciones rápidas por fila: Aprobar | Rechazar | Ocultar | Marcar duplicado.

### 3.3 Detalle de un reporte
* Info completa del reporte (teléfono enmascarado para el admin también, salvo click-to-reveal con auditoría).
* Evidencia: thumbnails clickeables.
* Historial del número: todos los reportes previos asociados.
* Acciones con nota obligatoria:
  * `approve` → pasa a `approved` y afecta el score.
  * `reject` → `rejected` (spam, falso, sin fundamento).
  * `hide` → `hidden` (soft delete visible; conserva datos).
  * `flag_duplicate` → `flagged` (vincula al reporte original).
* Todo se guarda en `moderation_actions` con `admin_user_id` y timestamp.

---

## 4. Diseño de Base de Datos

Usamos **Prisma ORM** con PostgreSQL. El schema está en `prisma/schema.prisma`.

### Entidades principales

#### `ReportTarget`
Teléfono normalizado. Es el agregado sobre el que consultamos.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | PK |
| `normalizedPhone` | VARCHAR(15) | Único. Ej: `+573102345678` |
| `displayPhoneMasked` | VARCHAR(15) | Ej: `+57 310 *** *678` |
| `riskScoreSnapshot` | INT | Cache del último cálculo |
| `riskLevelSnapshot` | ENUM | `none`, `low`, `medium`, `high` |
| `totalApprovedReports` | INT | Conteo cacheado |
| `lastReportAt` | TIMESTAMP | Último reporte aprobado |
| `createdAt` / `updatedAt` | TIMESTAMP | |

**Índices:** `normalizedPhone` (unique), `riskScoreSnapshot` (para queries de dashboard), `lastReportAt`.

#### `Report`
Cada incidente reportado.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | PK |
| `targetId` | UUID | FK → `ReportTarget` |
| `reporterIpHash` | VARCHAR(64) | Hash SHA-256 de IP (rate limit / abuso) |
| `reporterName` | VARCHAR(100) | Opcional; nunca se muestra público |
| `reportedName` | VARCHAR(100) | Nombre que la víctima dice del estafador |
| `amountCents` | BIGINT | Opcional. Siempre en centavos de COP |
| `incidentDate` | DATE | Fecha que dice la víctima |
| `fraudType` | ENUM | `fake_voucher`, `not_reflected`, `attempt` |
| `channel` | ENUM | `whatsapp`, `facebook_marketplace`, `instagram`, `other` |
| `description` | TEXT | Máx 500 chars en validación de app |
| `status` | ENUM | `pending`, `approved`, `rejected`, `hidden`, `flagged` |
| `dedupHash` | VARCHAR(64) | Hash para deduplicación rápida |
| `createdAt` / `updatedAt` | TIMESTAMP | |

**Índices:** `targetId` + `status`, `dedupHash`, `createdAt`.

#### `ReportEvidence`
Evidencia adjunta.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | PK |
| `reportId` | UUID | FK → `Report` (on delete cascade) |
| `fileUrl` | TEXT | URL firmada o pública (según bucket policy) |
| `fileType` | VARCHAR(50) | `image/jpeg`, `image/png` |
| `fileSize` | INT | Bytes |
| `checksum` | VARCHAR(64) | SHA-256 del archivo |
| `createdAt` | TIMESTAMP | |

#### `ModerationAction`
Auditoría de cada decisión humana.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | PK |
| `reportId` | UUID | FK → `Report` |
| `adminUserId` | UUID | FK → `AdminUser` |
| `actionType` | ENUM | `approve`, `reject`, `hide`, `flag_duplicate` |
| `note` | TEXT | Obligatorio. Mínimo 10 caracteres. |
| `createdAt` | TIMESTAMP | |

#### `ReviewRequest`
Solicitudes de supresión / corrección (Habeas Data).

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | PK |
| `targetId` | UUID | FK → `ReportTarget` |
| `applicantName` | VARCHAR(100) | |
| `contactEmail` | VARCHAR(255) | |
| `reason` | TEXT | |
| `status` | ENUM | `open`, `in_review`, `resolved`, `rejected` |
| `resolutionNote` | TEXT | Interna |
| `createdAt` / `updatedAt` | TIMESTAMP | |

#### `AdminUser`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | PK |
| `email` | VARCHAR(255) | Único |
| `passwordHash` | VARCHAR(255) | bcrypt |
| `role` | ENUM | `moderator`, `admin` |
| `lastLoginAt` | TIMESTAMP | |
| `createdAt` | TIMESTAMP | |

### Estrategia de normalización y consistencia
* Todo teléfono pasa por una función pura `normalizeColombianPhone()` antes de tocar la DB.
* La app nunca almacena el número crudo sin normalizar en el campo de búsqueda principal.
* Uso de transacciones para: (1) upsert de `ReportTarget`, (2) insert de `Report`, (3) insert de `ReportEvidence`.

---

## 5. Endpoints REST Iniciales

> Base path: `/api/v1`

### Públicos (no requiere auth)

#### `POST /search`
Consulta rápida por número. Devuelve el estado del target.

**Request:**
```json
{
  "phone": "310 234 5678",
  "captchaToken": "03AGdBq25..."
}
```

**Response 200:**
```json
{
  "targetId": "uuid",
  "displayPhone": "+57 310 *** *678",
  "riskLevel": "medium",
  "riskScore": 28,
  "totalApprovedReports": 3,
  "lastReportAt": "2026-03-28T14:00:00Z",
  "recentReports": [
    {
      "id": "uuid",
      "incidentDate": "2026-03-25",
      "fraudType": "fake_voucher",
      "channel": "whatsapp",
      "amountCents": 15000000
    }
  ],
  "disclaimer": "La información..."
}
```

**Rate limit:** 10 req/min por IP, 20 req/min por número consultado.

---

#### `POST /reports`
Crear un nuevo reporte.

**Request:**
```json
{
  "phone": "3102345678",
  "reportedName": "Carlos P.",
  "amount": 150000,
  "incidentDate": "2026-03-25",
  "fraudType": "fake_voucher",
  "channel": "whatsapp",
  "description": "Me envió un comprobante falso de Nequi.",
  "evidence": [
    { "fileName": "comprobante.jpg", "mimeType": "image/jpeg", "checksum": "sha256..." }
  ],
  "captchaToken": "03AG..."
}
```

**Response 201:**
```json
{
  "reportId": "uuid",
  "status": "pending",
  "message": "Reporte recibido. Está en revisión.",
  "duplicateDetected": false
}
```

**Response 409 (duplicado):**
```json
{
  "error": "DUPLICATE_DETECTED",
  "message": "Ya existe un reporte similar en las últimas 24 horas."
}
```

**Rate limit:** 2 reportes/hora por IP, 5 reportes/día por IP.

---

#### `POST /reports/presigned-url`
Obtener URL para subir evidencia directamente al bucket.

**Request:**
```json
{
  "fileName": "comprobante.jpg",
  "mimeType": "image/jpeg",
  "size": 1048576
}
```

**Response 200:**
```json
{
  "uploadUrl": "https://r2.cloudflarestorage.com/...",
  "publicUrl": "https://cdn.antifraude.sn8labs.co/reports/uuid/file.jpg",
  "expiresIn": 300
}
```

---

#### `POST /review-requests`
Solicitar revisión de un número.

**Request:**
```json
{
  "targetId": "uuid",
  "applicantName": "Juan Pérez",
  "contactEmail": "juan@email.com",
  "reason": "Ese número es mío y no he cometido ninguna estafa."
}
```

**Response 201.**

---

### Admin (requiere JWT)

#### `POST /admin/auth/login`
Devuelve access token + refresh token.

#### `GET /admin/reports`
Query params: `status=pending&page=1&limit=20&sort=createdAt:desc`

#### `GET /admin/reports/:id`
Detalle completo con evidencias e historial del target.

#### `POST /admin/reports/:id/actions`
**Request:**
```json
{
  "actionType": "approve",
  "note": "Evidencia clara de comprobante falso."
}
```
Al ejecutar, se actualiza el `ReportTarget.riskScoreSnapshot` en background.

#### `GET /admin/review-requests`
Lista de solicitudes Habeas Data abiertas.

#### `PATCH /admin/review-requests/:id`
**Request:**
```json
{
  "status": "resolved",
  "resolutionNote": "Se verificó identidad. Se ocultaron los reportes asociados."
}
```

---

## 6. Reglas de Normalización de Números Colombianos

### Función `normalizeColombianPhone(input: string): string`

```typescript
function normalizeColombianPhone(raw: string): string {
  // 1. Eliminar todo lo que no sea dígito
  const digits = raw.replace(/\D/g, '');

  // 2. Si empieza con 57 y tiene 12 dígitos: +57XXXXXXXXXX
  if (digits.length === 12 && digits.startsWith('57')) {
    return `+${digits}`;
  }

  // 3. Si tiene 10 dígitos y empieza con 3 (móvil colombiano)
  if (digits.length === 10 && digits.startsWith('3')) {
    return `+57${digits}`;
  }

  // 4. Si tiene 9 dígitos y empieza con 3 (sin código de país)
  if (digits.length === 9 && digits.startsWith('3')) {
    return `+573${digits}`; // ERROR: duplicaría el 3. Corrección:
    // En realidad, en Colombia los móviles son 3xx xxx xxxx (10 dígitos).
    // Un input de 9 dígitos que empiece con 3 es inválido (falta un dígito).
  }

  // 5. Si tiene 11 dígitos y empieza con 57 (sin el +)
  if (digits.length === 11 && digits.startsWith('57') && digits[2] === '3') {
    return `+${digits}`;
  }

  throw new BadRequestException('Número colombiano no válido.');
}
```

### Reglas exactas de validación
1. **Longitud final esperada:** `+57` + 10 dígitos = 13 caracteres.
2. **Prefijo móvil:** el décimo dígito (el primero después de 57) debe ser `3`.
3. **Formatos aceptados de entrada:**
   * `+57 310 234 5678`
   * `573102345678`
   * `3102345678`
   * `310 234 5678`
4. **Rechazos explícitos:**
   * Fijos que no empiecen en 3 (no son target de Nequi en este MVP).
   * Menos de 10 dígitos nacionales.
   * Más de 12 dígitos numéricos.
5. **Display enmascarado:** `+57 310 *** *678` (últimos 3 dígitos visibles).

---

## 7. Reglas de Deduplicación de Reportes

Objetivo: evitar spam de reportes sobre el mismo incidente por venganza o error.

### 7.1 Hash de deduplicación
Se genera un hash SHA-256 de la concatenación de:
* `normalizedPhone`
* `amountCents` (si es null, usar string `"NULL"`)
* `incidentDate` (ISO date)
* `fraudType`
* `channel`

```typescript
const dedupHash = crypto
  .createHash('sha256')
  .update(`${normalizedPhone}:${amountCents}:${incidentDate}:${fraudType}:${channel}`)
  .digest('hex');
```

### 7.2 Ventana de tiempo
* Se busca en `reports` cualquier registro con el mismo `dedupHash` y `createdAt >= NOW() - INTERVAL '24 hours'`.
* Si existe → rechazar con `409 Conflict` y mensaje amigable.

### 7.3 Heurística de descripción (segunda línea de defensa)
Si el hash base no coincide pero dentro de 24h existe un reporte para el mismo `targetId` con:
* `amountCents` exacto (o ambos null)
* `incidentDate` exacto
* Similaridad de descripción > 85% (distancia de Levenshtein)

→ Marcar el nuevo reporte como `flagged` automáticamente en lugar de rechazarlo; pasa a revisión humana. Esto permite capturar pequeñas variaciones sin perder datos.

### 7.4 Rate limit adicional
* Máximo 3 reportes por mismo `normalizedPhone` / día desde la misma IP (hash de IP).

---

## 8. Estrategia de Scoring de Riesgo Simple (MVP)

No usamos ML en el MVP. Usamos una fórmula determinista, fácil de auditar.

### Fórmula base por reporte aprobado
```
puntos_reporte = 10 (base)
+ 5  si tiene evidencia adjunta
+ 5  si el incidente ocurrió hace menos de 30 días
+ 3  si el monto reportado es >= $500.000 COP
+ 2  si el canal es whatsapp (mayor prevalencia documentada)
```

### Decaimiento temporal
Para evitar que un número reportado hace 2 años siga en "Alto" para siempre:
```
multiplicador_antiguedad =
  1.0   si lastReportAt <= 30 días
  0.7   si 31–90 días
  0.4   si 91–180 días
  0.2   si 181–365 días
  0.0   si > 365 días  (score mínimo 0)
```

### Cálculo total
```
rawScore = Σ(puntos_reporte_i) * multiplicador_antiguedad
```

### Niveles de riesgo
| Rango | Nivel | Color sugerido |
|-------|-------|----------------|
| 0 | `none` | Verde |
| 1 – 20 | `low` | Amarillo |
| 21 – 40 | `medium` | Naranja |
| 41+ | `high` | Rojo |

### Implementación
* Un **NestJS Queue Worker** (Bull + Redis) escucha el evento `ReportModerated`.
* Al aprobar/rechazar/ocultar, el worker recalcula el score del `ReportTarget` asociado y actualiza:
  * `riskScoreSnapshot`
  * `riskLevelSnapshot`
  * `totalApprovedReports`
  * `lastReportAt`
* TTL en Redis de 5 min para la respuesta de búsqueda, invalidado al actualizar el snapshot.

---

## 9. Estrategia de Seguridad

### 9.1 Aplicación Web
* **Helmet.js** en NestJS: CSP estricto, HSTS, referrer-policy.
* **CORS:** whitelist estricto de dominios (`https://antifraude.sn8labs.co`).
* **Validación:** `class-validator` en todos los DTOs; tamaños máximos en strings; sanitize-html en descripciones.
* **CAPTCHA:** Cloudflare Turnstile (gratuito, sin fricción visual alta) en:
  * Búsqueda pública
  * Envío de reporte
  * Solicitud de revisión

### 9.2 Rate Limiting
Usamos `rate-limiter-flexible` con Redis.

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| `POST /search` | 10 req | 1 min por IP |
| `POST /search` | 20 req | 1 min por phone target |
| `POST /reports` | 2 req | 1 hora por IP |
| `POST /reports` | 5 req | 24 horas por IP |
| `POST /review-requests` | 2 req | 1 hora por IP |
| Login admin | 5 intentos | 15 min por IP |

### 9.3 Almacenamiento de archivos
* **Presigned URLs PUT** para upload directo al bucket (R2 / MinIO). El backend nunca recibe el binario.
* **Validaciones:**
  * `content-type` forzado a `image/jpeg` o `image/png`.
  * `content-length` máximo 2.097.152 bytes (2 MB).
* **Post-proceso opcional (fase 1.1):** compresión con Sharp a thumbnail WebP 800px de ancho; el archivo original se elimina tras 30 días.
* **Checksum SHA-256:** se compara en backend para integridad.

### 9.4 Protección de datos sensibles
* **Enmascaramiento:** en toda respuesta pública el teléfono se muestra como `+57 310 *** *678`.
* **No exposición de reporter:** el nombre del reportante nunca se incluye en respuestas JSON públicas.
* **UUIDs:** usamos UUID v4 para todos los IDs de recursos, evitando enumeración secuencial.
* **Logs:** nunca loggear teléfonos en texto plano; usar el hash o el UUID del target.

### 9.5 Infraestructura
* **PostgreSQL:** conexión sobre SSL/TLS. Usuario de aplicación con permisos mínimos (no superuser).
* **Secrets:** gestión en variables de entorno (`.env` local) o secret manager del cloud.
* **Backups:** PostgreSQL con pg_dump diario; bucket con versioning habilitado.

---

## 10. Estrategia Legal y de Cumplimiento Mínima Viable

### 10.1 Principios de Habeas Data (Ley 1581 de 2012, Colombia)
1. **Finalidad limitada:** los datos se usan únicamente para informar preventivamente sobre riesgos de fraude.
2. **Consentimiento:** checkbox obligatorio en el formulario de reporte: "Entiendo que este reporte será revisado y usado con fines preventivos. Acepto la política de tratamiento de datos."
3. **Derechos del titular:**
   * **Conocer:** cualquiera puede consultar si un número tiene reportes.
   * **Rectificar / Suprimir:** canal formal vía `ReviewRequest`. El equipo debe responder en máximo 10 días hábiles.
   * **Revocar:** el titular puede pedir la eliminación de sus datos personales si demuestra titularidad del número.

### 10.2 Disclaimers obligatorios (visibles en UI)
* **Banner en resultados de búsqueda:**
  > "La información publicada en esta plataforma proviene de reportes realizados por usuarios y tiene fines preventivos e informativos. No constituye una decisión judicial ni una acusación legal definitiva. Verifique siempre el pago directamente en su aplicación bancaria."
* **Footer en todas las páginas:**
  > "SN8Labs no tiene afiliación con Nequi, Daviplata ni ninguna entidad financiera. Esta es una herramienta comunitaria de prevención."
* **Página de Términos y Condiciones:** prohibición explícita de reportes falsos o con fines de difamación; consecuencias legales para quien abuse.
* **Página de Política de Privacidad:** qué datos recolectamos, por qué, por cuánto tiempo (máximo 2 años de inactividad), y cómo ejercer derechos Habeas Data.

### 10.3 Moderación como salvaguarda legal
* Todo reporte pasa por un humano antes de afectar el score público. Esto reduce drásticamente el riesgo de difamación por contenido generado por usuarios.
* Un reporte nunca dice "esta persona es estafadora"; dice "este número ha sido asociado a un incidente reportado como `comprobante falso`".
* Nunca se publica el nombre del reportante.

### 10.4 Retención y eliminación
* **Política de retención:** 2 años para reportes `approved`. Después de ese periodo sin nueva actividad, el número se anonimiza (eliminamos `displayPhoneMasked` y dejamos solo hash) o se elimina el target si no hay reportes activos.
* **Soft delete:** los reportes ocultos o rechazados se mantienen en DB con `status = hidden/rejected` por 1 año para auditoría legal, luego se purgan.

---

## 11. Estructura de Carpetas

Propuesta de monorepo ligero usando **Turborepo** o workspaces de npm/yarn/pnpm.

```
antifraude/
├── apps/
│   ├── web/                     # Next.js 15 (App Router)
│   │   ├── app/
│   │   │   ├── page.tsx         # Landing + buscador
│   │   │   ├── consultar/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # Resultado de búsqueda
│   │   │   ├── reportar/
│   │   │   │   └── page.tsx     # Formulario de reporte
│   │   │   ├── revision/
│   │   │   │   └── page.tsx     # Solicitar revisión
│   │   │   ├── terminos/
│   │   │   ├── privacidad/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   ├── lib/
│   │   │   └── api.ts           # Cliente HTTP hacia NestJS
│   │   └── package.json
│   │
│   └── api/                     # NestJS 11
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── config/
│       │   ├── common/
│       │   │   ├── guards/
│       │   │   ├── filters/
│       │   │   ├── interceptors/
│       │   │   └── pipes/
│       │   ├── modules/
│       │   │   ├── search/
│       │   │   ├── reports/
│       │   │   ├── review-requests/
│       │   │   ├── admin/
│       │   │   ├── moderation/
│       │   │   └── files/
│       │   └── shared/
│       │       ├── prisma/
│       │       ├── queues/
│       │       └── utils/
│       ├── test/
│       └── package.json
│
├── packages/
│   ├── database/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       └── index.ts
│   ├── ui/                      # shadcn/ui o componentes compartidos
│   └── ts-config/
│
├── turbo.json
├── docker-compose.yml           # PG + Redis + MinIO local
└── README.md
```

### Notas de organización
* **`apps/web`:** no tiene lógica de negocio. Solo UI, llamadas a API y manejo de estado local.
* **`apps/api`:** módulos verticales por dominio (`search`, `reports`, `moderation`).
* **`packages/database`:** centraliza Prisma Client para evitar duplicación de modelos.

---

## 12. Roadmap de Evolución del MVP a Producto Serio

### Fase 1 — MVP Core (Semanas 1–6)
*Objetivo: tener la herramienta usable en producción.*
* [S1-2] Setup de infraestructura, DB, CI/CD, y página legal base.
* [S2-3] Módulos públicos: búsqueda, reporte con upload, deduplicación.
* [S3-4] Módulo de moderación básico: login, approve/reject/hide, auditoría.
* [S5] Scoring, rate limiting, CAPTCHA, tests de integración.
* [S6] Soft launch con 5 usuarios de confianza. Iterar UX.

### Fase 2 — Validación de Comprobantes & OCR (Semanas 7–10)
*Objetivo: reducir falsos positivos y dar valor agregado al reporte.*
* [S7] **Guía de validación visual:** checklist interactivo en el frontend ("¿El comprobante tiene el logo pixelado?", "¿La fecha coincide con la hora actual?").
* [S8] **OCR básico:** integración con Tesseract.js o AWS Textract para extraer monto y fecha del comprobante subido. Comparar automáticamente contra los datos del reporte; si no coinciden, alertar al moderador.
* [S9] **Perceptual Hashing:** generar hash visual de las imágenes de comprobantes. Si 2 reportes diferentes suben comprobantes con hash visual idéntico, marcar como posible red de estafa.
* [S10] Dashboard de "patrones": top de comprobantes reutilizados, canales más frecuentes.

### Fase 3 — Bot de WhatsApp para Consulta Rápida (Semanas 11–14)
*Objetivo: llevar la consulta al canal donde ocurre el fraude.*
* [S11] Elegir proveedor: Twilio WhatsApp API (más estable, costo por mensaje) o Whapi / Baileys (self-hosted, más barato pero más mantenimiento). **Recomendación para MVP:** Twilio Sandbox → producción con número verificado.
* [S12] Flujo del bot:
  1. Usuario escribe "Consultar 3102345678".
  2. Bot normaliza y llama a `POST /search`.
  3. Bot responde con el nivel de riesgo y un link corto a la web para ver detalles.
* [S13] Integrar reporte vía WhatsApp: usuario envía screenshot del comprobante y número. Bot genera un borrador de reporte y le envía link para completar 2 datos en la web.
* [S14] Analytics de uso del bot.

### Fase 4 — Soporte para Daviplata y Transferencias Bancarias (Semanas 15–20)
*Objetivo: expandir el alcance a otras billeteras sin perder la simplicidad.*
* [S15] Extender `fraudType` y `channel` sin cambios estructurales grandes.
* [S16] Nuevo campo `walletOrBank` en `Report`: `nequi`, `daviplata`, `bancolombia`, `other`.
* [S17] Landing con selector de billetera/banco antes de la búsqueda (default: Nequi).
* [S18] Normalización adicional para cuentas bancarias (si aplica): solo consulta por número de celular asociado a la cuenta, no por número de cuenta profundo.
* [S19] Marketing y SEO local: páginas de aterrizaje por ciudad / modalidad de estafa.
* [S20] Monetización sostenible: modelo freemium (consultas ilimitadas, reportes prioritarios con suscripción para comerciantes) o API paga para integradores.

---

## Apéndice A: Stack concreto recomendado para arrancar hoy

| Capa | Herramienta | Justificación |
|------|-------------|---------------|
| Frontend | Next.js 15 + Tailwind + shadcn/ui | Velocidad de UI, SSR para SEO legal, comunidad grande. |
| Backend | NestJS 11 + Prisma | Estructura escalable, validación integrada, typesafe DB. |
| DB | PostgreSQL 16 (Render / Supabase / RDS) | ACID, robustez, JSONB para metadata futura. |
| Cache / Queue | Redis (Upstash / self-hosted) | Rate limit + Bull queues para scoring async. |
| Storage | Cloudflare R2 | S3-compatible, sin egress fees, ideal para imágenes. |
| Auth Admin | NestJS Passport + JWT | Simple, bien documentado, fácil de auditar. |
| Hosting API | Coolify en Hetzner / Railway | Balance costo-control para equipo pequeño. |
| Captcha | Cloudflare Turnstile | Gratuito, menos fricción que reCAPTCHA. |

---

**Documento preparado por:** Arquitecto Senior SN8Labs  
**Próximo paso sugerido:** aprobación de este diseño → generación de tickets de implementación para Semana 1 (setup de repositorio e infraestructura local con Docker Compose).
