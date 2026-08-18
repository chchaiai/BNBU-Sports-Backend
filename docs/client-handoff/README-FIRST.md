# BNBU Sports 客户端后端接入入口

当前客户端生成和适配只允许绑定以下唯一合同；不得从 Backend `main` 的未发布字节自动生成：

| 项目 | 值 |
| --- | --- |
| Version | `2.0.4-contract` |
| Release state | `published` |
| SHA-256 | `fb58079a167a1ac6208618bc1b2ac106f618a53be5418936992c1ddf36e85b47` |
| Surface | 109 paths / 126 operations / 288 schemas |
| Runtime | 109 enabled / 17 intentionally disabled / 0 not implemented |
| Source monorepo commit | `a3f6cf4587028153a84f531aa2e5cbfd3eb415ce` |
| Machine baseline | `client-contract-baseline.json` |
| Current handoff | `CONTRACT-2.0.4-HANDOFF.md` |

开发前依次核验 `CONTRACT-2.0.4-HANDOFF.md`、`client-contract-baseline.json`、权威 OpenAPI 字节和 SHA-256。Android 与 Web 快照必须与权威 OpenAPI byte-identical；iOS 仓库位于 monorepo 之外，必须从正式 Release 资产导入并在自身仓库记录相同版本和 hash。

本地合同、客户端绑定或 Backend Release 均不表示 Staging 已部署、外部邮箱/COS 已验收、APNs 已启用或 Production Gate 已打开。
