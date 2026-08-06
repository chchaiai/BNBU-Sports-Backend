# Web Backend Foundation 第一阶段任务书

## 目标

沿用现有 React/Next/vinext 结构和教师/管理员 UI，建立可逐模块替换 Mock 的 `/api/v1` 接入底座。

## 交付项

1. 从固定 OpenAPI 快照生成 TypeScript types/schema；生成物不可手改，build/test 校验 SHA-256。
2. 建立 env schema，显式区分 local/staging/production；浏览器可见配置只含非 Secret API base；缺 production URL 时 fail build/start。
3. 建立单一 HTTP transport：base URL、credentials 策略、JSON success/error envelope、最终 requestId、timeout/abort、有界 read retry 和日志脱敏。
4. 建立 Auth adapter 替换正式路径中的任意非空登录和 localStorage 角色会话：password-login、refresh、logout、me、服务端 role/session 为权威。
5. 目标 transport 为 HttpOnly Secure SameSite refresh cookie + memory access token，状态 `ACCEPTED_WITH_STAGING_VALIDATION`；把 cookie domain/path/SameSite、CORS credentials、CSRF 防护列为 staging blocker，不自定 production 值。
6. 业务只按稳定 ErrorCode 分支；未知 code 安全失败并展示 requestId，message 只作 fallback。
7. opaque cursor 原样回传；不解析、不改为页码真相、不跨主体/filter/sort/limit 缓存。
8. 一个用户意图复用一个 Idempotency-Key；mutation 超时不无限重试。
9. mutation DTO 使用最新 expectedVersion；Review 同时使用 expectedReviewVersion；冲突刷新并要求重新确认。
10. 将现有 Mock adapter 标为显式 development/test；real session/token/storage namespace 与 localStorage/sessionStorage Mock 完全隔离。
11. production build 的静态/运行测试证明 admin mock data、roster mock adapter、任意非空登录、本地业务 export 和旧规划 endpoint 不可达。
12. 保留现有页面，选择最小 smoke vertical slice（如 health/system-mode + teacher/admin Auth/me）验证 foundation；不接完全部 Course/Roster/Review/Score 页面。
13. Export 四 operation 继续展示 `SYSTEM_MODE_UNSUPPORTED` 和 requestId；禁用正式路径的浏览器即时 CSV 假实现。
14. Audit 未来只接 ADMIN 权威 list/get；第一阶段不得把 local Mock audit 描述为服务端审计。
15. 日志禁止 Authorization、Cookie、Token、密码、PII、storageKey、signed URL、媒体和完整 error body。

## UI 与职责保持

保持现有菜单、路由、教师/管理员职责和组件。Web 不伪造学生 Session/Media/Record；ADMIN 不代替责任教师 Review。正式 Score 只消费服务端 revision/publication，不沿用本地 `scoreEndurance` 作为权威成绩。
