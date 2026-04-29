# Conventional Commits 规范

## 概述

Conventional Commits 是一种用于给提交信息增加人机可读含义的规范，基于 SemVer 规范，在提交信息中描述新增功能、修复缺陷、破坏性变更等。

来源：[Conventional Commits](https://www.conventionalcommits.org/)

## 规范要点

### 提交信息结构

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Type 类型

- `feat`: 新功能（对应 SemVer MINOR）
- `fix`: 修复缺陷（对应 SemVer PATCH）
- 其他类型：`docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore`、`revert`

### 破坏性变更

在 type/scope 后添加 `!` 或在 footer 中使用 `BREAKING CHANGE:` 描述：

```
feat(api)!: remove deprecated endpoints
```

或：

```
feat(api): add new endpoints

BREAKING CHANGE: old endpoints are removed
```

### Scope 范围

可选字段，表示影响范围，使用小括号包裹，如 `feat(auth):`、`fix(api):`。

## 与工具链的关系

- **commitlint**：校验提交信息是否符合规范
- **commitizen**：通过交互式提示引导用户生成规范的提交信息
- **husky**：在 Git 钩子中自动触发校验和提示
- **standard-version / semantic-release**：基于规范自动生成 CHANGELOG 和版本号
