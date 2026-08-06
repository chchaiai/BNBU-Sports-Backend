# 三端共享后端接入底座规范

## 1. 合同与生成

- 所有 endpoint 相对于 `/api/v1`；禁止旧 `/api`、旧远程 IP 或失败后 fallback。
- 三端从同一 `openapi.snapshot.yaml` 生成 DTO/schema，绑定 SHA-256 `1171cb76...dad8c`。
- 只生成模型/类型和必要 schema；transport、Auth、secure storage、retry、UI mapping 手写并测试。
- required enum 未知时 fail closed；UI 文案通过本地 i18n 映射。

## 2. 环境

`local`、`staging`、`production` 必须显式分离。local 只使用合成数据；staging URL 仍待基础设施选择；production 未批准。production 缺 URL 必须 fail build/start，且 Mock adapter、seed、旧 API 均不可达。任何网络错误、404、503 或未知错误都不得自动切换 Mock。

## 3. Authentication 与 Token

- TEACHER/ADMIN 使用 `passwordLogin`；STUDENT 的权威身份入口是一次性 QR Join，不发明学生密码登录。
- Access Token 只放 `Authorization: Bearer`；Refresh Token 只发送 refresh endpoint。
- refresh 原子轮换；旧 token reuse 会撤销同一 family。401 只允许受控单次 refresh，并防止并发 refresh 风暴。
- logout 必须先调用服务端撤销，再清理本地凭证；失败时按产品策略安全退出并记录脱敏 requestId，不保留可继续刷新的假会话。
- Android 使用 Keystore-backed encrypted storage，iOS 使用 Keychain。Web 目标为 Secure HttpOnly SameSite refresh cookie + memory access token；cookie/CORS/CSRF 标记 `ACCEPTED_WITH_STAGING_VALIDATION`。

## 4. Envelope、requestId 与错误

- 成功只接受 `data` 与可选 `meta`。
- 非 2xx 解析 `code/message/details/requestId/timestamp`；业务只按 `code` 分支，message 仅 fallback。
- 客户端可发送安全的 `X-Request-ID`，但必须记录服务端最终响应 requestId。
- 未知 code 按 HTTP 类安全失败并向用户展示 requestId；禁止日志化完整错误正文。

## 5. 幂等与并发

- OpenAPI 要求的 mutation 必须发送 `Idempotency-Key`。一个用户意图生成一次；重复点击、网络超时和明确重放复用同一 key。输入变化或用户明确重新发起才换 key。
- 不自动无限重试 mutation。GET/HEAD 的有界重试也必须避免跨账号缓存和敏感日志。
- mutation 使用最新 projection 的 `expectedVersion`；Review 还使用 `expectedReviewVersion`。冲突时刷新、展示变化并要求重新确认，禁止盲重放旧请求。

## 6. Cursor

cursor 不透明且绑定主体、角色、组织、filter、sort、limit。客户端只原样回传；不解析、不跨账号持久化、改变查询条件后不复用。

## 7. Media

严格执行 `initiate → private PUT → confirm → bind → processing → AVAILABLE`。稳定身份是 `mediaId`；signed URL 短期使用且不持久化，`storageKey` 永不进入公共 DTO、缓存或日志。禁止旧 multipart `/upload/proof` 进入 production 路径。

## 8. Session、Record、Review、Score

- Session：服务端 active Session 是唯一权威；App restart 先恢复服务端状态。本地计时只服务 UI；无可信证据的离线时长 fail closed；上限 7200 秒。
- Record：只从 COMPLETED Session 创建；DRAFT 可编辑/丢弃，submit 冻结媒体并产生初始 PENDING Review。信用时长只用服务端整数秒。
- Review：责任 TEACHER append-only 追加 VALID/INVALID，reopen 追加 PENDING；学生 projection 永不出现 `internalNote`。
- Score：客户端不计算正式分。Decimal 用字符串或 decimal-safe 类型；学生只显示已批准的 published projection。

## 9. Export 与 Mock

`listExports/createExport/getExport/createExportDownloadUrl` 均为真实 default-deny，当前返回 `SYSTEM_MODE_UNSUPPORTED`。不得伪造本地文件、任务、URL、成功或空列表。

领域 Mock 只允许 automated test 或显式 development-only 入口；Mock 与 real session/token/storage namespace 必须隔离。production bundle/build 必须有可验证的不可达测试。

## 10. 日志脱敏

禁止记录 Token、Authorization、Cookie、密码、完整学号/邮箱/手机号、storageKey、signed URL、媒体正文和完整 error body。问题反馈只保留环境、operationId、客户端版本、HTTP status、ErrorCode、requestId 和脱敏复现步骤。
