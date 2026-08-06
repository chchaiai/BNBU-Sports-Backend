# 分支与公共文件分配模板

## 统一 baseline

- baseline branch：
- baseline commit：
- 分配时间：
- 负责人：

## 分支

| Owner | 端 | 分支 | 允许路径 | 公共文件 owner | 截止时间 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
|  | Android | `client/android-backend-foundation/...` | `BNBU-Sports-Android-master/` |  |  |  |
|  | iOS | `client/ios-backend-foundation/...` | 真实 iOS 路径 |  |  |  |
|  | Web | `client/web-backend-foundation/...` | `BNBU-Sports-Web-new/` |  |  |  |

## 冲突防止规则

1. 一份公共生成配置/依赖锁同一时间只有一个明确 owner。
2. 不在共享工作目录轮流切分支；每人独立 clone/worktree。
3. 不在 Android/Web/iOS 目录创建嵌套 Git。
4. backend、OpenAPI、Migration 对客户端分支只读；合同问题提交负责人，不在端侧“修合同”。
5. 需要跨端公共调整时，先停止端侧写入，由负责人开独立变更并重新分发 baseline。
6. 合并或 cherry-pick 由负责人另行授权；本阶段开发者不 push/PR。
