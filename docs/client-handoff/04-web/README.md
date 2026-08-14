# Web 教师端和管理端接入说明

## 当前事实

Web 工程路径为 `BNBU-Sports-Web-new/`。`portal-teacher-admin/` 已有统一 `/api/v1` client、真实登录/refresh、错误 envelope、`Idempotency-Key` 和部分教师数据接入；但 token 仍保存在 localStorage，Roster/Admin 等范围仍混有 Mock，不能作为 Staging 或 Production 完成证据。`frontend/` 下的旧入口和 `backend/` 下的 Express/MySQL 实现都不是权威后端。

本阶段不能一次性把所有 Mock 页面全部接完，也不能只隐藏演示入口后声称完成。

## 当前任务

Contract 1.5 基线已经提供字节一致的 vendored OpenAPI、`contract.json` 和由 `openapi-typescript` 生成的只读 TypeScript 类型。下一阶段保留现有 UI，优先把打卡列表、详情、媒体访问和 Review 写回接到同一 `recordId`，再处理课程、名单与成绩；同时完成 env schema、cookie/CORS/CSRF 验收、Mock/real session 隔离和 production Mock 不可达。

Web refresh cookie 决策状态：

```text
ACCEPTED_WITH_STAGING_VALIDATION
```

目标为 Secure HttpOnly SameSite refresh cookie + memory access token，但 cookie/CORS/CSRF 传输细节必须等 staging 安全验收，不能在 local foundation 阶段宣称 production 参数已确定。

## 禁止范围

- 不修改 backend、OpenAPI、Migration、Android 或 iOS。
- 不接完所有页面，不重做现有 UI/路由/角色布局。
- 不把本地 Mock/export/audit 当正式后端事实。
- 不依赖 staging，不 push，不创建 PR。

## 提交

从唯一根仓库创建 Web foundation 分支，只提交 Web 目录获批改动。交付 branch、完整 commit、files、OpenAPI hash、测试、local smoke、requestId、cookie/CSRF 未验收项、blockers 和 clean status。
