# Android Foundation 验收清单

## 合同与构建

- [ ] OpenAPI SHA-256 校验失败时生成/构建立即失败。
- [ ] Kotlin generated model 可重复生成且无手改 diff。
- [ ] local/staging/production 配置分离；release 缺获批 HTTPS `/api/v1` URL 时失败。
- [ ] 新 foundation 无旧 IP、旧 `/api` 或未知服务 fallback。

## Transport 与 Auth

- [ ] 所有请求经过单一 OkHttp transport；成功/错误 envelope typed parsing 通过。
- [ ] 服务端最终 requestId 可安全显示/上报。
- [ ] Access/Refresh 分离并由 Keystore-backed storage 加密；无明文 fallback。
- [ ] refresh rotation、并发 401 单次刷新、reuse 撤销和 logout 清理有测试。
- [ ] production 日志不含 Authorization、Token、PII、storageKey、signed URL 或完整 body。

## 幂等、版本与分页

- [ ] 同一用户意图的重试复用同一 Idempotency-Key；输入变化生成新 key。
- [ ] mutation 不自动无限重试。
- [ ] expectedVersion/expectedReviewVersion 冲突产生刷新并重新确认状态。
- [ ] cursor 原样回传且不跨账号/filter 复用。

## 领域边界

- [ ] Media foundation 使用 mediaId 状态机；production 不能到达旧 multipart `/upload/proof`。
- [ ] Session 以服务端 active 状态为权威；本地 snapshot 不增加时长。
- [ ] 学生 Review projection 无 internalNote；Media projection 无 storageKey。
- [ ] 正式 Score 不由客户端计算。
- [ ] Export 503 展示“尚未开放”及 requestId，无假文件/空成功。
- [ ] production 构建证明 Mock/seed/local truth 不可达。

## 证据

- [ ] 单元/合同测试通过。
- [ ] `assembleDebug` 或工程实际 debug build 通过。
- [ ] local Docker health/readiness 与至少一条 Auth/合同 smoke 通过。
- [ ] 只改 Android 允许路径；root Git status clean；本地 commit 已生成，未 push/PR。
