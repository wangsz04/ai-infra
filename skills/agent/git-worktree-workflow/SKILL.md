---
name: git-worktree-workflow
description: 基于 git worktree 实现多任务并行处理的工作流方案, 以实现任务隔离，避免分支污染。支持任务完成后合并、代码冲突处理与git worktree 清理等操作。当用户提及"并行任务"、"基于git worktree并行完成", "git worktree", "parallel"、"同时执行多个任务"、"独立分支执行"等关键词时使用。
license: MIT
compatibility: opencode
metadata:
  version: 1.1.0
  author: wangsz04
---

# Git Worktree 多 Agent 并行工作流

## 概述

本技能指导 agent 使用 `git worktree` 在独立的工作树中并行执行任务，避免在当前 worktree 或分支上直接修改。适用于需要同时推进多个独立任务的场景。

## 前置条件

- 项目必须是一个 git 仓库
- 当前工作区必须是干净的（无未提交更改），否则需先提示用户处理
- 确认 git 版本支持 worktree（git >= 2.5）

## 核心约束

以下约束**必须**严格遵守，不可违反：

- **绝对禁止**修改当前主 worktree 所在分支及任何代码。主 worktree 是用户当前工作目录，任何对主分支的 checkout、merge、rebase 等操作均**不得**执行，除非用户**明确**指令
- **绝对禁止**在未经用户明确授权的情况下，对主 worktree 执行任何写入操作（包括但不限于 `git checkout`、`git merge`、`git rebase`、文件修改）
- 所有并行任务的代码修改**必须**在 `.temp/worktree/` 下的独立 worktree 中完成
- 需要在某个目标分支上执行合并操作时，**必须**先向用户确认，得到明确许可后方可执行

## 工作流程

### STEP1: 确认任务与分支信息

- 明确每个 agent 需要执行的任务内容，记录下来以便后续传递给合并子任务
- **必须**询问用户：任务完成后代码合并到哪个目标分支（主分支/当前分支/其他分支）
- **必须**询问用户：任务完成后如何处理 worktree（删除/保留不动）

### STEP2: 创建临时 worktree 目录

- 在项目根目录下创建 `.temp/worktree/` 目录用于存放临时 worktree
- 确保 `.gitignore` 中包含 `.temp/` 规则，避免提交到仓库

```bash
# 确保临时目录存在
mkdir -p .temp/worktree
# 确保 .gitignore 包含忽略规则
grep -q '.temp/' .gitignore || echo '.temp/' >> .gitignore
```

### STEP3: 为每个 agent 创建 worktree

为每个并行任务创建独立的 worktree 和分支：

```bash
# 语法: git worktree add <路径> -b <新分支名> [<基于的分支/commit>]
# 示例: 基于当前 HEAD 创建
git worktree add .temp/worktree/agent-task-1 -b feat/agent-task-1 HEAD
```

命名规范：

- worktree 目录：`.temp/worktree/<任务标识>`
- 分支名：`feat/agent-<任务标识>` 或 `fix/agent-<任务标识>`

### STEP4: 在各 worktree 中并行执行任务

- 使用 Task 工具并行启动多个 agent，每个 agent 使用 `workdir` 参数指定其 worktree 路径
- **禁止** agent 切换到其他 agent 的 worktree
- **禁止** agent 修改当前主 worktree（项目根目录）的任何文件
- 每个 agent 完成任务后**必须**在其 worktree 中提交代码
- 收集所有 agent 的执行结果（成功/失败、修改摘要、分支名）

### STEP5: 启动合并子任务

所有并行 agent 完成后，**启动一个独立子任务**负责合并和冲突处理：

使用 Task 工具启动一个 `general` 子 agent，将以下信息完整传递给子任务：

```
# 传递给合并子任务的上下文

## 本次修改需求（原始任务描述）
<用户原始需求描述，包含每个 agent 的具体任务内容>

## Agent 任务汇总
- Agent 1: <任务描述> → 分支: <分支名>, 状态: <成功/失败>, 修改摘要: <摘要>
- Agent 2: <任务描述> → 分支: <分支名>, 状态: <成功/失败>, 修改摘要: <摘要>
- ...

## 合并目标分支
<用户在 STEP1 中指定的目标分支>

## 用户对 worktree 的处理意愿
<删除/保留不动>
```

子任务 agent 负责执行以下操作（按顺序）：

1. **合并前确认**：向用户确认"即将把以下 agent 分支合并到目标分支 `<目标分支>`，是否继续？"
2. 依次合每个 agent 分支到目标分支
3. 如发生冲突，按 **冲突处理** 流程操作（不得自动解决，必须报告用户）
4. 合并完成后报告结果

**注意**：子任务不得主动操作主 worktree / 目标分支的 checkout，应先确认用户意图后再操作。

### STEP6: 提醒用户处理 worktree 和最终分支

合并子任务完成后，**必须**向用户总结并提醒：

- 列出所有 worktree 及其分支、目录路径
- 根据用户在 STEP1 中的选择，提醒用户处理 worktree：

  - **删除 worktree**：
    ```bash
    git worktree remove .temp/worktree/<任务标识>
    git branch -d <agent分支名>  # 如已合并可安全删除
    ```
  - **保留不动**：不执行任何清理操作

- 提醒用户当前已合并后的目标分支状态
- 如有任何失败的 agent 任务，列出并建议用户决定处理方式

## 冲突处理

合并子任务在合并时若发生冲突，按以下流程处理：

1. **不得自动解决冲突**，必须报告给用户
2. 列出冲突文件列表：`git diff --name-only --diff-filter=U`
3. 展示冲突内容摘要
4. **必须**询问用户如何处理每个冲突：
   - 保留当前分支的版本（ours）
   - 保留 agent 分支的版本（theirs）
   - 手动解决（由用户编辑）
5. 解决所有冲突后完成合并提交

## 注意事项

- worktree 路径**必须**在 `.temp/worktree/` 下，**不得**超出项目根目录
- 同一分支不能同时被多个 worktree 检出
- 创建 worktree 前检查是否已存在同名目录或分支
- 如果任务失败，需提示用户决定是否清理对应的 worktree
- agent 在 worktree 中完成任务后应提交代码，再进行合并
- **绝对禁止** agent 修改当前主 worktree 所在分支或任何代码，所有需要操作主分支的场景必须由用户明确决定
- 合并子任务执行前**必须**获得用户对操作目标分支的明确许可

## 参考资料

- [Git Worktree 命令参考](references/git-worktree-commands.md)
- [并行工作流示例](examples/parallel-workflow-example.md)
