# 权威文件与阅读责任

冲突优先级：`ACCEPTED` ADR/业务决策 → 统一业务规则 → OpenAPI → 后端实现 → 客户端实现 → Mock/展示文档。

| 文件 | 用途 | 谁必须看 | 是否权威 | 是否允许修改 |
| --- | --- | --- | --- | --- |
| `00-contract/openapi.snapshot.yaml` | 离线机器合同快照 | Android/iOS/Web | 对本分发版本是不可变证据；长期权威仍在仓库 | 否 |
| `00-contract/openapi.sha256.txt` | 来源 commit、哈希与 operation 数 | 所有人 | 完整性证据 | 否 |
| `00-contract/client-contract-baseline.json` | 环境、生成策略和 Gate 基线 | 所有人 | 已批准基线快照 | 否 |
| `00-contract/client-integration-contract-pack.md` | Auth、错误、Media、Session、Review、Score 等共同规则 | 开发、审查、测试 | 已接受业务合同快照 | 否 |
| `00-contract/client-integration-approval.md` | INT-DEC-01–12 批准证据 | 负责人、审查人 | 已接受决策快照 | 否 |
| `00-contract/client-contract-gap-inventory.md` | Android/Web/iOS 当前差距 | 对应端开发、审查人 | 只读审计证据 | 否；状态变化另开新版本 |
| `00-contract/runtime-coverage-summary.json` | 当前 92-operation 运行覆盖摘要 | 所有人 | 由 manifest 生成的快照 | 否 |
| `01-shared/shared-backend-integration-foundation.md` | 三端统一 transport/状态约束 | 三端开发 | 本次交接规范 | 仅仓库源文档经审查修改 |
| `01-shared/local-backend-development.md` | 本地 Docker 与设备访问 | 三端开发、测试 | 从真实 runbook 摘取 | 仅仓库源文档经审查修改 |
| 各端任务书/验收清单/Codex prompt | 端侧执行范围 | 对应端开发、审查人 | 派工边界 | 交付包内不修改 |

仓库内长期来源为 `docs/backend-contracts/openapi.yaml`、`backend/runtime-coverage.manifest.json` 和 `docs/client-handoff/`。分发包不得反向覆盖这些来源。
