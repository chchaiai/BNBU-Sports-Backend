# 合同快照使用说明

## 唯一权威来源

仓库内唯一人工维护的 API 机器合同是 `docs/backend-contracts/openapi.yaml`。分发包中的 `openapi.snapshot.yaml` 是源 commit `61ec4c4a441f8a10a45de83cdce222b38f31ddaf` 上生成的不可变离线快照，不是第二份权威合同。

快照 SHA-256：

```text
1171cb76a485911ef44f5df9fc65f99ad5cbb9f7ab9d6a4e0d479c06eb4dad8c
```

## 强制规则

1. Android、iOS、Web 必须使用同一份快照。
2. Kotlin、Swift、TypeScript generated DTO/schema 必须绑定上述哈希，并在构建或合同测试中验证。
3. 端侧开发者不得直接修改快照，也不得用端侧 DTO、Mock 或旧接口反向覆盖仓库合同。
4. transport、认证、安全存储、重试和 UI adapter 手写；generated 字段不得手改。
5. 发现缺字段、路径、枚举或行为冲突时，停止该 operation 的实现，按统一问题模板提交项目负责人。
6. 合同升级必须由负责人从新的 clean 权威 commit 重新生成新版本交接包，并提供 compatibility diff 和 release note。
7. 禁止 Android、iOS、Web 各自维护一份 OpenAPI。

## 当前运行边界

- `/api/v1`；API JSON 为 camelCase，枚举为 UPPER_SNAKE_CASE。
- OpenAPI operations 92：`IMPLEMENTED_VERIFIED=82`，`IMPLEMENTED_DEFAULT_DENY=10`，`NOT_IMPLEMENTED=0`，`BLOCKED_BY_ADR=0`。
- default-deny 是真实路由行为，不是未实现 404。Export 四个 operation 继续返回 `SYSTEM_MODE_UNSUPPORTED`。
- 本快照只支持 local 合同验证和团队交接，不证明 staging 或 production 可用。
