# BNBU Sports Staging R01 测试账号初始化 Runbook

> 本 Runbook 供 Operations / Backend 值班人创建并复核 R01 的 Admin、Teacher、课程和班级，并为三个 Student Tester 保留固定学号。执行后只向团队发布安全别名与 `READY / BLOCKED`，不发布登录标识、密码、邮箱、Token、OTP 或内部 ID。

## 1. 固定范围

- 环境只能是 `staging`。
- 实际 `organizationCode` 固定为 `BNBU`，因为 Android Staging 构建和 Student Web 登录流程使用该值。
- 文档别名 `R01-TEST-ORG` 只是测试记录名称，不是第二个 organization code。
- R01 Organization 必须与 Phase 12 的 `STAGING-BUSINESS-SYNTHETIC` Organization 不同。
- 固定 Course code：`R01-TEST-COURSE-A`。
- 固定 ClassSection code：`R01-TEST-SECTION-A`。
- 两个预置的交互账号别名：`ADMIN-01`、`TEACHER-01`。
- 三个保留的 Student 学号：`STUDENT-ANDROID-01`、`STUDENT-IOS-01`、`STUDENT-WEB-01`。它们仍属于 R01 Tester 矩阵，但本工具只验证其不存在。
- 工具会额外创建一个没有邮箱、密码和登录能力的内部审批身份 `R01-INTERNAL-SCORE-APPROVER`，只用于满足 active ScoreRule 的两人审批事实。它不是第六个 Tester，不得分发。
- 工具绝不创建三个 Student 的 User、StudentProfile、AuthSession 或 Enrollment，也不接收其邮箱。三个 Student 必须由各端 Tester 使用各自受控邮箱走真实 SES OTP 和入课流程。

## 2. 执行前 Gate

全部满足后才运行：

1. 使用已经正式发布、包含 `staging:r01-provisioner` 的 immutable Backend runtime image。
2. 当前长期 Backend 仍健康；本操作不替换或重启长期 Backend。
3. 当前数据库仍是 `10.0.0.10:5432 / sports_staging_pg_01`，runtime 用户仍是 `sports_staging_app`，TLS CA target 仍为 `/run/secrets/tencentdb-ca-chain.pem`。
4. 实时只读检查确认 `BNBU` Organization 不存在，或其元数据与本工具冻结值完全一致。任何冲突都停止，不现场改库。
5. `BNBU` 内三个保留学号对应的 StudentProfile 必须全部不存在，包括 soft-deleted 历史行；首次执行和紧接其后的幂等复核必须在任何 Student 真实登录或建档前完成。
6. Admin / Teacher 登录标识都必须是小写 email-form 字符串，输入值必须与其 trim 后的值完全相同，且两个登录标识必须互不相同。
7. Admin / Teacher 密码都必须为 24–128 个 UTF-16 code unit，输入值必须与其 trim 后的值完全相同，不得包含 `CHANGE_ME`，且两个密码必须互不相同。
8. 三个 Student 的受控邮箱由各端负责人另行保管，不能写入本 Secret 文件或传给 provisioner。
9. 已记录目标 release、image ID、容器固定名称、验证步骤和“不删除已创建数据库行”的回退边界。

## 3. Secret 文件合同

Host 文件建议固定为：

`/opt/bnbu-sports/shared/bnbu_staging_r01_fixture.json`

文件必须由批准的隐藏输入流程通过 SSH stdin 一次性创建，使用 `O_EXCL`，不得覆盖已有文件。最终元数据必须是：

- owner/group：numeric `0:10001`
- mode：`0640`
- regular file
- non-symlink

JSON 只允许以下四个 key，不能增加备注字段：

```text
STAGING_R01_ADMIN_ACCOUNT
STAGING_R01_ADMIN_PASSWORD
STAGING_R01_TEACHER_ACCOUNT
STAGING_R01_TEACHER_PASSWORD
```

不得把值放入命令行参数、环境变量、Shell history、Git、飞书、群聊或部署日志。Compose 只通过 secret target `/run/secrets/bnbu_staging_r01_fixture.json` 挂载该文件。旧版曾使用的 `STAGING_R01_STUDENT_ANDROID_EMAIL`、`STAGING_R01_STUDENT_IOS_EMAIL`、`STAGING_R01_STUDENT_WEB_EMAIL` 已退役；它们不得出现在 Secret JSON、`staging.env` 或容器环境中。Preflight 和 operator 对四个当前 key 与三个退役 key 共七个环境变量全部 fail closed，且不回显其值。

## 4. 本地发布前验证

从 monorepo 根目录执行：

```powershell
npm --prefix backend run format:check
npm --prefix backend run lint
npm --prefix backend run typecheck
npm --prefix backend test
npm --prefix backend run test:integration
npm --prefix backend run test:tencent-cloud-config
npm --prefix backend run build
git diff --check
```

最终发布仍必须执行仓库规定的完整 Backend、合同、Migration、生成物、安全、Docker 和 audit Gate；本段定向命令不能替代完整 Release Gate。

## 5. Staging one-shot 执行

以下是命令结构，实际 release 目录、image 和固定容器名必须在执行计划中冻结；不得把 Secret 值拼入命令：

```bash
cd /opt/bnbu-sports/releases/<released-version>/backend
/usr/bin/env \
  BACKEND_RUNTIME_IMAGE=<immutable-runtime-image> \
  BACKEND_MIGRATOR_IMAGE=<immutable-migrator-image> \
  STAGING_ENV_FILE=<approved-absolute-staging-env> \
  BNBU_RUNTIME_SECRET_FILE=/opt/bnbu-sports/shared/bnbu_runtime.json \
  BNBU_MIGRATOR_SECRET_FILE=/opt/bnbu-sports/shared/bnbu_migrator.json \
  BNBU_STAGING_FIXTURE_SECRET_FILE=/opt/bnbu-sports/shared/bnbu_staging_fixture.json \
  BNBU_STAGING_BUSINESS_FIXTURE_SECRET_FILE=/opt/bnbu-sports/shared/bnbu_staging_business_fixture.json \
  BNBU_STAGING_R01_FIXTURE_SECRET_FILE=/opt/bnbu-sports/shared/bnbu_staging_r01_fixture.json \
  BNBU_TENCENTDB_CA_FILE=/opt/bnbu-sports/shared/tencentdb-ca-chain.pem \
  STAGING_R01_CONFIRMATION=BNBU_SPORTS_STAGING_R01_PROVISIONING_V1 \
  /usr/bin/docker compose \
  --project-name bnbu-sports-staging \
  --env-file <same-approved-absolute-staging-env> \
  -f docker-compose.staging.yml \
  --profile operations run \
  --pull never \
  --name <fixed-r01-one-shot-name> \
  --no-deps r01-provisioner bootstrap
```

`STAGING_ENV_FILE` 与 `--env-file` 必须指向执行计划冻结的同一个绝对路径；占位符不能原样执行。Compose 即使不启用其他服务，也会先解析完整模型，因此上面的九个文件/image 变量必须全部传入。`pull_policy: never` 与 `run --pull never` 双重禁止隐式拉取；本机缺少冻结镜像时必须停止，不得从 registry 猜测或补拉同名镜像。

首次成功结果必须满足：

- `tool = STAGING_R01_PROVISIONING_OPERATOR`
- `status = PASS`
- `fixtureState = CREATED`
- `aliases.organizationCode = BNBU`
- `aliases.organization = R01-TEST-ORG`
- `counts.managedUsers = 3`
- `counts.adminUsers = 2`
- `counts.teacherUsers = 1`
- `counts.studentUsers = 0`
- `counts.interactiveAccounts = 2`
- `counts.internalSupportAccounts = 1`
- `counts.adminProfiles = 2`
- `counts.teacherProfiles = 1`
- `counts.studentProfiles = 0`
- `counts.reservedStudentProfiles = 0`
- `counts.authSessions = 0`
- `counts.enrollments = 0`
- `studentUsersCreatedByProvisioner = 0`
- `studentProfilesCreatedByProvisioner = 0`
- `authSessionsCreatedByProvisioner = 0`
- `enrollmentsCreatedByProvisioner = 0`
- `phase12OrganizationIsolation = VERIFIED`
- `sensitiveOutput = REDACTED`

上述 counts 必须来自同一 Serializable transaction 内的真实数据库查询，不是静态声明。结果中不得出现登录标识、邮箱、密码、数据库 URL、内部 UUID、Token 或 OTP。失败结果只能包含稳定 failure code；不要为了诊断打印 Secret 文件。若返回 `R01_FIXTURE_RESERVED_STUDENT_CONFLICT`，说明至少一个保留学号已经存在 StudentProfile（包括 soft-deleted 行）；首次初始化或紧邻的幂等复核不能继续标记 READY，也不能删除 Student 数据来强行通过。三个 Student 开始真实建档后再次运行得到该 failure code 是预期的安全边界，不是重跑许可。`R01_FIXTURE_IDENTITY_COUNT_CONFLICT`、`R01_FIXTURE_AUTH_SESSION_CONFLICT`、`R01_FIXTURE_ENROLLMENT_CONFLICT` 分别表示独立 R01 Organization 中存在额外身份、任意会话或任意 Enrollment，也必须停止并保留现场。

## 6. 幂等复核

幂等复核必须紧接首次成功执行，并且发生在任何 Student 真实登录、建档或扫码之前。在确认首个 one-shot 的容器身份、image、mount、exit code、`OOMKilled=false` 和白名单输出后，使用另一个固定容器名重复同一 `bootstrap` 命令。第二次必须满足：

- `status = PASS`
- `fixtureState = VERIFIED`
- `createdComponents = []`
- 两个交互账号和一个内部支撑账号的 count 不变
- Student User、StudentProfile、AuthSession 和 Enrollment 仍全部未由工具创建
- 未修改 Phase 12 fixture

如果第二次产生任何新 component 或返回 conflict，保持现场、停止 R01 开测并定位；不得通过直接 SQL、运行中容器 patch 或改名绕过。

## 7. 完成后的人工检查

1. 使用受控的一对一渠道分别把 Admin / Teacher 实际登录身份发给对应 Tester；团队文档只写别名。
2. Admin / Teacher 分别在 HTTPS Web 完成一次登录和 `/me` 角色核对。
3. Android、iOS、Student Web Tester 各自使用单独分配的受控邮箱请求 SES OTP 并走真实登录/建档流程，确认 Organization code 使用 `BNBU`，并在对应步骤使用各自固定 Student 学号；Operations 不得读取 OTP。
4. Teacher Web 确认只负责 `R01-TEST-SECTION-A`，并在测试窗口生成一个 active 邀请；同一个邀请可供三个不同 Student 使用，但每个 Student 必须取得并使用自己的单次、10 分钟 join capability。
5. 三个 Student 在首次入课前必须仍为 `NOT_ENROLLED`；实际扫码/加入成功后才变为 `ACTIVE`。
6. 只把五个 Tester 别名的状态更新为 `READY / BLOCKED`，不把内部审批身份写入 Tester 矩阵。Student 建档开始后不要再运行 provisioner；保留学号冲突将按设计 fail closed。

## 8. 回退与禁止事项

- 在 transaction 提交前发生错误时，工具整体回滚，不应留下部分拓扑。
- 成功提交后不自动删除任何 User、Profile、Course、ClassSection、ScoreRule、Audit 或其他数据库行；停止使用这些别名就是默认安全回退。
- 若确需清理已提交数据，必须另做影响分析并取得针对数据库删除的精确批准。本 Runbook 不授权清理。
- 不运行 migrator，不执行 down migration，不替换长期 Backend，不修改 Nginx、DNS、TLS、COS、CORS、volume 或安全组。
- 不把 Staging / `TEST_SIGNATURE` 结果表述为 Production 或学校试点就绪。
