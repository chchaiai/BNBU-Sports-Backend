# iOS Foundation 验收清单

## 工程 Gate

- [ ] 真实 `.xcodeproj`/`.xcworkspace` 路径已记录并可构建。
- [ ] 工程 Git 根、baseline 和 clean status 已核验；没有自动创建空工程。
- [ ] 已审计现有网络层、依赖、xcconfig、Keychain、fixture/preview 和测试结构。

## 合同与基础设施

- [ ] OpenAPI SHA-256 不匹配时生成/构建失败。
- [ ] Swift generated models 可重复生成，无手工字段修改。
- [ ] local/staging/production xcconfig 分离；production 缺获批 HTTPS URL 时失败。
- [ ] 使用一个既有/统一 transport；typed envelope/error 和最终 requestId 测试通过。

## Auth 与安全

- [ ] Access/Refresh 分离并只保存在 Keychain；logout 清理完整。
- [ ] 并发 401 单次 refresh、rotation/reuse、App restart 恢复有测试。
- [ ] 日志不含 Token、Cookie、密码、PII、storageKey、signed URL 或完整 body。

## 协议与领域

- [ ] Idempotency-Key 用户意图复用、version conflict、expectedReviewVersion 和 opaque cursor 测试通过。
- [ ] Media URL 不持久化；public DTO 无 storageKey。
- [ ] Session/时长由服务端裁决；正式 Score 不在客户端计算。
- [ ] Preview/fixture/stub 与 real session/storage 隔离，production 不可达。
- [ ] Export 503 无假文件/空成功。

## 证据

- [ ] 单元/合同测试和工程 build 通过。
- [ ] Simulator local Docker smoke 通过；若真机未执行则明确记录。
- [ ] 只改 iOS 允许路径；root status clean；本地 commit 已生成，未 push/PR。
