# Stage 21 合同更新提示

日期：2026-08-06。

`client-backend-integration-v1` 是绑定旧 OpenAPI `1.0.0-contract`、92 operations 和 SHA-256 `1171cb76a485911ef44f5df9fc65f99ad5cbb9f7ab9d6a4e0d479c06eb4dad8c` 的不可变历史包。它不包含本阶段新增的客户端能力和 GPS operation，不能继续作为这些功能的生成输入。

当前仓库权威合同已更新为 OpenAPI `1.2.0-contract`、122 operations、271 schemas；当前工作树 SHA-256 为 `f194eb01c6386882220c72c5256c1ef60d09a4bf624a65d23b03ed6dd233cb4c`。相对保存的 `1.1.0-contract` 快照是增量兼容升级，新增 `IOS` 平台枚举；正式生成必须绑定最终 clean commit/hash。客户端到后端的对应关系见 `docs/backend-contracts/21-client-capabilities-operation-map.md`。

Stage 21 新增 30 项中，12 项已进入仅本地集成，18 项仍 default deny。12 项已通过隔离的本地 Docker Synthetic Staging HTTP smoke、数据库 RBAC 和 restart/persistence 验证；`IOS` 枚举可用于推送设备、App 版本政策与反馈上下文。但这不表示具名 Staging HTTPS 已部署，也不表示 APNs 投递、iOS 二进制真实 API 闭环或 Production Gate 已完成。边界见 `docs/backend-contracts/21-client-capabilities-local-integration-report.md`。

新的不可变客户端交接包必须在本阶段代码提交形成 clean HEAD 后再生成，并记录该最终 commit、OpenAPI 哈希和包校验和。本任务没有覆盖或伪装旧 v1 包，也没有在 dirty worktree 上生成不可验证的 v2 包。
