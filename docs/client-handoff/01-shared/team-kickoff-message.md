# 可直接发群的启动消息

各位同学，BNBU Sports 三端客户端后端接入 v1 交接包已准备好。当前只做 Android/iOS/Web 的后端接入底座和本地 Docker 合同验证，不代表 staging 已运行，也不要求一次性接完全部业务页面。

请先阅读 `README-FIRST.md`，然后核验 `00-contract/openapi.snapshot.yaml` 的 SHA-256 必须为：

`1171cb76a485911ef44f5df9fc65f99ad5cbb9f7ab9d6a4e0d479c06eb4dad8c`

未核验哈希不要开始接口开发。所有人使用独立 clone/worktree，从唯一 monorepo 根目录操作；只修改自己负责的客户端，不改 backend、OpenAPI、Migration 或其他端。完成后提交 branch、完整 commit、变更文件、测试、local smoke、脱敏 requestId、blocker 和 clean status。不要 push，不要创建 PR。

iOS 当前仓库没有真实工程，请 iOS 同学先向负责人取得真实工程路径并完成 Git/结构审计；不要创建空工程。合同问题统一用 `01-shared/integration-issue-template.md` 反馈。
