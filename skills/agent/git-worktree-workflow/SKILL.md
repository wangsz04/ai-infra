---
name: git-worktree-workflow
description: 基于 git worktree 实现多 agent 并行执行任务。当用户提及"并行"、"parallel"、"git worktree"、"同时执行多个任务"、"独立分支执行"等关键词时使用。指导 agent 在独立 worktree 中工作，避免污染当前分支，支持任务完成后合并、冲突处理和 worktree 清理。
license: MIT
compatibility: opencode
metadata:
  version: 1.0.0
  author: wangsz04
---

# Git Worktree 多 Agent 并行工作流

## 概述

本技能指导 agent 使用 `git worktree` 在独立的工作树中并行执行任务，避免在当前 worktree 或分支上直接修改。适用于需要同时推进多个独立任务的场景。

## 前置条件

- 项目必须是一个 git 仓库
- 当前工作区必须是干净的（无未提交更改），否则需先提示用户处理
- 确认 git 版本支持 worktree（git >= 2.5）

## 工作流程

### STEP1: 确认任务与分支信息

- 明确每个 agent 需要执行的任务内容
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

- 每个 agent 使用 `workdir` 参数指定其 worktree 路径执行命令
- **禁止** agent 切换到其他 agent 的 worktree
- **禁止** agent 修改 `.temp/` 目录结构

### STEP5: 任务完成后的合并

合并前**必须**确认用户在 STEP1 中选择的目标分支：

1. 尝试切换到目标分支, 若切换失败则提醒用户
2. 合并 agent 分支：`git merge <agent分支名>`
3. 如果发生冲突，进入 **冲突处理** 流程

### STEP6: 处理 worktree

根据用户在 STEP1 中的选择：

- **删除 worktree**：
  ```bash
  git worktree remove .temp/worktree/<任务标识>
  git branch -d <agent分支名>  # 如已合并可安全删除
  ```
- **保留不动**：不执行任何清理操作

## 冲突处理

当合并时发生冲突：

1. **不要自动解决冲突**，必须报告给用户
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

## 参考资料

- [Git Worktree 命令参考](references/git-worktree-commands.md)
- [并行工作流示例](examples/parallel-workflow-example.md)
