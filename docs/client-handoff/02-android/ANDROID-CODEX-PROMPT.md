# 可直接发送给 Android 同学 Codex 的执行提示词

你现在负责 BNBU Sports Android 学生端“后端接入底座第一阶段”。必须在用户提供的 monorepo 根目录工作，不要创建新仓库或嵌套 Git。

## 输入基线

- 唯一根仓库：`C:\Users\23328\Desktop\new_version`（如用户提供其他 clone，以其真实根目录为准）。
- 允许修改：`BNBU-Sports-Android-master/` 内与 foundation 直接相关的代码、测试和端侧文档。
- 禁止修改：`backend/`、`docs/backend-contracts/openapi.yaml`、Migration、Web、iOS。
- 源 baseline commit：`61ec4c4a441f8a10a45de83cdce222b38f31ddaf`。
- OpenAPI 快照：本交接包 `00-contract/openapi.snapshot.yaml`。
- 必须哈希：`1171cb76a485911ef44f5df9fc65f99ad5cbb9f7ab9d6a4e0d479c06eb4dad8c`。
- 当前阶段只做 foundation/local contract smoke；staging runtime、客户端联调、Export、Production 均未完成。

## 第一停止 Gate

在任何写入前，从根目录执行并报告：

```powershell
git status
git branch --show-current
git rev-parse HEAD
git merge-base --is-ancestor 61ec4c4a441f8a10a45de83cdce222b38f31ddaf HEAD
git ls-files -s | Select-String "160000"
npm --prefix backend run repo-layout:check
Get-FileHash -Algorithm SHA256 <交接包路径>\00-contract\openapi.snapshot.yaml
```

还要检查 merge/rebase/cherry-pick/revert 未进行。若工作树不 clean、baseline 不是当前 HEAD/负责人明确指定祖先、哈希不匹配、gitlink/nested Git 非 0，立即停止；不 stash、reset、restore、clean 或覆盖修改。

Gate 通过后从根目录创建 `client/android-backend-foundation/<name>` 分支；不得在 Android 目录内单独切分支。

## 先审计再实现

完整读取交接包合同和 Android 任务书，再审计当前 Gradle、BuildConfig、StudentApiClient/Endpoint/DTO、repository、Auth token storage、Mock workspace、Session snapshot、Media upload 和 Score 展示。保留现有 UI/业务逻辑，只扩展既有结构。

当前已知差距仅作定位线索，仍须用代码验证：debug 默认旧 IP `/api`；手写旧 endpoint/DTO；单 bearer token；每次 mutation 自动新 Idempotency-Key；旧 `/upload/proof` multipart；本地 Session/Score/Mock 可能成为事实。

## 实现范围

严格完成 `android-backend-foundation-task.md`：

1. 从快照生成 Kotlin models 并绑定哈希；transport 手写。
2. 建立 local/staging/production BuildConfig；Android emulator local 为 `http://10.0.2.2:3000/api/v1`，release 缺 HTTPS 配置 fail closed。
3. 建立统一 OkHttp transport、typed envelope/error、最终 requestId、日志脱敏。
4. 建立 Access/Refresh、受控单次 refresh、logout 和 Keystore-backed secure storage。
5. 正确建模 Idempotency-Key 用户意图复用、expectedVersion、expectedReviewVersion 和 opaque cursor。
6. 隔离 legacy/Mock；production 证明 Mock、旧 host/path、旧 multipart 不可达。
7. 只建立 Media/Session/Record/Review/Score 的 foundation type/adapter 边界，不接完全部页面。
8. Export 继续处理 `SYSTEM_MODE_UNSUPPORTED`，不得假实现。

不得连接 staging、旧远程 API 或真实数据；不得修改 backend/OpenAPI 来迁就客户端。

## 本地 Docker 与测试

按 `01-shared/local-backend-development.md` 的真实命令启动 backend。先验证 health/live、health/ready、system-mode，再运行 Android 实际存在的单元测试、合同测试和 debug build。为 hash、envelope/error、requestId、Idempotency-Key 重放、version conflict、cursor、refresh/logout、Mock production 不可达、日志脱敏和 Export 503 补测试。

不要编造未执行结果；如 Docker、SDK 或真实 fixture 缺失，完成其余可执行检查并报告 blocker。

## 提交

从根目录检查 diff，只暂存 Android 允许路径，创建一个本地 commit，建议：

```text
feat(android): establish backend integration foundation
```

不得 push，不得创建 PR。

## 最终汇报

准确给出输入 branch/HEAD、输出 branch/完整 commit、变更文件、OpenAPI hash、配置矩阵、测试命令与结果、local smoke、脱敏 requestId、Mock/legacy 隔离证据、blockers、最终 root Git status，并输出：

```text
ANDROID_FOUNDATION_LOCAL_GATE=<YES_OR_NO>
OPENAPI_CHANGED=NO
BACKEND_CHANGED=NO
WEB_CHANGED=NO
IOS_CHANGED=NO
STAGING_RUNTIME_READINESS=NO
CLIENT_INTEGRATION_STARTED=NO
PUSHED=NO
PULL_REQUEST_CREATED=NO
```
