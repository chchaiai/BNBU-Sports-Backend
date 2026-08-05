# Stage 21 客户端能力与后端 operation 对应表

日期：2026-08-05。权威机器合同：`docs/backend-contracts/openapi.yaml`。

## 1. 本阶段结论

Android 学生端与 Web 教师/管理端此前只有界面、Mock 或本地状态而没有统一 operation 的能力，现已补入 30 个 OpenAPI operation，并全部绑定到：

- `backend/src/modules/client-capabilities/client-capabilities.controller.ts`：真实 HTTP 路由与 `operationId`；
- `backend/src/modules/client-capabilities/client-capabilities.dto.ts`：输入校验边界；
- `backend/src/modules/client-capabilities/client-capabilities.service.ts`：统一稳定拒绝 `SYSTEM_MODE_UNSUPPORTED`；
- `backend/runtime-coverage.manifest.json`：运行覆盖状态与测试证据。

这些能力目前是“合同已存在、路由已存在、权限先执行、业务稳定拒绝”，不是“业务已经启用”。没有新增 Prisma model 或 Migration，也不会写入通知、反馈、免测申请或 GPS 数据。

## 2. Android 学生端对应关系

| Android 业务入口/代码 | OpenAPI operation | 后端入口 | 当前状态 |
|---|---|---|---|
| 登录验证码、账号找回（`MainActivity.kt` 入口） | `requestStudentSignInCode`、`verifyStudentSignInCode`、`requestAccountRecovery`、`completeAccountRecovery` | `ClientCapabilitiesController` 同名方法 | 默认拒绝；验证码渠道、TTL、风控和找回政策待批准 |
| 通知中心 `feature/notifications/NotificationSheet.kt` | `listNotifications`、`markNotificationRead`、`registerPushDevice`、`unregisterPushDevice` | 同上 | 默认拒绝；通知类型、推送供应商和保留期待批准 |
| 语言/通知偏好 `core/local/AppLanguagePreferences.kt` | `getCurrentUserPreferences`、`updateCurrentUserPreferences` | 同上 | 默认拒绝；服务端偏好同步规则待批准 |
| 帮助中心 `feature/help/HelpCenterScreen.kt`、`HelpArticleCache.kt` | `listHelpArticles`、`getHelpArticle` | 同上 | 默认拒绝；内容发布责任与缓存策略待批准 |
| 意见反馈 `feature/feedback/FeedbackScreen.kt` | `createFeedback`、`listFeedback`、`getFeedback` | 同上 | 默认拒绝；处理状态、SLA 和隐私规则待批准 |
| 免测申请 `feature/exemption/ExemptionScreen.kt` | `listExemptionApplications`、`createExemptionApplication`、`getExemptionApplication`、`updateExemptionApplication`、`submitExemptionApplication` | 同上 | 默认拒绝；状态机、材料和审批责任待批准 |
| 版本检查 `MainActivity.kt` | `getAppReleasePolicy` | 同上 | 默认拒绝；最低版本与强更策略待批准 |
| 项目与折算展示 `feature/scoring/EnduranceScoringScreen.kt` | `getSportCatalog`、`getActivityConversionRules` | 同上 | 默认拒绝；项目目录与折算规则版本待批准 |
| 运动会话 `feature/checkin/session/ExerciseSessionController.kt`、`ExerciseSessionStore.kt` | `startExerciseLocationTrack`、`appendExerciseLocationSamples`、`finalizeExerciseLocationTrack` | 同上 | GPS 默认拒绝；仅学生自己的 Session 可进入该边界 |

Android 后续接入时必须继续以既有 `startExerciseSession` → GPS track/sample → `finishExerciseSession` → ExerciseRecord 的同一 `sessionId/recordId` 链为准，不得以本地计时、设备时间或本地轨迹替代服务端时长与记录事实。

## 3. Web 教师端对应关系

| Web 业务入口/代码 | OpenAPI operation | 后端入口 | 当前状态 |
|---|---|---|---|
| 教师工作台免测审核 `app/teacher-workspace.tsx` | `listExemptionApplications`、`getExemptionApplication`、`reviewExemptionApplication` | `ClientCapabilitiesController` 同名方法 | 默认拒绝；未来只能审核本人 `ClassSection` |
| 教师记录地图/轨迹摘要 `app/teacher-workspace.tsx` | `getExerciseRecordLocationSummary` | 同上 | 默认拒绝；先按 `recordId` 校验责任班级，只返回粗化摘要 |
| 教师反馈查询（工作台后续接入点） | `listFeedback`、`getFeedback` | 同上 | 默认拒绝；只允许角色范围内的投影，处理职责待批准 |

教师端永不读取 GPS 原始采样点、精确起终点或可反推出住址的坐标。当前合同只预留 `coarseRoutePolyline`、`coarseDistanceMeters`、时间范围、异常标记和政策版本。

## 4. Web 管理端对应关系

| Web 业务入口/代码 | OpenAPI operation | 后端入口 | 当前状态 |
|---|---|---|---|
| 工单/支持 `app/admin-ticket-workspace.tsx`、`app/admin-support.tsx` | `listFeedback`、`getFeedback` | `ClientCapabilitiesController` 同名方法 | 默认拒绝；仅本组织范围 |
| 帮助内容 `app/admin-help.tsx` | `listHelpArticles`、`getHelpArticle` | 同上 | 当前只有读取合同且默认拒绝；发布/编辑 operation 尚未批准，未伪造 |
| 系统/版本 `app/admin-system.tsx` | `getAppReleasePolicy` | 同上 | 默认拒绝；平台版本政策待批准 |
| 运动规则 `app/admin-rules.tsx` | `getSportCatalog`、`getActivityConversionRules` | 同上 | 默认拒绝；规则创建/发布仍走现有 ScoreRule 边界，不混成第二套规则 |
| 免测治理 | `listExemptionApplications`、`getExemptionApplication` | 同上 | 默认拒绝；ADMIN 当前只预留本组织只读视图，不代行教师审批 |
| GPS 隐私治理 | `getLocationPrivacyPolicy`、`updateLocationPrivacyPolicy` | 同上 | 默认拒绝；只有 ADMIN 可提交未来政策更新，仍需隐私/保留/安全审批 |
| GPS 审核摘要 | `getExerciseRecordLocationSummary` | 同上 | 默认拒绝；ADMIN 仅本组织粗化投影，无原始坐标 |

## 5. GPS 权限与数据边界

| 环节 | 身份与资源链 | 可见/可写数据 | 当前结果 |
|---|---|---|---|
| 学生开始、追加、结束轨迹 | `ACCESS_TOKEN` → `STUDENT` → `organizationId` → `EXERCISE_SESSION_FROM_PATH` → Session owner | 输入原始样本；`latitude/longitude` 在合同中为 `writeOnly` | `503 SYSTEM_MODE_UNSUPPORTED`，零持久化 |
| 学生/教师/管理员读取摘要 | `ACCESS_TOKEN` → role → `organizationId` → `EXERCISE_RECORD_FROM_PATH` → 学生本人/责任教师/本组织管理员 | 仅粗化路线、粗化距离、时间范围、质量/异常摘要、政策版本 | `503 SYSTEM_MODE_UNSUPPORTED`，无原始样本 projection |
| 管理员读取/更新位置政策 | `ACCESS_TOKEN` → `ADMIN` → principal organization | 同意版本、采样间隔、精度门槛、原始/粗化保留天数、粗化尺度 | `503 SYSTEM_MODE_UNSUPPORTED`，无配置写入 |

GPS 真正启用前必须另行批准并实现：明示同意与撤回、Android 前后台权限体验、采样/精度策略、原始与粗化保留期、加密与访问审计、异常检测定义、删除/申诉机制、生产密钥与监控。缺一项都不得把 `x-enabled-by-default` 改为 `true`。

## 6. 清单中已有 operation、无需重复新增的能力

| 原确认项 | 已有权威 operation/字段 | 结论 |
|---|---|---|
| 邮箱/手机号绑定 | `updateCurrentUserProfile`（`UsersController.update`） | 已有真实默认拒绝路由；验证挑战、唯一性和换绑规则未批准，不再创建语义重叠接口 |
| 打卡时间窗口查询 | `getClassSection` / `listClassSections` 返回 `checkInWindowMode`、日期、每日起止时间、截止时间和排除日期 | 已由 ClassSection 提供；服务端开始 Session 时仍作最终裁决，不新建第二套窗口查询事实 |
| 学生审核结果 | `getExerciseRecord` 的学生安全 `currentReview` projection | 只含结果、原因码和公开意见；不返回教师 `internalNote` 或完整内部历史 |
| 学生成绩 | `listStudentScores` / `getStudentScore` | 服务器发布结果权威；Android 本地计算不能替代该结果 |
| 已提交记录撤回 | `withdrawExerciseRecord` | 已有真实默认拒绝，固定 `EXERCISE_RECORD_WITHDRAWAL_NOT_ALLOWED` |

因此，本阶段新增的是原合同真正没有 operation 的能力；已有但处于 default-deny 的能力保留原 operation，不因客户端页面存在而复制接口。

## 7. 可追溯验证

- Unit：`backend/test/unit/client-capabilities.test.ts`
- Contract：`backend/test/contract/client-capabilities-contract.test.ts`
- HTTP route：`backend/test/e2e/client-capabilities.e2e.test.ts`
- 生成权限：`backend/src/generated/operation-policies.generated.ts`
- 运行登记：`backend/runtime-coverage.manifest.json`
