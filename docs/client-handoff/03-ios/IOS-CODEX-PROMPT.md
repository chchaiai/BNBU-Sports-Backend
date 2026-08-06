# 可直接发送给 iOS 同学 Codex 的执行提示词

你负责 BNBU Sports iOS 学生端“后端接入底座第一阶段”。先执行工程存在性 Gate，不能凭空创建工程。

## 固定合同输入

- 源 baseline commit：`61ec4c4a441f8a10a45de83cdce222b38f31ddaf`。
- OpenAPI 快照：交接包 `00-contract/openapi.snapshot.yaml`。
- SHA-256：`1171cb76a485911ef44f5df9fc65f99ad5cbb9f7ab9d6a4e0d479c06eb4dad8c`。
- 唯一 API prefix：`/api/v1`。
- 禁止修改 backend、OpenAPI、Migration、Android、Web。

## 第一 Gate：真实 iOS 工程

当前交接包记录：

```text
IOS_PROJECT_PRESENT=NO
IOS_PROJECT_PATH=NONE
IOS_PROJECT_IMPORT_REQUIRED=YES
```

先要求用户提供真实 iOS 工程的绝对路径、Git 根目录和指定 baseline。搜索并记录 `.xcodeproj`、`.xcworkspace`、`project.pbxproj`、`Package.swift` 和 `.swift`。检查 root branch、HEAD、status、gitlink/nested Git 与进行中的 Git 操作。

如果用户未提供真实工程，或工程工作树有未知修改，立即停止；不要创建新 Xcode 工程、空 Swift package、假 Swift 文件或临时仓库，不开始实现。只输出：

```text
IOS_PROJECT_PRESENT=NO
IOS_PROJECT_IMPORT_REQUIRED=YES
IOS_FOUNDATION_LOCAL_GATE=NO
```

## 工程存在时的停止 Gate

完整读取交接合同与 iOS 任务书，核验快照哈希。要求工作树 clean、baseline 由负责人明确、无 nested Git/gitlink 和进行中的 merge/rebase/cherry-pick/revert。任一失败则不写入、不 stash/reset/restore/clean。

Gate 通过后，从统一 monorepo 根目录创建 `client/ios-backend-foundation/<name>` 分支；只修改真实 iOS 工程允许路径，不单独初始化 Git。

## 审计与实现

先审计现有 app target、Swift/SwiftUI、Package/CocoaPods、网络层、model、Auth、Keychain/UserDefaults、xcconfig、fixture/Preview、测试和日志。沿用现有结构，只完成 `ios-backend-foundation-task.md`：generated Swift model + hash、三环境、单一 URLSession/现有 transport、typed envelope/error/requestId、Access/Refresh/Keychain、Idempotency-Key、expectedVersion/expectedReviewVersion、cursor、Media/Session/Score 边界、fixture production 不可达和日志脱敏。

不要一次性修改全部页面，不依赖 staging，不用客户端规则替代后端裁决，不实现 Export。

## Local 与测试

在承载 Simulator 的 Mac 上按共享 local guide 启动 Docker backend，Simulator Base URL 使用 `http://127.0.0.1:3000/api/v1`；真机使用受控局域网地址。ATS 的 HTTP 例外只限 debug/local。

执行工程实际存在的 build/test 命令；补 hash、envelope/error、requestId、Idempotency-Key、version conflict、refresh/logout、fixture isolation、logging redaction、Export 503 测试。未执行的真机或 Docker 验证必须列为 blocker。

## Commit 与最终汇报

从唯一根目录只暂存 iOS 允许路径，创建本地 commit `feat(ios): establish backend integration foundation`。不得 push，不创建 PR。

报告输入/输出 branch、完整 commit、工程路径、files、OpenAPI hash、测试、local smoke、脱敏 requestId、blockers、clean status，并输出：

```text
IOS_PROJECT_PRESENT=YES
IOS_PROJECT_IMPORT_REQUIRED=NO
IOS_FOUNDATION_LOCAL_GATE=<YES_OR_NO>
OPENAPI_CHANGED=NO
BACKEND_CHANGED=NO
ANDROID_CHANGED=NO
WEB_CHANGED=NO
STAGING_RUNTIME_READINESS=NO
CLIENT_INTEGRATION_STARTED=NO
PUSHED=NO
PULL_REQUEST_CREATED=NO
```
