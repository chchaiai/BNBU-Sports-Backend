# 客户端 Foundation 交付审查

## 提交信息

- 端：
- 开发者/审查人：
- branch：
- baseline commit：
- delivery commit（完整 hash）：
- 变更文件：
- OpenAPI SHA-256：
- root `git status`：

## 验证证据

| 项目 | 命令/步骤 | 结果 | 证据位置 |
| --- | --- | --- | --- |
| hash binding |  |  |  |
| generated models/types |  |  |  |
| unit/contract |  |  |  |
| typecheck/lint/build |  |  |  |
| local health/readiness |  |  |  |
| Auth/refresh/logout |  |  |  |
| Idempotency-Key replay |  |  |  |
| version conflict |  |  |  |
| Mock production unreachable |  |  |  |
| Export 503 |  |  |  |
| log redaction |  |  |  |

## 可追踪样例

- operationId：
- HTTP status / ErrorCode：
- requestId（脱敏）：
- local smoke 说明：
- blocker/未验收项：

## 审查结论

- [ ] 只修改允许路径。
- [ ] 未修改 backend/OpenAPI/Migration/其他端。
- [ ] 未声称 staging/跨端/Export/Production 完成。
- [ ] 工作树 clean，提交可追溯，未 push/PR。
- Gate：`APPROVE_LOCAL_FOUNDATION / CHANGES_REQUIRED / BLOCKED`
- 备注：
