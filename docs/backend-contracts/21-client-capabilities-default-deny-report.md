# Stage 21 客户端能力合同与 GPS 默认拒绝报告

日期：2026-08-05。

## 交付范围

本阶段为 Android 学生端、Web 教师端和 Web 管理端补齐 30 个此前缺少的 operation，其中包含 6 个 GPS/位置隐私 operation。所有 operation 都有真实 NestJS 路由、输入 DTO、生成权限政策和 runtime coverage 记录。

冻结机器基线为 OpenAPI `1.1.0-contract`，SHA-256 `fb040b671e3f25c48279ad6b173ced5f633de1b1a1a9db0cc0f23a11e3fde4d1`；结构化记录见 `21-client-capabilities-contract-baseline.json`。

当前运行处置为：122 operations = 82 `IMPLEMENTED_VERIFIED` + 40 `IMPLEMENTED_DEFAULT_DENY`；0 `NOT_IMPLEMENTED`；0 `BLOCKED_BY_ADR`。新增 30 个 operation 均稳定返回 `SYSTEM_MODE_UNSUPPORTED`，不返回假成功。

## GPS 安全结论

- 学生 GPS mutation 先绑定既有 ExerciseSession 所有权；不能给其他学生的 Session 写样本。
- 教师/管理员读取先绑定既有 ExerciseRecord 责任或组织范围。
- 原始 `latitude/longitude` 仅为 `writeOnly` 输入；公共响应没有原始坐标。
- 教师、管理员和学生将来只能取得相同的粗化摘要模型；精确起终点不进入 projection。
- 当前没有 GPS 表、repository、对象文件、缓存或进程内 Map，因此请求不会留下位置事实。
- 位置采集、保留、删除、同意撤回与生产安全参数尚未批准，GPS Business/Privacy/Production Gate 均保持关闭。

## 持久化与迁移

本阶段没有修改 `backend/prisma/schema.prisma`，没有新增或修改 Migration，也没有创建 Notification、PushDevice、Feedback、ExemptionApplication、LocationTrack 等生产事实模型。后续业务实现必须在业务决策批准后新增 forward-only Migration，不得修改已完成 Migration。

## 验证范围

本次已通过：Unit 64/64、Contract 30/30、Security 41/41、新增能力轻量 HTTP route 2/2、strict typecheck、ESLint、Nest build、OpenAPI/permission contract、122-operation runtime coverage、generated artifact check、Prisma validate、Migration safety、from-empty schema diff、`npm audit --omit=dev`（0 vulnerabilities）和 `git diff --check`（以最终复核为准）。

当前环境没有 `TEST_DATABASE_URL`、`MIGRATION_DATABASE_URL`，也没有 Docker 命令；因此完整数据库 Integration、完整 AppModule E2E、schema drift 和 Docker runtime smoke 未执行，不能据此关闭 Client Integration、GPS Privacy 或 Production Gate。Build/Prisma 静态检查使用不连接数据库的本地 synthetic URL 只满足配置解析，不是数据库运行证据。

客户端页面到 operation 和后端文件的逐项对应见 `21-client-capabilities-operation-map.md`。
