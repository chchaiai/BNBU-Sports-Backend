# Android 学生端接入说明

## 必读

先读根目录 `README-FIRST.md`、`00-contract/CONTRACT-READ-ME.md`、OpenAPI 快照、client baseline、共享 Git 规则，再读本目录任务书和验收清单。

## 当前事实

Android 工程路径为 `BNBU-Sports-Android-master/`。当前代码使用 BuildConfig + OkHttp + Gson，但 debug 默认旧 `http://123.207.5.70:3334/api`，endpoint/DTO 仍是旧合同；只保存一个 bearer token；mutation 每次自动生成新 Idempotency-Key；旧 `/upload/proof` multipart 返回 URL/cosKey；本地 Session/Score/Mock 仍可能承担业务事实。

这些是第一阶段要建立隔离与迁移底座的差距，不授权一次性重写全部页面。

## 当前任务

只在 Android 目录建立 generated Kotlin model、哈希绑定、三环境 BuildConfig、统一 OkHttp transport、Auth/refresh/logout、安全 Token 存储、错误/requestId、幂等/版本、Mock 隔离、local smoke 和日志脱敏。

## 禁止范围

- 不修改 backend、OpenAPI、Migration、Web 或 iOS。
- 不接完所有业务页面，不改变 UI 业务流程。
- 不连接旧远程 API、未知数据库或真实数据。
- 不把 staging/production、Export 或跨端联调写成完成。
- 不 push，不创建 PR。

## 本地联调

先按 `01-shared/local-backend-development.md` 启动 Docker 后端。Android Emulator 使用 `http://10.0.2.2:3000/api/v1`；真机使用受控局域网地址。只允许 debug/local HTTP，release 仍要求获批 HTTPS URL。

## 提交内容

从根仓库创建 Android foundation 分支，只提交 `BNBU-Sports-Android-master/` 内获批改动。交付 branch、完整 commit、files、OpenAPI hash、测试、local smoke、requestId、blockers 和 clean status。
