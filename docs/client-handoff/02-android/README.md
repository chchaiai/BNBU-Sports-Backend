# Android 学生端接入说明

## 必读

先读根目录 `README-FIRST.md`、`00-contract/CONTRACT-READ-ME.md`、OpenAPI 快照、client baseline、共享 Git 规则，再读本目录任务书和验收清单。

## 当前事实

Android 工程路径为 `BNBU-Sports-Android-master/`。当前代码已建立 `/api/v1` BuildConfig、OkHttp/Auth、Session、Media、Record 和学生工作区 gateway，并在构建时从精确绑定的 Contract 1.5 快照生成 Kotlin model。快照版本、SHA-256 和 operation count 由 `app/openapi/contract.properties` 校验，根 monorepo 还会检查该快照与权威 OpenAPI 字节一致。

这些是第一阶段要建立隔离与迁移底座的差距，不授权一次性重写全部页面。

## 当前任务

下一阶段只验证真实 private Pre-Staging 链路：Auth/refresh、QR 入班、Session、Media、Record、同一 `recordId` 的教师审核和学生回读。不得为联调重新引入旧路由、旧 multipart `/upload/proof`、第二份 DTO 或 Staging/Production Mock fallback。

## 禁止范围

- 不修改 backend、OpenAPI、Migration、Web 或 iOS。
- 不接完所有业务页面，不改变 UI 业务流程。
- 不连接旧远程 API、未知数据库或真实数据。
- 不把 staging/production、Export 或跨端联调写成完成。
- Contract 1.5 允许 `COURSE_RELATED` Record 的 `description` 为 null；`GENERAL` 仍由后端强制要求描述。
- 客户端不得请求 GPS 权限或采集坐标；图片证据必须继续可用，WebM 支持不替代图片路径。
- 不 push，不创建 PR。

## 本地联调

先按 `01-shared/local-backend-development.md` 启动 Docker 后端。Android Emulator 使用 `http://10.0.2.2:3000/api/v1`；真机使用受控局域网地址。只允许 debug/local HTTP，release 仍要求获批 HTTPS URL。

## 提交内容

从根仓库创建 Android foundation 分支，只提交 `BNBU-Sports-Android-master/` 内获批改动。交付 branch、完整 commit、files、OpenAPI hash、测试、local smoke、requestId、blockers 和 clean status。
