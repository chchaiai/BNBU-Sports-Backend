# iOS 学生端接入说明

iOS 与 Android 使用同一 `/api/v1` 后端业务合同、同一 OpenAPI 快照和同一 Gate，不允许另行定义字段、状态或业务流程。

## 当前工程状态

```text
IOS_PROJECT_PRESENT=NO
IOS_PROJECT_PATH=NONE
IOS_PROJECT_IMPORT_REQUIRED=YES
```

当前 monorepo 搜索不到 `.xcodeproj`、`.xcworkspace`、`project.pbxproj`、`Package.swift` 或 `.swift`。本任务包只用于派工；不得创建空 Xcode 工程、假的 Swift 文件或声称 iOS 已开始开发。

## 开始前

负责人必须提供真实 iOS 工程路径、统一 baseline 和仓库归属。开发者先检查工程结构、Git 状态、已有网络层/依赖/配置/Keychain/fixture/preview，再决定最小接入方式。若工程仍缺失，停止并输出 `IOS_PROJECT_IMPORT_REQUIRED=YES`。

真实工程到位后，本阶段只建立 generated Swift models、哈希绑定、xcconfig 三环境、统一 URLSession/现有 transport、Auth/Keychain、错误/requestId、幂等/版本、fixture 隔离、local smoke 和日志脱敏；不一次性修改全部页面。

禁止修改 backend/OpenAPI/Migration/Android/Web，禁止依赖 staging，禁止 push/PR。
