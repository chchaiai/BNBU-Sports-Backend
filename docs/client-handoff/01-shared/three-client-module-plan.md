# 三端模块推进顺序与职责

统一顺序：

```text
Foundation
→ Auth
→ Teaching / Enrollment
→ Session / Media / Record
→ Review
→ Score
```

第一阶段只完成 Foundation 与 Auth 底座的本地合同验证，不把所有页面一次性接完。

| 模块 | Android/iOS 学生端 | Web 教师/管理员端 | 完成证据 |
| --- | --- | --- | --- |
| Foundation | generated model、环境、transport、错误、幂等、版本、Mock 隔离 | generated types、env schema、transport、错误、cursor、Mock 隔离 | 哈希绑定、合同测试、local smoke |
| Auth | QR Join/学生 Session；安全存储与恢复 | 教师/管理员 password login；cookie/access adapter | refresh rotation/reuse/logout 负面测试 |
| Teaching / Enrollment | 读取本人 ACTIVE Enrollment/Course/ClassSection，执行权威 QR flow | 教师本人班级，ADMIN 只读治理 | 同一 enrollmentId 端到端 |
| Session / Media / Record | 产生学生业务事实 | 读取责任班级的 Record/Media metadata | 同一 recordId 与私有证据链 |
| Review | 只读 safe currentReview | 责任 TEACHER append-only 决策；ADMIN 不代审 | 双 version 冲突与历史证据 |
| Score | 只读 published projection | 规则治理、重算、显式发布 | Decimal-safe、published preservation |

Android/iOS 负责产生学生业务事实，但不得执行教师审核或计算正式 Score。Web 负责教师/管理员消费和治理，但不得伪造学生运动 Session、Media 或 Record 事实。

最终跨端验收必须追踪同一个 `recordId`：学生端提交 → 数据库事实 → Web 责任教师读取/处理 → 学生端读取同一结果。当前尚未开始该验收。
