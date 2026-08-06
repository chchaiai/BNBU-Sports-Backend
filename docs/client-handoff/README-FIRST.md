# BNBU Sports 三端客户端后端接入交接包

本包用于 Android 学生端、iOS 学生端、Web 教师端和管理端的第一阶段后端接入。三端连接同一个权威后端：

```text
一份 OpenAPI
→ 三端从同一快照生成数据模型
→ 三端各自实现网络与认证适配层
→ 三端各自保留现有 UI 和业务职责
```

## 当前阶段

本阶段只配置后端接入底座并完成本地 Docker 合同验证，范围包括 DTO、环境配置、统一 transport、Auth、Token、错误 envelope、requestId、Idempotency-Key、乐观并发版本、opaque cursor、Mock 隔离、local smoke 和日志脱敏。

本包不表示 staging 已运行、腾讯云已配置、客户端联调已完成、三端已完成、Export 已实现或 Production 已上线。四个 Export operation 当前均稳定返回 `SYSTEM_MODE_UNSUPPORTED`。

## 开发前按顺序阅读

1. `00-contract/CONTRACT-READ-ME.md`
2. `00-contract/openapi.snapshot.yaml`
3. `00-contract/client-contract-baseline.json`
4. `00-contract/client-integration-contract-pack.md`
5. `01-shared/git-collaboration-rules.md`
6. 对应端目录中的 `README.md`
7. 对应端目录中的 `*-CODEX-PROMPT.md`

**未核验 OpenAPI SHA-256，不得开始接口开发。** 本版哈希：

```text
1171cb76a485911ef44f5df9fc65f99ad5cbb9f7ab9d6a4e0d479c06eb4dad8c
```

## 当前端侧事实

- Android 工程存在，但仍使用旧路径、手写 DTO、单 bearer token 和旧 multipart 证据上传；第一阶段只建立新 foundation，不一次性改完所有业务页面。
- Web 工程存在，但正式后端 transport 尚未建立，认证和主要业务数据仍是前端 Mock；第一阶段只建立 foundation，不一次性接完所有 Mock 页面。
- 当前仓库没有 iOS 工程。iOS 任务包可用于派工，但必须先导入并审计真实工程，禁止凭空创建工程或假 Swift 文件。

## 负责人入口

派工、分支分配、交付审查和 Gate 状态位于 `05-manager/`。所有问题统一使用 `01-shared/integration-issue-template.md`，只附脱敏信息和 requestId。
