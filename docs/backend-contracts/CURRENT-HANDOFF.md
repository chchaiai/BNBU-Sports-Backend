# BNBU Sports Greenfield Backend — Current Handoff

生成日期：2026-08-05。用途：不依赖旧账号、对话或 Memory 的本地接续。根目录为 `C:\Users\23328\Desktop\new_version`；权威后端为 `backend/`；唯一人工维护 API 机器合同为 `docs/backend-contracts/openapi.yaml`。

## Stage 20A 客户端联调批准与 staging 准备（最新，取代下方待批准判断）

项目负责人 `PROJECT_OWNER` 于 2026-08-05 明确批准 INT-DEC-01–12 的全部推荐方案，并授权进入 Android/Web 客户端联调前置合同落盘与 synthetic staging 准备。批准证据见 `20-client-integration-approval-template.md`；OpenAPI-bound 机器基线见 `20b-client-contract-baseline.json`；环境停止 Gate 与验收清单见 `20b-synthetic-staging-readiness-plan.md`。

- Client Integration Approval Gate：YES
- Client Integration Preparation Readiness：YES
- 顺序：Auth → Teaching / Enrollment → Session / Media / Record → Review → Score；每模块先 Android 学生事实端，再 Web 教师/管理员端
- Client 策略：generated DTO/schema + handwritten transport；当前 OpenAPI SHA-256 为 `1171cb76a485911ef44f5df9fc65f99ad5cbb9f7ab9d6a4e0d479c06eb4dad8c`
- synthetic staging 建设授权：YES；Staging Runtime Readiness：NO
- Client Integration Execution Readiness / Started：NO / NO
- iOS：无工程；Three-client Definition of Done：NO
- Export Approval / Implementation：NO / NO；四个 Export operation 继续 `SYSTEM_MODE_UNSUPPORTED`
- Production Approval / Full Production：NO / NO；PROD-DEC-01–14 与 ADR-070–074 未因本批准改变
- Migration：仍只有 0001–0010；禁止创建 `0011_export_core`
- 本批准落盘阶段未修改 Android/Web、后端业务源码、Prisma、OpenAPI 或 Migration，也未部署 staging

当前阻塞是真实基础设施选择和运行证据：具名 staging 部署目标/域名、HTTPS、独立 PostgreSQL/private object storage/Secret 托管与可观测性仍待后续批准。完成选择并通过 `20b-synthetic-staging-readiness-plan.md` 的 runtime Gate 前，不得开始真实客户端联调或声称 staging ready。

## Stage 20A 最新权威状态（取代下文旧阶段建议）

当前分支为 `docs/export-production-integration-decisions`，输入 Stage 19 HEAD 为 `c3e6cc607e218ed70b11411106da34b74eefcfed`；最终 Stage 20A HEAD 以 `git rev-parse HEAD` 为准，且输入 HEAD 必须是其祖先。

Stage 20A 是 docs-only 决策准备：已建立 12 项 Export、14 项 Production 和 12 项 Client Integration 决策，21 行客户端合同差异、统一联调合同、三份审批模板与 Stage 20B Gate。本阶段没有收到用户对任何选项的正式批准，因此所有推荐仍为 `PROPOSED / USER_APPROVAL_REQUIRED`。

- Backend Operation Coverage Gate：YES
- runtime coverage：92 operations / 82 verified / 10 exact default-deny / 0 not implemented / 0 blocked
- Stage 19 基线复验：Unit 63、Integration 41、E2E 40、Contract 27、Security 38，总计 209/209；drift 0；audit 0；generator 零 diff
- Export：四个 operation 继续 `SYSTEM_MODE_UNSUPPORTED`；Export Business/Approval/Implementation Readiness 均为 NO
- Production：ADR-070–074 继续 PROPOSED；Staging/Production Approval 与 Full Production 均为 NO
- Client：只读盘点发现 Android 旧手写 API/Mock、Web local/sessionStorage Mock 且无统一 API client，仓库没有 iOS 工程；没有修改任何客户端源码
- Migration：仍只有 0001–0010；没有 0011，没有 Prisma 或 backend 业务源码变化

下一步不是直接实现，而是项目负责人审阅并填写 `20-export-approval-template.md`、`20-production-approval-template.md` 和 `20-client-integration-approval-template.md`。未完整批准前 `STAGE_20B_READINESS=NO`。

## Stage 19 最新权威状态（取代下文旧动态数字）

当前分支为 `backend/export-audit-governance`，业务输入 HEAD 为 `b526d299e98ca5f33abc8c79328f599fca113d6b`；最终交接 HEAD 以 `git rev-parse HEAD` 为准，并必须满足输入 HEAD 是其祖先。

- OpenAPI operations：92
- `IMPLEMENTED_VERIFIED`：82
- `IMPLEMENTED_DEFAULT_DENY`：10
- `NOT_IMPLEMENTED`：0
- `BLOCKED_BY_ADR`：0
- 测试：Unit 63、Integration 41、E2E 40、Contract 27、Security 38，总计 209/209，0 fail/skip/todo
- Migration：0001–0010；0010 checksum 为 `42aea4159d943b1c1c541ef8558c123d0e88d8e5aed06fd462aeabc1f98fe3df`
- Docker：runtime/migrator no-cache、PostgreSQL 18.4 first/repeat、drift 0、MinIO private、11-operation smoke、non-root、restart/persistence、production fail-fast、CORS、日志脱敏与 teardown 全部通过

Stage 19 verified 新增 `listStudents`、`getStudent`、`getTeacher`、`listAuditLogs`、`getAuditLog`。新增 default-deny 为 `updateCurrentUserProfile`、`updateStudent`、`listExports`、`createExport`、`getExport`、`createExportDownloadUrl`。Export 没有表、Job、snapshot、worker、artifact 或 URL；Export Business Gate 仍为“否”。Backend Operation Coverage Gate 为“是”；Client Integration、Historical Data Migration 和 Full Production Gate 均为“否”。完整证据见 `19-export-audit-governance-implementation-report.md`。

下一阶段仅为 Stage 20：Backend Operation Closure、Client Integration Contract Pack 与 Production Decision Closure。必须先读取 `AGENTS.md`、本文件、Stage 19 报告、decision log、OpenAPI 和 runtime manifest；不得自动修改 Android/Web，不得把 10 个 default-deny 改成假成功，不得自动批准 ADR-070–074，也不得声称 Export/Client/Production 已完成。

## Git 基线

- Review Core 业务基线：`cef929d64a90cf148e48a9d5fbc19e2885d6bc4d`
- Score 审批合同最终 HEAD：`4a276235351d1b2d6a1691f9a93cdcd55fc1aff0`
- 当前实现分支：`backend/score-core`
- 当前实现提交：`ed30653faabd4fe0cecee9a37303326bb551ba18`
- 最终交接 HEAD：执行 `git rev-parse HEAD` 获取；不要循环硬编码其自身提交
- Monorepo 转换输入 HEAD：`02e1cfb9cf2a9821ad04c25f3c65bbaf13b13fe3`
- Android snapshot 来源：原 gitlink `e4cd2e5a623261cd19cddbd59d5cda7627bf7e98`，实际导入 HEAD `6748f027ab723a4558a48d0f0bec8badeccf1920`
- Web snapshot 来源：原 gitlink `a602280b4aa46d3e944671d341a7bf12bacb17cb`，实际导入 HEAD `4ca0cf662372585565c980806e2e04721a6cc841`

Android、Web 和 backend 现在均为根仓库直接跟踪的普通目录；`.gitmodules`、客户端嵌套 `.git` 和 mode `160000` gitlink 已移除。完整子仓库历史保留在原远程仓库（如已配置）以及 `C:\Users\23328\Desktop\new_version-git-migration-backup` 的离线 bundle/元数据备份。日常开发只允许从根目录创建分支、commit、push 和 Pull Request。

## 当前技术与完成范围

Node.js 24 LTS（CI/镜像 24.18.0）、npm 11.8.0、TypeScript 5.9.3 strict、NestJS 11.1.28、Prisma 7.9.1、PostgreSQL 18.4、OpenAPI-first、ESM 模块化单体、PostgreSQL transaction/outbox、MinIO local private storage。

已实现：Foundation、Teaching Structure、Identity/Enrollment/QR Join、Official Roster、ExerciseSession、MediaEvidence、ExerciseRecord、ExerciseReview，以及 Stage 18 Score 的 Rule/双审批、Calculation、Revision、Contribution、Review-driven recalculation、Publication、Adjustment/审批和角色投影。Export、Client Integration、Historical Data Migration 与 Full Production 未实现/未批准。

## 运行覆盖与 operation

生成器实际结果：OpenAPI 92；`IMPLEMENTED_VERIFIED` 77；`IMPLEMENTED_DEFAULT_DENY` 4；`NOT_IMPLEMENTED` 11；`BLOCKED_BY_ADR` 0。

四个真实 operation-level default deny：

- `withdrawEnrollment`
- `ignoreRosterAlignmentResult`
- `withdrawExerciseRecord`
- `openStudentScoreCorrection`（`SCORE_CORRECTION_NOT_ALLOWED`，零业务副作用）

Stage 18 新增的 15 个 Score operation 为 Rule list/create/get/submit/approve/reject，StudentScore list/get/recalculate/publish/correction default deny，以及 Adjustment list/create/approve/reject。剩余 operation 必须从 OpenAPI 与 runtime manifest 自动盘点，不能按旧数字猜测。

## Migration

0001–0009 永久不可修改，只能新增 forward-only migration：

- 0001 `0573e3d13018e0db103ef4b605eb35278723174507b37379425a489b10e1462d`
- 0002 `bc62c8cc42989da02eb5be92c7c68f64a72b90e6a41b3913c169333d5fbfbc41`
- 0003 `032b2f001638de63495bdb8d9bd3979ab54679eaaa7802d7526c6e5e24aaa5b7`
- 0004 `bcfcde0c5cbb2a6bb0097f57b97f4d1f576dd90a4ff8e290a5c34f7605554b3a`
- 0005 `d26ea3da255e6522c893cae9f89d7d1229c4db2f6e43c4d25edfca811cac41f4`
- 0006 `81fb6be00696084be87248445941909e04dfb130aff448585d602caa4c73cf31`
- 0007 `d78b14c17acd1fa1f39760504525a2b1df3755472149b343da9709157bcf534f`
- 0008 `6e9e15d01fb41ec26cf6dedd2969f7471d69dc6595004eb477b5ec8d2c766eff`
- 0009 `1a4a21a6c4097cbeaaf1c8b8e7b3faef3db774f84296988f7edb9c288c06282d`

0009 新增九张 Score 表；隔离 PostgreSQL 18.4 空库 0001–0009首次部署成功、重复部署无 pending、schema drift 0。临时数据库已停止并删除。这不是 Docker 验收替代品。

## 最新测试证据

在 `ed30653faabd4fe0cecee9a37303326bb551ba18` 上重新执行：Unit 60/60、Integration 39/39、E2E 36/36、Contract 24/24、Security 35/35，总计 194/194；fail/cancelled/skip/todo 为 0。format、lint、typecheck、contract、runtime coverage、Prisma validate、migration safety、drift、generated check、build、audit high 与 `git diff --check` 均通过；audit 为 0 vulnerabilities，6 个既有 Redocly warning 保持可见。

## Score 冻结规则

- 唯一 V1 公式：72000 秒线性折算至 100.00，最终一步 Decimal HALF_UP 两位；71999 秒为 99.99，超额不加分。
- current VALID Review 才贡献；reopen/INVALID 产生新的 working revision，不改历史。
- published revision 不被后台计算静默覆盖；学生只见 published projection，责任教师显式 republish。
- Rule 激活需要两名不同 ACTIVE ADMIN，创建者不得自批。
- Adjustment 是最终分数层面的追加式申请/审批；证据不可使用外部 URL、scheme、绝对路径或路径穿越。
- archived correction 永久关闭并真实 default deny。

## Gate 与阻塞

审批、合同、Persistence、Rule/双审批、Calculation、Revision、Contribution、fingerprint、Review-driven recalculation、Projection、Publication、Published Preservation、Adjustment/审批等代码与测试 Gate 为“是”。Archived Correction、Historical Data Migration、Export、Client Integration、Full Production 为“否”。

**Score Core 总 Gate 为“是”**：Stage 18V 已在 Docker Desktop 4.85.0、Engine 29.6.2、Compose v5.3.1 上完成 runtime/migrator no-cache build、PostgreSQL 18.4/MinIO/App 全链、0001–0009 first/repeat、drift 0、完整 Score HTTP/worker/database Smoke、non-root、restart/persistence、production fail-fast、CORS、日志脱敏和精确 teardown。历史上“上一环境没有 Docker，因此 Gate 为否”的记录仍保留在 Stage 18 报告中，但不再是最新判定。

ADR-070–074 和此前未关闭的 Enrollment Withdrawal/Rejoin、Roster Ignore/Official API/Retention、Session Offline/Expiration/Production Parameters、Media Retention/Production Security/Privacy/Production Parameters 均保持原状态。完整状态以 `decision-log.md` 为准。

## 下一动作

Stage 19 readiness 为“是”，但 Stage 19 尚未执行。新任务必须从最终 clean Stage 18V HEAD 接续，先读取 AGENTS、本文件、Stage 18 报告、decision log、OpenAPI 与 runtime manifest，再自动盘点当前 11 个 `NOT_IMPLEMENTED` operation；分支名、Migration 和业务范围必须服从正式 Stage 19 指令。`NEXT-CODEX-PROMPT.md` 是接续提示词，不代表 Export、客户端联调或 Production 已完成。

Stage 18V 最新运行证据：runtime digest `sha256:e7f510787a10f62aaf4e008083e7924d72a070fbd92051d85080edbe0abbed28`（196,618,071 bytes，UID 10001）；migrator digest `sha256:8e3a244c0e9362e7831fdfd1f434f0775c79a82a73613032e0ca0ab089aa41d8`（215,949,569 bytes）；teardown 后验证 project 容器/网络/卷均为 0。最终交接提交以 `git rev-parse HEAD` 为准。

## 三端客户端后端接入可分发交接包（2026-08-05）

已从 clean 权威输入基线生成 `client-backend-integration-v1` 文档、合同和任务快照。本记录只表示交接材料可分发，不表示端侧改造、真实联调或运行环境已经完成。

- 源 commit：`61ec4c4a441f8a10a45de83cdce222b38f31ddaf`
- OpenAPI 权威源：`docs/backend-contracts/openapi.yaml`
- OpenAPI SHA-256：`1171cb76a485911ef44f5df9fc65f99ad5cbb9f7ab9d6a4e0d479c06eb4dad8c`
- 仓库内快照：`handoff/client-backend-integration-v1/`
- 可分发 ZIP：`C:\Users\23328\Desktop\BNBU-Sports-client-backend-handoff-v1.zip`
- ZIP 大小：`88931` bytes
- ZIP SHA-256：`f9497d1751bef5e81bccddbe4ebe1f11c6188e381f820085004b8aca19f83067`
- ZIP checksum sidecar：`C:\Users\23328\Desktop\BNBU-Sports-client-backend-handoff-v1.zip.sha256`
- Android handoff ready：YES
- iOS handoff ready：YES（任务材料 ready；工程仍缺失）
- Web handoff ready：YES
- iOS project present：NO
- iOS project path：NONE
- iOS project import required：YES
- Client Integration Execution Readiness / Started：NO / NO
- Staging Runtime Readiness：NO
- Three-client Definition of Done：NO
- Export Implementation / Production Deployment：NO / NO

本追加未修改 runtime coverage、OpenAPI、Migration、Prisma 或后端业务 Gate；Export 四个 operation 继续返回 `SYSTEM_MODE_UNSUPPORTED`。
