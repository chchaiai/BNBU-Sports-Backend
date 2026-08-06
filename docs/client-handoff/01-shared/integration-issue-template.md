# 客户端合同/联调问题模板

## 基本信息

- 标题：`[端][环境][operationId] 简短现象`
- 客户端/OS/设备：
- 客户端 branch 与 commit：
- 环境：`local | staging`（当前不得填 production）
- OpenAPI SHA-256：
- operationId / method / path：
- 发生时间（RFC3339，含时区）：

## 可追踪证据

- HTTP status：
- ErrorCode：
- requestId：
- Idempotency-Key：`已使用/未要求`（禁止粘贴真实值）
- expectedVersion / expectedReviewVersion：仅填数字，不附完整对象：

## 复现与判断

1. 复现步骤：
2. 预期：
3. 实际：
4. 是否可重复：
5. 是否阻塞当前 operation：
6. 对应快照位置/字段：

## 附件安全检查

- [ ] 已去除 Authorization、Token、Cookie、密码、Secret、signed URL、storageKey。
- [ ] 已遮蔽完整学号、邮箱、手机号和真实学生数据。
- [ ] 未上传媒体正文或完整 error body。
- [ ] 截图/日志只包含最小必要上下文。

## 负责人结论

- 分类：`CLIENT_BUG | CONTRACT_QUESTION | BACKEND_BUG | ENVIRONMENT | STAGING_VALIDATION`
- 是否需要合同变更：
- 指定 owner：
- 处理版本/commit：
- Gate 影响：
