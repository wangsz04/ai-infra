## ADDED Requirements

### Requirement: 分支检测与发布权限控制
`scripts/release.js` SHALL 检测当前 Git 分支名称，并根据分支决定是否允许发布。
- 当前分支为 `main` 时，SHALL 执行正常发布流程（所有 bump 类型：patch, minor, major, prepatch, preminor, premajor, prerelease）
- 当前分支非 `main` 时，SHALL 拒绝执行并报错退出

#### Scenario: main 分支正常发布
- **WHEN** 当前 Git 分支为 `main`
- **WHEN** 传参为有效 bump 类型
- **THEN** 脚本 SHALL 执行完整的发布流程（npm version → git push --follow-tags）

#### Scenario: 非 main 分支拒绝执行
- **WHEN** 当前 Git 分支非 `main`
- **THEN** 脚本 SHALL NOT 执行 `npm version` 或 `git push`
- **THEN** 脚本 SHALL 输出错误信息并退出
- **THEN** 错误信息 SHALL 提示：当前不在 main 分支，请在 GitHub 上创建 PR 到 main，合并后再发布

### Requirement: 用户提示信息
`release.js` SHALL 在每次执行时输出当前分支信息。

#### Scenario: main 分支提示
- **WHEN** 当前 Git 分支为 `main`
- **THEN** 脚本 SHALL 输出类似 `当前分支: main，正在发布...` 的信息

#### Scenario: 非 main 分支报错
- **WHEN** 当前 Git 分支非 `main`
- **THEN** 脚本 SHALL 输出类似 `错误: 当前分支 <branch> 不是 main 分支，请在 GitHub 上创建 PR 到 main，合并后再发布` 的信息
- **THEN** 脚本 SHALL 以非零状态码退出
