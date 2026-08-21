# BNBU Sports Monorepo

本目录是 BNBU Sports 唯一 Git 仓库根目录。自 2026-08-04 起，后端、Android 与 Web 均由父仓库统一管理：

| 目录                          | 职责                  | Git 形态 |
| ----------------------------- | --------------------- | -------- |
| `backend/`                    | Greenfield 权威后端   | 普通目录 |
| `BNBU-Sports-Android-master/` | Android 客户端        | 普通目录 |
| `BNBU-Sports-Web-new/`        | Web 教师/管理员客户端 | 普通目录 |

## 当前 Backend 发布基线

- 版本：`2.0.12-contract`
- OpenAPI SHA-256：`916461bed7c2fd14f28f0d750b7f414fd12f31db1ade09dc52777208fc3790d6`
- 来源 monorepo commit：`ea31a2ebc005ce13a0fc6a02071ba613eb0f53db`
- Backend Release：<https://github.com/chchaiai/BNBU-Sports-Backend/releases/tag/2.0.12-contract>

该 PATCH 发布新增仅限 Staging 的 R01 provisioner：只创建或验证 `ADMIN-01`、`TEACHER-01` 和不可登录的内部审批身份，并要求三个预留 Student 学号在人工扫码前不存在；Student 必须通过真实 QR join 自动创建身份、Enrollment 与 AuthSession，再绑定受控邮箱并完成 OTP。它不改变客户端可见 API surface，也不新增或修改现有 20 条 Migration。发布完成只表示代码、合同和 Release 资产已经冻结，不表示 2.0.12 已部署到 Staging、R01 人工测试已通过，更不表示 Production Gate 已开放。

不得在客户端目录中重新执行 `git init`、单独创建分支、提交、push 或 Pull Request，也不得重新添加 submodule。所有 Git 操作从本目录执行；需要限定范围时使用路径暂存：

```powershell
git add BNBU-Sports-Android-master
git commit -m "feat(android): ..."

git add BNBU-Sports-Web-new
git commit -m "feat(web): ..."

git add backend
git commit -m "feat(backend): ..."
```

检查仓库拓扑：

```powershell
npm --prefix backend run repo-layout:check
npm --prefix backend run client-contract-baseline:check
```

第二条命令会确认 Android/Web vendored OpenAPI、版本、SHA-256、operation count 和生成模型输入与根权威合同一致；它不表示 Staging 或客户端联调已完成。

## 本地安装与合同检查

全新 Clone 后，从 monorepo 根目录使用唯一安装入口。该命令按各自 lockfile 安装 Backend、合同工具和 Web 依赖；不得只安装 `backend/` 后假设兄弟目录工具已经可用：

```powershell
npm run bootstrap
npm run contract:check
```

`npm run bootstrap:check` 只校验三个受管 package 的 manifest/lockfile 是否齐全，不安装依赖。本地 Docker 跨端联调的完整步骤见 [`tools/local-integration/README.md`](tools/local-integration/README.md)。

本地服务与 seed 就绪后，运行 `npm run local:closure` 可验证合成媒体、打卡、教师审核、成绩发布与学生回读使用同一个 `recordId`；脚本仅允许本机测试环境，且不输出凭据或签名 URL。

原 Android/Web 仓库继续保留历史和旧 Pull Request，但不再作为日常开发入口。Snapshot 转换及离线恢复证据见 `docs/repository/monorepo-conversion-report.md`。
