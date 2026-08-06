# iOS Backend Foundation 第一阶段任务书

## 前置 Gate

只有真实 iOS 工程完成导入审计后才可实施。当前为 `IOS_PROJECT_IMPORT_REQUIRED=YES`；本任务书不授权自动创建工程。

## 真实工程到位后的交付项

1. 从固定 OpenAPI 快照生成 Swift model/schema，生成物不可手改，构建校验 SHA-256。
2. 使用工程既有生成工具或经负责人批准的最小工具链；不引入第二份手写 DTO 真相。
3. 使用 xcconfig 或现有等效方式区分 local/staging/production；缺 staging/production URL 时 fail closed。
4. 统一使用 URLSession 或工程现有网络库；禁止并行创建第二 transport。处理 `/api/v1`、成功/错误 envelope、最终 requestId、超时和安全重试。
5. 建立学生 Auth/Session adapter：QR Join、Access/Refresh、受控单次 refresh、reuse/logout 和 App restart 恢复。
6. Access/Refresh 保存到 Keychain，设置适合本 app 的 accessibility；禁止 UserDefaults、源码、日志或明文文件保存。
7. 一个用户意图复用一个 Idempotency-Key；mutation 不无限自动重试。
8. 支持 expectedVersion、expectedReviewVersion；冲突后刷新并要求重新确认。
9. opaque cursor 只原样传递，不解析、不跨账号/filter 缓存。
10. Media 使用 initiate/private PUT/confirm/bind/status/access URL，URL 不持久化，DTO/日志不出现 storageKey。
11. Session 以服务端 active 为权威；本地 timer 仅 UI。Score 使用 Decimal-safe 类型，只读 published projection。
12. SwiftUI Preview、fixture、stub 与 real auth/session/storage namespace 隔离；production 编译与运行不可达。
13. logging allowlist 脱敏 Token、Cookie、密码、PII、storageKey、signed URL、媒体和完整 body。
14. 完成单元/合同测试、Simulator local smoke；条件允许时补真实设备 local smoke，但不得把它写成 staging。

## 平台网络约束

- Simulator local Base URL 可使用 `http://127.0.0.1:3000/api/v1`（后端运行在同一 Mac）。
- 真机使用开发机受控局域网地址。
- local HTTP 例外只能限定在 debug/local；不得全局放宽 ATS 或进入 production。
- Web refresh cookie 的决定不直接套用 iOS；iOS 使用合同 Token + Keychain 边界。
