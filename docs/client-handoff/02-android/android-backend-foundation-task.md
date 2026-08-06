# Android Backend Foundation 第一阶段任务书

## 目标

在不改现有业务 UI 的前提下，建立可逐模块迁移到 `/api/v1` 的 Android 接入底座。

## 交付项

1. 从固定 OpenAPI 快照生成 Kotlin model/schema；生成物不可手改，构建校验源 SHA-256。
2. 在 BuildConfig 或等效类型安全配置中区分 local/staging/production；local emulator 为 `10.0.2.2`，staging/production 未提供时 fail closed。
3. 把现有 `/api` 终止规则升级为 `/api/v1`；删除新 foundation 对旧 IP、旧 path 和网络失败切 Mock 的 fallback。
4. 建立单一 OkHttp transport：JSON envelope、超时、有界 GET/HEAD retry、mutation 不透明重放保护、响应 requestId 捕获。
5. 为 endpoint/operation 建立 typed result：成功 `data/meta`，错误 `code/message/details/requestId/timestamp`；业务只按 code 分支。
6. 实现合同 Auth/Token adapter：学生 QR Join 返回 Session；Access/Refresh 分离；受控单次 refresh、reuse/logout 失败安全处理。
7. 使用 Android Keystore-backed AES/GCM 保护 Access/Refresh；与旧单 token key 做一次性安全迁移或清除，绝不降级为明文。
8. 一个用户意图创建并复用一个 Idempotency-Key；点击防抖、超时重放与输入变化分别测试。不得在每次 request builder 调用时无条件换 key。
9. request DTO 使用最新 `expectedVersion`；Review 共用层支持 `expectedReviewVersion`。冲突时返回可供 UI 刷新/确认的 typed state。
10. opaque cursor 只原样传递；不解析、不跨账号或 filter 缓存。
11. 建立 Media 新链路的 transport 模型：initiate/private PUT/confirm/bind/status/access URL；旧 multipart adapter 只保留为显式 legacy 未接入代码，并确保 production 不可达。
12. Session recovery 以服务端 active Session 为权威；本地 snapshot 只作 UI/recovery intent，不能增加权威时长。
13. Score model 使用 decimal-safe 字符串，只展示服务端 published projection；本地 calculator 不得映射为正式 Score。
14. MockStudentWorkspace、测试 fixture 与 real auth/token/workspace 使用不同入口和 storage namespace；production build/test 证明 Mock 不可达。
15. logging interceptor 采用 allowlist，脱敏 Token、密码、PII、storageKey、signed URL、媒体和完整错误正文。
16. 完成 unit/contract tests、debug build 与 local backend smoke；至少记录一个脱敏 response requestId。

## 迁移边界

第一阶段允许保留旧页面及 adapter 以便后续逐模块迁移，但新 foundation 不能默默调用它们。禁止大范围页面改造或将旧 DTO 包装成新合同成功。

## 交付结构建议

可按现有工程风格放入 `core/network/v1`、`core/auth`、`core/config`、`core/generated`、`core/testing`；最终命名以当前结构审计为准，不建立第二套全局状态容器。
