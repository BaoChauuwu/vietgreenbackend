# VietGreenX — API Coding Guide

VietGreenX has **two separate API surfaces**. Do not mix them.

|                 | **App**                      | **Admin**                  |
| --------------- | ---------------------------- | -------------------------- |
| Folder          | `src/modules/app/`           | `src/modules/admin/`       |
| Routes          | `/app/...`                   | `/admin/...`               |
| Users           | Mobile / web app (end users) | Admin panel staff          |
| Auth guard      | `AppAuthGuard`               | `AuthGuard` + `RolesGuard` |
| Swagger tag     | `App / ...`                  | `Admin / ...`              |
| Operation label | `[AUTH]` or `[PUBLIC]`       | `[ADMIN]` or `[PUBLIC]`    |

**Same domain, two modules** (example: categories):

- App: `GET /app/categories` — public read (`CategoryService`)
- Admin: `POST /admin/categories` — CRUD (`AdminCategoryService`, role `ADMIN`)

They may share **repositories / entities** (DB layer) but must have **separate controllers, services, and DTOs**.

---

## Before you code

1. Know which surface your task is: **app** or **admin**
2. Open the matching **reference module** (see tables below)
3. Copy structure — do not invent a new pattern
4. Run `npm run build` before opening a PR

---

## Shared conventions (both app and admin)

| Topic             | Rule                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| DTO request file  | `create-post.request.dto.ts` → `CreatePostRequestDto`                                                      |
| DTO response file | `post.response.dto.ts` + `@Expose()` on every returned field                                               |
| Response mapping  | `return toDto(XxxResponseDto, data)` — **not** `plainToInstance` in controllers                            |
| Every endpoint    | `@Responser.handle('...')` + `@HttpCode`                                                                   |
| Service errors    | `HttpBadRequestError` / `HttpNotFoundError` / `HttpForbiddenError` / `HttpUnauthorizedError` + `ErrorCode` |
| Body parameter    | `@Body() dto: CreateXxxRequestDto`                                                                         |
| Pagination        | `PaginationDto` from `@app/common/dtos/paginationDto`                                                      |
| JSON API fields   | **camelCase** (`authorId`, `userCount`)                                                                    |
| Response wrapper  | Success: `{ "data": ... }` — Error: `{ "error": "..." }`                                                   |

### Do not (both surfaces)

- Use raw `BadRequestException` / `NotFoundException` in module services
- Transform DTOs inside services (transform in controllers only)
- Commit `.env`, credentials, or test files under `uploads/`
- Put app endpoints under `admin/` or vice versa
- Reuse the other surface's controller, guard, or response DTO

---

# App API (`src/modules/app/`)

## Module structure

```
{domain}/
  {domain}.controller.ts
  {domain}.service.ts
  {domain}.module.ts
  dto/requests/
  dto/responses/
```

## App-specific rules

| Topic                  | Rule                                                              |
| ---------------------- | ----------------------------------------------------------------- |
| Swagger tag            | `@ApiTags('App / Posts')`                                         |
| Auth                   | `AppAuthGuard` — import `AppAuthModule`                           |
| Public + optional auth | `OptionalAppAuthGuard` (e.g. post detail)                         |
| New module classes     | `BlockModule`, `FeedService` — **no** `App` prefix on new modules |
| Handler inject         | `private readonly postService: PostService`                       |

### App legacy (do not rename in feature PRs)

- `AppAuthModule`, `AppPostModule`, `AppMediaModule`
- Folder `organizations/` with files `organization.*.ts`
- Folder `app-auth/`, `user-profile/`

> Copy from **`post`** or **`share`**. Do **not** copy module naming from `app-auth`.

### Social linkage — reuse, do not duplicate

| Need                | Call                                                     |
| ------------------- | -------------------------------------------------------- |
| Can user view post? | `postService.assertCanViewPost(post, viewerId)`          |
| Block filter        | `blockService.getBlockedUserIds()` / `isEitherBlocked()` |
| Post response       | `postService.toDetailView()` / `toDetailViewForViewer()` |

### App reference modules

| Feature           | Path                            |
| ----------------- | ------------------------------- |
| Post CRUD         | `src/modules/app/post/`         |
| Feed              | `src/modules/app/feed/`         |
| Share / repost    | `src/modules/app/share/`        |
| Block             | `src/modules/app/block/`        |
| Media upload      | `src/modules/app/media/`        |
| User profile      | `src/modules/app/user-profile/` |
| Public categories | `src/modules/app/category/`     |

### App smoke test (Docker)

```bash
docker compose up -d
npm run seed:dev-feed   # if needed
```

Accounts (password `123qwe!@#`): `feed_consumer@test.local`, `feed_seller@test.local`

Flow: login → feed → post → share repost → block → profile 404

---

# Admin API (`src/modules/admin/`)

## Module structure

```
admin-{domain}/
  admin-{domain}.controller.ts
  admin-{domain}.service.ts
  admin-{domain}.module.ts
  dto/requests/
  dto/responses/
```

## Admin-specific rules

| Topic             | Rule                                                                     |
| ----------------- | ------------------------------------------------------------------------ |
| Swagger tag       | `@ApiTags('Admin / Categories')`                                         |
| Controller route  | `@Controller('admin/categories')`                                        |
| Auth (protected)  | `@UseGuards(AuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)`           |
| Operation label   | `[ADMIN]` in `@ApiOperation`                                             |
| Class names       | `AdminCategoryModule`, `AdminCategoryService`, `AdminCategoryController` |
| Response DTO      | `AdminCategoryResponseDto` (prefix `Admin` when app DTO also exists)     |
| Sensitive actions | `@AuditLog({ ... })` when changing roles, verification, etc.             |

### Admin do not

- Use `AppAuthGuard` or import `AppAuthModule` for admin endpoints
- Expose admin CRUD on `/app/...` routes
- Return app's `CategoryResponseDto` from admin endpoints — use `AdminCategoryResponseDto`

### Admin reference modules

| Feature          | Path                                    |
| ---------------- | --------------------------------------- |
| Category CRUD    | `src/modules/admin/admin-category/`     |
| User management  | `src/modules/admin/admin-user/`         |
| Org verification | `src/modules/admin/admin-organization/` |
| Admin auth       | `src/modules/admin/admin-auth/`         |
| Admin profile    | `src/modules/admin/admin-profile/`      |

---

# Code formatting (all contributors)

The repo owns formatting — **do not** rely on your IDE defaults.

| Tool | Role |
| ---- | ---- |
| `.prettierrc` | Tabs, quotes, trailing commas, LF line endings |
| `.editorconfig` | Basic hints for every editor |
| ESLint + Prettier | Lint on save / pre-commit |
| Husky + lint-staged | Auto-format staged files before each commit |

## IDE setup (Cursor / VS Code)

1. Install extensions (prompted via `.vscode/extensions.json`): **Prettier**, **ESLint**, **EditorConfig**
2. Open the repo folder — `.vscode/settings.json` enables **format on save**
3. After `git clone`, run `npm install` once (runs `husky` via `prepare` script)

## Before opening a PR

```bash
npm run format   # optional: format whole src/
npm run lint
npm run build
```

Pre-commit hook runs **Prettier + ESLint** on staged `.ts` / `.js` files automatically.

---

# PR checklist (self-review)

- [ ] Correct surface: changes only in `app/` **or** `admin/`, not mixed wrongly
- [ ] `npm run build` passes (pre-commit already formats/lints staged files)
- [ ] Swagger: correct tag (`App /` vs `Admin /`), summary, auth label
- [ ] No breaking API (or documented for FE in PR description)
- [ ] App social changes: Docker smoke if touching post / feed / share / block
- [ ] PR notes 1–2 lines: which services/repos this module calls

---

## Quick decision tree

```
Task for mobile app user?     → src/modules/app/     → AppAuthGuard     → /app/...
Task for admin panel?         → src/modules/admin/   → AuthGuard+ADMIN  → /admin/...
Same DB table as other side?  → OK to share Repository/Entity
Same Controller or DTO?       → NO — keep separate
```

## Not sure?

Ask your lead, or diff against:

- **App:** `post.controller.ts` + `post.service.ts`
- **Admin:** `admin-category.controller.ts` + `admin-category.service.ts`
