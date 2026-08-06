# OpenAPI 1.2.0 合同发布说明（iOS 平台枚举）

日期：2026-08-06
状态：本地合同候选；未部署

## 结论

`1.2.0-contract` 是相对已保存 `1.1.0-contract` 快照的结构性增量升级。自动兼容性检查没有发现 path、HTTP method、component schema、递归 schema property、required member 或 enum value 被删除。

两版均包含 122 个 operation 和 271 个 component schema。当前变更只在以下五个合同位置增加 `IOS` 枚举值：

1. `PushDeviceRegistrationRequest.platform`
2. `PushDevice.platform`
3. `GET /app-release-policy` 的 query 参数 `platform`
4. `AppReleasePolicy.platform`
5. `CreateFeedbackRequest.clientContext.platform`

iOS 客户端可以据此生成并发送真实的 `IOS` 平台值，不应伪装成 `ANDROID`。合同增加枚举值本身不代表对应 endpoint 已经开放，也不代表推送、版本策略或反馈已完成真实环境验收。

## 可复核证据

| 项目               | `1.1.0-contract` 基线                                              | `1.2.0-contract` 当前合同                                          |
| ------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| OpenAPI SHA-256    | `fb040b671e3f25c48279ad6b173ced5f633de1b1a1a9db0cc0f23a11e3fde4d1` | `f194eb01c6386882220c72c5256c1ef60d09a4bf624a65d23b03ed6dd233cb4c` |
| operation          | 122                                                                | 122                                                                |
| component schema   | 271                                                                | 271                                                                |
| 删除的受检合同表面 | 不适用                                                             | 0                                                                  |
| 新增 enum value    | 不适用                                                             | 5 个 `IOS`                                                         |

基线快照：

`docs/client-handoff/contract-history/1.1.0-contract-fb040b671e3f25c48279ad6b173ced5f633de1b1a1a9db0cc0f23a11e3fde4d1/openapi.snapshot.yaml`

生成的检查结果：

- `docs/client-handoff/openapi-1.1.0-to-1.2.0-compatibility.json`
- `docs/client-handoff/openapi-1.1.0-to-1.2.0-compatibility.md`

复核命令：

```powershell
node tools\backend-contracts\check-openapi-compatibility.mjs --check
```

若 `docs/backend-contracts/openapi.yaml` 后续继续变化，必须先重新运行不带 `--check` 的命令生成报告，再以 `--check` 复核；届时当前合同 SHA-256 也会随之变化。

## 本说明不构成的证据

本发布说明和兼容性报告只证明当前工作区内两份 OpenAPI 文件在指定结构表面上的差异。它们不构成以下任何证据：

- 后端已部署到 Staging 或 Production；
- 存在可访问的 HTTPS Staging `/api/v1`；
- 新增 operation 已从 `503 SYSTEM_MODE_UNSUPPORTED` 切换为可用；
- 数据库 Migration、对象存储、推送供应商或 GPS 留存任务已在真实环境完成验证；
- iOS App 已完成真实 API 联调、真机验证、编译、单元测试或可发布 binary 验收。

因此，iOS 团队可以把 `1.2.0-contract` 作为平台枚举修复后的代码生成输入，但仍需以后端运行覆盖状态、Staging 环境证据和 iOS 自身测试结果分别判断功能是否可用。
