# Web Foundation 验收清单

## 合同与环境

- [ ] OpenAPI hash 不匹配时生成/build 失败；TypeScript types 可重复生成且无手改。
- [ ] env schema 区分 local/staging/production；无 Secret 暴露给 client bundle。
- [ ] production 缺获批 HTTPS `/api/v1` URL 时 fail closed；无旧 endpoint/fallback。

## Transport 与 Auth

- [ ] 单一 transport 处理 typed success/error、最终 requestId、abort/timeout 和安全重试。
- [ ] 正式路径不存在任意非空登录、localStorage admin 角色 session 或 ChatGPT header 替代 BNBU Auth。
- [ ] password-login/refresh/logout/me adapter 有测试；access token 仅内存。
- [ ] refresh cookie/CORS/CSRF 明确标记 `ACCEPTED_WITH_STAGING_VALIDATION`，未宣称 production 已验收。
- [ ] 日志/前端 telemetry 无 Token、Cookie、密码、PII、storageKey、signed URL 和完整 body。

## 协议与 Mock

- [ ] ErrorCode 分支、未知错误 + requestId、安全失败测试通过。
- [ ] opaque cursor 不解析、不跨查询复用。
- [ ] Idempotency-Key 用户意图复用；expectedVersion/expectedReviewVersion 冲突刷新确认。
- [ ] Mock/real auth/session/storage 隔离；production build 证明 Mock data/service 不可达。
- [ ] 网络失败/404/503 不切 Mock。

## 领域边界与证据

- [ ] local smoke 只选 foundation vertical slice，没有一次性接完所有页面。
- [ ] 本地 roster CSV/export 与 Mock audit 不出现在正式路径。
- [ ] Export 503 无假文件、任务、URL 或空成功。
- [ ] Web 不产生学生 Session/Media/Record 事实，ADMIN 不代 Review，客户端不计算正式 Score。
- [ ] typecheck/lint/test/build 与 local Docker smoke 通过。
- [ ] 只改 Web 允许路径；root status clean；本地 commit 已生成，未 push/PR。
