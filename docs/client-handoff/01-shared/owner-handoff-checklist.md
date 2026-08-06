# 项目负责人交接检查清单

## 分发前

- [ ] source branch/commit 与 `SOURCE-COMMIT.txt` 一致。
- [ ] OpenAPI SHA-256 为 `1171cb76a485911ef44f5df9fc65f99ad5cbb9f7ab9d6a4e0d479c06eb4dad8c`，operation 数为 92。
- [ ] Manifest 和 checksums 已自动复核；ZIP 解压结构完整且无 Secret/源码目录。
- [ ] 明确告知团队：staging runtime、客户端联调、三端完成、Export、Production 均未完成。

## 人员与工作区

- [ ] Android、iOS、Web owner 与审查人已填写。
- [ ] 每人有独立 clone/worktree；没有共享目录切分支。
- [ ] 分支从统一 baseline 创建；无 nested Git/gitlink。
- [ ] Android/Web 工程权限已提供。
- [ ] iOS 真实工程或导入说明已提供；当前缺失时保持 `IOS_PROJECT_IMPORT_REQUIRED=YES`。

## 每端启动 Gate

- [ ] 开发者已核验 OpenAPI 哈希并阅读共同合同。
- [ ] 任务范围仅为本端 foundation；backend/OpenAPI/Migration/其他端只读。
- [ ] local backend、合成账号和清理规则可用。
- [ ] Mock 隔离、production fail-closed 和日志脱敏验收责任已分配。

## 交付审查

- [ ] branch、完整 commit、files、tests、local smoke、requestId、blockers、clean status 齐全。
- [ ] Idempotency-Key 与版本冲突有负面测试。
- [ ] Export 503 无本地假成功。
- [ ] 本端 local Gate 只有在证据完整后才改为 YES。
- [ ] 未擅自改变 `STAGING_RUNTIME_READINESS=NO`、`THREE_CLIENT_DEFINITION_OF_DONE=NO`、`FULL_PRODUCTION_GATE=NO`。
