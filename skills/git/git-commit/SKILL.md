---
name: git-commit
description: 基于 Conventional Commits 规范的 Git 提交规范技能，自动检查依赖安装与配置，确保项目遵循统一的提交规范。
metadata:
  version: 1.0.0
  author: wangsz04
---

# Git 提交规范技能

本技能用于为项目配置统一的 Git 提交规范，基于 [Conventional Commits](https://www.conventionalcommits.org/) 规范，结合 commitlint 校验、commitizen 交互式提示和 husky Git 钩子，确保所有提交信息格式一致。

## 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| 类型       | 说明                          |
| ---------- | ----------------------------- |
| `feat`     | 新功能                        |
| `fix`      | 修复缺陷                      |
| `docs`     | 文档变更                      |
| `style`    | 代码格式（不影响功能）        |
| `refactor` | 重构（非新功能、非修复）      |
| `perf`     | 性能优化                      |
| `test`     | 测试相关                      |
| `build`    | 构建系统或外部依赖            |
| `ci`       | CI 配置与脚本                 |
| `chore`    | 其他不修改 src 或 test 的变更 |
| `revert`   | 回退提交                      |

### Scope 范围（可选）

表示影响范围，如模块名、组件名等。例如：`feat(auth): add login support`。

### Subject 主题

简短描述变更内容，不超过 72 个字符，不加句号。

## 依赖检查与安装

使用本技能时，**必须**按以下步骤检查并安装依赖：

- **STEP1**: 检查项目是否为 Git 仓库，若不是则执行 `git init`
- **STEP2**: 检查 `package.json` 是否存在，若不存在则执行 `npm init -y`
- **STEP3**: 检查以下依赖是否已安装在 `devDependencies` 中：
  - `husky` (^9.1.0)
  - `@commitlint/cli` (^20.0.0)
  - `@commitlint/config-conventional` (^20.0.0)
  - `@commitlint/cz-commitlint` (^20.0.0)
  - `commitizen` (^4.3.0)
- **STEP4**: 若依赖缺失，执行安装命令：
  ```bash
  npm install --save-dev husky @commitlint/cli @commitlint/config-conventional @commitlint/cz-commitlint commitizen
  ```
- **STEP5**: 检查 `package.json` 的 `scripts` 中是否包含以下脚本，若缺失则添加：
  ```json
  {
    "cz": "cz",
    "cz:retry": "cz --retry",
    "prepare": "husky"
  }
  ```
- **STEP6**: 若 `prepare` 脚本为新添加，执行 `npm run prepare` 初始化 husky

## 配置文件

以下配置文件**必须**存在于项目根目录，若缺失则从 [assets/](assets/) 目录复制对应模板：

### commitlint 配置

复制 `assets/commitlint.config.js` 到项目根目录。该文件继承 `@commitlint/config-conventional` 规则。

### commitizen 配置

复制 `assets/.czrc` 到项目根目录。该文件指定使用 `@commitlint/cz-commitlint` 适配器，使交互式提示与校验规则保持同步。

## Husky 钩子配置

- **STEP1**: 确认 `.husky/` 目录已由 `npm run prepare` 生成
- **STEP2**: 创建 `commit-msg` 钩子，复制 `assets/commit-msg` 到 `.husky/commit-msg`，用于校验提交信息格式
- **STEP3**: 创建 `prepare-commit-msg` 钩子，复制 `assets/prepare-commit-msg` 到 `.husky/prepare-commit-msg`，用于启动 commitizen 交互式提示
- **STEP4**: 确认钩子文件具有可执行权限（Linux/macOS 下需 `chmod +x`）

### 钩子工作流程

1. 执行 `git commit` 时，`prepare-commit-msg` 钩子触发 commitizen 交互式提示
2. 用户通过交互式提示填写 type、scope、subject 等信息
3. `commit-msg` 钩子触发 commitlint 校验最终提交信息
4. 校验通过则提交成功，校验失败则提交被拒绝

## 提交方式

项目配置完成后，支持以下两种提交方式：

- **交互式提交**：执行 `npm run cz` 或 `npx cz`，通过交互式提示填写提交信息
- **直接提交**：执行 `git commit -m "feat(scope): description"`，提交信息必须符合规范格式，否则会被 commitlint 拒绝

## 参考与示例

- 提交信息示例详见 [examples/commit-examples.md](examples/commit-examples.md)
- Conventional Commits 规范详见 [references/conventional-commits.md](references/conventional-commits.md)
