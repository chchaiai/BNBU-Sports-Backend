# BNBU Sports 客户端后端接入入口

当前 Android 与 Web 客户端只绑定一份权威合同：

```text
docs/backend-contracts/openapi.yaml
→ Contract 1.5.0 / SHA-256 f0b4916...
→ Android build-time Kotlin models
→ Web tracked TypeScript models
→ handwritten transport/auth/UI adapters
```

## 当前 Contract 基线

| 项目 | 值 |
| --- | --- |
| Version | `1.5.0-contract` |
| SHA-256 | `f0b4916cb0abd1ec4057f690763de8d7e6f79ca2b7e666a8cd6f3d8c37c69bed` |
| Surface | 106 paths / 123 operations / 279 schemas |
| Runtime | 106 enabled / 17 intentionally disabled / 0 not implemented |
| Machine baseline | `client-contract-baseline.json` |
| Current handoff | `CONTRACT-1.5.0-HANDOFF.md` |

本次只关闭本地 Contract 1.5 客户端基线，不表示 Private Staging 已运行、客户端联调已开始、iOS 已导入、Export 已实现或 Production 已上线。

## 开发前按顺序阅读

1. `CONTRACT-1.5.0-HANDOFF.md`
2. `client-contract-baseline.json`
3. `01-shared/authoritative-files.md`
4. 对应端目录中的 `README.md`
5. `05-manager/gate-status.md`
6. `../backend-contracts/PRIVATE-PRE-STAGING-EXECUTION-PLAN.md`

**未核验 OpenAPI SHA-256，不得开始接口开发。** 当前哈希：

```text
f0b4916cb0abd1ec4057f690763de8d7e6f79ca2b7e666a8cd6f3d8c37c69bed
```

## 当前端侧事实

- Android 已建立 Contract 1.5 快照、Kotlin model generation、三环境 BuildConfig 与 `/api/v1` transport；尚未通过 Private Staging 真机闭环。
- Web teacher/admin 已生成 Contract 1.5 TypeScript 类型并具备统一 API client；localStorage token、Mock 和 Staging cookie/CORS/CSRF 仍待收口。
- 当前仓库没有 iOS 工程。iOS 任务包可用于派工，但必须先导入并审计真实工程，禁止凭空创建工程或假 Swift 文件。

## 负责人入口

派工、分支分配、交付审查和 Gate 状态位于 `05-manager/`。`00-contract/`、旧 Stage 20B baseline 和 `handoff/client-backend-integration-v1/` 只保留历史证据，不是当前生成输入。所有问题只附脱敏信息和 requestId。
