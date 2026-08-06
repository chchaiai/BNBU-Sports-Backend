# 第一阶段 Definition of Done

第一阶段仅定义“本地后端接入底座完成”，不等同于客户端业务联调、staging、三端完成或 production。

## 每端必须通过

- [ ] 从 `openapi.snapshot.yaml` 生成本端 model/type，构建与测试校验固定 SHA-256。
- [ ] local/staging/production 配置显式分离；staging/production 未配置时 fail closed。
- [ ] 一个统一 transport 处理 `/api/v1`、成功/错误 envelope、最终 requestId 和日志脱敏。
- [ ] Auth/Token 生命周期符合端侧任务书；退出清理完整；401 不触发无限 refresh。
- [ ] 要求幂等的 mutation 正确复用 `Idempotency-Key`；版本冲突刷新并要求重新确认。
- [ ] opaque cursor 不解析、不跨账号或查询条件复用。
- [ ] Mock/fixture 与 real session/token/storage 隔离；production 构建证明 Mock 和旧 API 不可达。
- [ ] Export 503 `SYSTEM_MODE_UNSUPPORTED` 被明确展示，不产生本地假结果。
- [ ] 合同测试、单元测试、构建和 local backend smoke 全部通过并记录命令/结果。
- [ ] 至少一个响应 requestId 可从客户端日志安全定位，且日志扫描无 Secret/PII。
- [ ] 只改对应端允许路径；root `git status` clean；本地 commit 可追溯。

## Gate 判定

只有对应端负责人审查上述证据后，才可把该端 `*_FOUNDATION_LOCAL_GATE` 改为 YES。三端 Gate、staging runtime、Export、Production 仍保持 NO，除非后续独立验收明确改变。
