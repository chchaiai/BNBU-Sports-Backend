# 本地后端开发与三端访问

来源：`backend/docs/local-runbook.md`、`backend/README.md` 和当前代码。只用于合成 local/test 数据；禁止连接旧远程 API、未知数据库或真实学生数据。

```text
LOCAL_SEED_GAP=NO
```

仓库已有统一命令 `npm run db:seed:local`。它只在 `APP_ENV=local` 运行，幂等创建合成 Organization、Semester、Teacher/Admin、Course/ClassSection、学生/Enrollment 场景和私有邀请摘要；不提供 staging/production 数据。

## 前置条件

- Node.js 24、npm 11。
- Docker Engine/Desktop 与 Compose v2。
- 从唯一 Git 根目录进入 `backend/`。
- `.env` 只存本地高熵值，不提交 Git；所有 `CHANGE_ME` 必须替换。

## Windows PowerShell

```powershell
Set-Location C:\Users\23328\Desktop\new_version\backend
Copy-Item .env.example .env
npm ci
docker compose --env-file .env up -d postgres minio minio-init
docker compose --env-file .env ps
npm run db:generate
npm run db:migration:check
npm run db:migrate:deploy
npm run db:seed:local
npm run start:dev
```

应用显式监听 `0.0.0.0`，默认 API root 为 `http://127.0.0.1:3000/api/v1`。验证：

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/v1/health/live
Invoke-RestMethod http://127.0.0.1:3000/api/v1/health/ready
Invoke-RestMethod http://127.0.0.1:3000/api/v1/system-mode
```

合同浏览页：`http://127.0.0.1:3000/api/docs`。Swagger 是生成视图，不是第二合同源。

## 各端 Base URL

| 客户端 | local Base URL | 备注 |
| --- | --- | --- |
| Web 浏览器 | `http://127.0.0.1:3000/api/v1` | `CORS_ALLOWLIST` 必须加入 Web 前端的精确 origin，不含 path |
| Android Emulator | `http://10.0.2.2:3000/api/v1` | 只用于 debug/local；确认 network security config 允许该 local HTTP |
| Android 真机 | `http://<开发机局域网IP>:3000/api/v1` | 手机与开发机同网；只开放受控 local 防火墙端口，不写死 IP |
| iOS Simulator | `http://127.0.0.1:3000/api/v1` | 在承载 Simulator 的 Mac 上运行后端；local HTTP 的 ATS 配置必须仅限 debug |
| iOS 真机 | `http://<开发机局域网IP>:3000/api/v1` | 同网并使用受控 local 配置；不要放宽 production ATS |

staging 仍为 `PENDING_INFRA_SELECTION`，production 为 `USER_APPROVAL_REQUIRED`。不得把 local 地址复制到 release 配置。

## 测试与停止

不依赖数据库：

```powershell
npm run test
npm run test:contract
npm run test:security
```

Integration/E2E 只能指向数据库名明确包含 `test` 的隔离 PostgreSQL。停止并保留 local 卷：

```powershell
docker compose --env-file .env down
```

只有在明确要销毁、且已确认是可重建合成本地数据时才使用 `down -v`。不得把清理命令指向 staging/production。

## 常见停止点

- readiness 失败：检查 PostgreSQL、Migration checksum、CURRENT Semester、SystemPolicy。
- CORS 失败：`CORS_ALLOWLIST` 必须是逗号分隔的精确 HTTP(S) origin。
- 真机不可达：先核对局域网、Windows 防火墙和开发机实际 IP；不要改为旧远程 API。
- 客户端收到 503 Export：这是当前合同预期，不得 fallback 为本地导出。
