# 可直接发送给 Web 同学 Codex 的执行提示词

你负责 BNBU Sports Web 教师端/管理端“后端接入底座第一阶段”。沿用现有 UI、路由、角色职责和组件，只建立 foundation，不接完所有 Mock 页面。

## 输入基线

- 唯一 monorepo 根：`C:\Users\23328\Desktop\new_version`（或用户提供的真实独立 clone）。
- 允许修改：`BNBU-Sports-Web-new/` 内 foundation 相关代码、测试和端侧文档。
- 禁止修改：`backend/`、`docs/backend-contracts/openapi.yaml`、Migration、Android、iOS。
- 源 baseline commit：`61ec4c4a441f8a10a45de83cdce222b38f31ddaf`。
- OpenAPI 快照：交接包 `00-contract/openapi.snapshot.yaml`。
- SHA-256：`1171cb76a485911ef44f5df9fc65f99ad5cbb9f7ab9d6a4e0d479c06eb4dad8c`。
- Web refresh cookie：`ACCEPTED_WITH_STAGING_VALIDATION`；staging runtime 尚未 ready。

## Git/合同停止 Gate

写入前从根目录执行并报告：

```powershell
git status
git branch --show-current
git rev-parse HEAD
git merge-base --is-ancestor 61ec4c4a441f8a10a45de83cdce222b38f31ddaf HEAD
git ls-files -s | Select-String "160000"
npm --prefix backend run repo-layout:check
Get-FileHash -Algorithm SHA256 <交接包路径>\00-contract\openapi.snapshot.yaml
```

检查无 merge/rebase/cherry-pick/revert。工作树不 clean、baseline 不符、哈希不符、gitlink/nested Git 非 0 时立即停止，不 stash/reset/restore/clean。

Gate 通过后从根目录创建 `client/web-backend-foundation/<name>` 分支；不得在 Web 目录初始化或单独管理 Git。

## 先审计

完整读取合同、共享 foundation、Web 任务书；检查 package/scripts、env、现有 service/store、portal 登录、localStorage/sessionStorage、roster/admin Mock、ChatGPT auth headers、页面路由和测试。当前已知事实仍须代码确认：任意非空账号密码登录、admin localStorage 30 天、admin/roster Mock、本地 CSV export、无统一 BNBU transport。

## 实现范围

严格完成 `web-backend-foundation-task.md`：

1. 生成 TypeScript types + hash binding。
2. env schema + `/api/v1` 单一 transport + typed envelope/error/requestId。
3. BNBU Auth adapter：password-login/refresh/logout/me；移除正式路径任意非空登录和本地角色会话。
4. refresh cookie/access memory 目标实现与测试；cookie domain/path/SameSite、CORS credentials、CSRF 标记 staging 未验收，不编造 production 参数。
5. ErrorCode、opaque cursor、Idempotency-Key、expectedVersion/expectedReviewVersion 共用层。
6. Mock/real session/storage 分离，production 证明 admin/roster Mock、本地业务 export、旧规划 API 不可达。
7. 只选择 health/system-mode/Auth/me 等最小 local vertical slice，不接完所有 Course/Roster/Review/Score 页面。
8. Export 继续 503 default-deny，无浏览器假下载；Audit Mock 不冒充服务端事实。
9. 日志/telemetry 脱敏。

不得改变现有菜单、权限职责和业务 UI；不得修改 backend/OpenAPI 来迁就前端；不得依赖 staging 或真实数据。

## Local、测试和提交

按共享 local guide 启动 Docker backend；Web API base 为 `http://127.0.0.1:3000/api/v1`，把 Web 前端精确 origin 加入 backend `CORS_ALLOWLIST`。运行工程实际存在的 typecheck、lint、test、build 和 local smoke；补 hash/envelope/error/requestId/cursor/idempotency/version/auth/Mock isolation/Export 503 测试。不要编造结果。

从根目录只暂存 Web 允许路径并创建本地 commit：

```text
feat(web): establish backend integration foundation
```

不得 push，不创建 PR。

## 最终汇报

给出输入 branch/HEAD、输出 branch/完整 commit、files、OpenAPI hash、env matrix、测试、local smoke、脱敏 requestId、Mock/legacy 隔离、cookie/CORS/CSRF staging blockers、final root status，并输出：

```text
WEB_FOUNDATION_LOCAL_GATE=<YES_OR_NO>
WEB_REFRESH_COOKIE_STATUS=ACCEPTED_WITH_STAGING_VALIDATION
OPENAPI_CHANGED=NO
BACKEND_CHANGED=NO
ANDROID_CHANGED=NO
IOS_CHANGED=NO
STAGING_RUNTIME_READINESS=NO
CLIENT_INTEGRATION_STARTED=NO
PUSHED=NO
PULL_REQUEST_CREATED=NO
```
