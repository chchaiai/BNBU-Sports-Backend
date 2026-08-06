# 分发清单

## 所有人必须收到

- [ ] `README-FIRST.md`
- [ ] 完整 `00-contract/`
- [ ] 完整 `01-shared/`
- [ ] `PACKAGE-MANIFEST.json`、`PACKAGE-CHECKSUMS.sha256`、`SOURCE-COMMIT.txt`、`GENERATION-REPORT.md`

## Android 同学

- [ ] 完整 `02-android/`
- [ ] `BNBU-Sports-Android-master/` 工程访问权限
- [ ] 独立 clone/worktree 与 Android foundation 分支分配

## iOS 同学

- [ ] 完整 `03-ios/`
- [ ] 真实 iOS 工程路径/访问权限，或明确导入说明
- [ ] 当前缺失时告知：`IOS_PROJECT_IMPORT_REQUIRED=YES`，不得创建空工程

## Web 同学

- [ ] 完整 `04-web/`
- [ ] `BNBU-Sports-Web-new/` 工程访问权限
- [ ] 独立 clone/worktree 与 Web foundation 分支分配

## 发送后确认

- [ ] 每人已复核 ZIP 和 OpenAPI SHA-256。
- [ ] 每人已知本阶段只做 local foundation，不代表 staging/三端/Export/Production 完成。
- [ ] 每人已知禁止修改 backend/OpenAPI/Migration 和禁止 push/PR。
