# Web 教师端和管理端接入说明

## 当前事实

Web 工程路径为 `BNBU-Sports-Web-new/`。当前是前端交互原型：任意非空账号密码可进入，admin session 保存 localStorage 30 天；admin 与 roster 主要由 localStorage/sessionStorage Mock service 提供，只有若干并不匹配权威 OpenAPI 的规划路径；尚无统一 BNBU HTTP client、真实 Token family、错误 envelope、opaque cursor 或并发协议。

本阶段不能一次性把所有 Mock 页面全部接完，也不能只隐藏演示入口后声称完成。

## 当前任务

只建立 OpenAPI TypeScript types、哈希绑定、env schema、统一 HTTP transport、Auth adapter、错误/requestId/cursor、Idempotency-Key、版本、Mock/real session 隔离、production Mock 不可达、local smoke 和日志脱敏。

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
