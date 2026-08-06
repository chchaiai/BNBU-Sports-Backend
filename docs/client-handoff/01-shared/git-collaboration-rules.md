# Git 协作规则

## 唯一仓库

- 唯一 Git 根目录是 `C:\Users\23328\Desktop\new_version`。
- `backend/`、`BNBU-Sports-Android-master/`、`BNBU-Sports-Web-new/` 是父仓库普通目录，不是 submodule。
- 禁止在客户端目录 `git init`、创建嵌套 `.git`、单独 commit/push/PR 或恢复 gitlink。

## 每人独立工作区

每位开发者使用自己的 clone 或独立 worktree；禁止多人共享同一工作目录后轮流切分支。每次开始先从根目录执行：

```powershell
git status
git branch --show-current
git rev-parse HEAD
git ls-files -s | Select-String "160000"
npm --prefix backend run repo-layout:check
```

如有未知未提交修改、嵌套 Git、gitlink 或进行中的 merge/rebase/cherry-pick/revert，停止并报告；不 stash、reset、restore、clean 或覆盖他人修改。

## 分支建议

- Android：`client/android-backend-foundation/<name>`
- iOS：`client/ios-backend-foundation/<name>`
- Web：`client/web-backend-foundation/<name>`

必须从负责人指定的统一 baseline 创建。第一阶段各端只能改对应客户端目录及获批的端侧测试/文档；不得修改 `backend/`、`docs/backend-contracts/openapi.yaml`、Migration 或其他端。

## 提交与交付

完成后从根目录选择性暂存对应端路径，检查 diff，再创建一个可追溯本地 commit。建议格式：

```text
feat(android): establish backend integration foundation
feat(ios): establish backend integration foundation
feat(web): establish backend integration foundation
```

交付必须包含 branch、完整 commit hash、文件清单、OpenAPI hash、测试、local smoke、requestId 样例、已知 blocker 和 clean `git status`。不得 push，不得创建 Pull Request，除非负责人另行明确授权。
