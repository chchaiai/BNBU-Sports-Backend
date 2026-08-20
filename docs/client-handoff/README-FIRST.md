# BNBU Sports 客户端后端接入入口

当前客户端生成和适配只允许绑定以下唯一合同；不得从 Backend `main` 的未发布字节自动生成：

| 项目 | 值 |
| --- | --- |
| Version | `2.0.11-contract` |
| Release state | `published` |
| SHA-256 | `c3bdba5999404ea5c58b48407f582ed7b6f19fe955b793f5dfba78303ae9edb1` |
| Surface | 109 paths / 126 operations / 288 schemas |
| Runtime | 109 enabled / 17 intentionally disabled / 0 not implemented |
| Source monorepo commit | `026d3d1d1c959e33f7450bd2ec123622c83bc9fe` |
| Machine baseline | `client-contract-baseline.json` |
| Current handoff | `CONTRACT-2.0.11-HANDOFF.md` |

开发前依次核验 `CONTRACT-2.0.11-HANDOFF.md`、`client-contract-baseline.json`、权威 OpenAPI 字节和 SHA-256。Android 与 Web 快照必须与权威 OpenAPI byte-identical；它们已绑定到正式 Release，但公开分发前仍须验证 GitHub Release 资产。当前没有已确认的权威 iOS 工程；导入真实工程后必须从正式 Release 资产导入相同字节，并在 iOS CI 固定相同 version/hash。

`client-contract-baseline.json` 中的 `stagingRuntimeReadiness`、`clientIntegrationStarted` 与 `threeClientDefinitionOfDone` 是该合同正式 Release生成时的冻结元数据，不是对当前公网 Staging 的实时探测结果。实时部署状态必须以 `docs/deployment/STAGING-DEPLOYMENT-PLAN.md` 和当次验收证据为准。

本地合同、客户端绑定或 Backend Release 均不表示 Staging 已部署、外部邮箱/COS 已验收、FCM/APNs 已启用或 Production Gate 已打开。
