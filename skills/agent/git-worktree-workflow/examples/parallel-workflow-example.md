# 并行工作流示例

## 场景：同时实现两个独立功能

用户请求：**"并行执行：1) 添加用户登录功能 2) 添加日志系统"**

### STEP1: 确认信息

```
Agent: 我将为这两个任务创建独立的 worktree 并行执行。请确认：
1. 任务完成后合并到哪个分支？ [main / develop / 当前分支]
2. 任务完成后是否删除 worktree？ [删除 / 保留不动]
```

用户选择：合并到 `main`，完成后删除 worktree。

### STEP2: 创建临时目录

```bash
mkdir -p .temp/worktree
grep -q '.temp/' .gitignore || echo '.temp/' >> .gitignore
```

### STEP3: 创建 worktree

```bash
# 为登录功能创建 worktree
git worktree add .temp/worktree/agent-user-login -b feat/agent-user-login HEAD

# 为日志系统创建 worktree
git worktree add .temp/worktree/agent-logging -b feat/agent-logging HEAD
```

### STEP4: 并行执行

使用 Task 工具并行启动两个子 agent：

```yaml
# Agent A（登录功能）
prompt: "在 worktree 中实现用户登录功能。请提交所有更改。"
workdir: ".temp/worktree/agent-user-login"

# Agent B（日志系统）
prompt: "在 worktree 中实现日志系统功能。请提交所有更改。"
workdir: ".temp/worktree/agent-logging"
```

### STEP5: 启动合并子任务

所有 agent 完成后，启动一个独立的合并子任务（general agent），传递完整上下文：

```
# 合并子任务上下文

## 修改需求
并行执行两个功能：1) 添加用户登录功能 2) 添加日志系统

## Agent 任务汇总
- Agent A: 添加用户登录功能 → 分支: feat/agent-user-login, 状态: 成功, 修改摘要: 新增 src/auth/login.ts
- Agent B: 添加日志系统 → 分支: feat/agent-logging, 状态: 成功, 修改摘要: 新增 src/logger/index.ts

## 合并目标分支
main

## 用户对 worktree 的处理意愿
删除
```

合并子任务按以下顺序操作：

1. 向用户确认："即将把 feat/agent-user-login、feat/agent-logging 合并到 main，是否继续？"
2. 用户确认后，依次合并各分支到 main
3. 遇冲突时按冲突处理流程操作（列出冲突文件，询问用户，按指示解决）
4. 合并完成后报告结果

### STEP6: 提醒用户处理 worktree 和最终分支

合并子任务完成后，主 agent 向用户报告：

```
所有任务已完成并合并到 main 分支，以下是清理建议：
- feat/agent-user-login: git worktree remove .temp/worktree/agent-user-login && git branch -d feat/agent-user-login
- feat/agent-logging: git worktree remove .temp/worktree/agent-logging && git branch -d feat/agent-logging

当前 main 分支已包含登录功能和日志系统的所有代码。
```

## 冲突处理示例

如果合并子任务在合并 `feat/agent-logging` 时发生冲突：

```
子任务: 合并 feat/agent-logging 时发现冲突文件：
  - src/config.ts

冲突内容摘要：
<<<<<< HEAD (main)
export const config = { debug: false };
=======
export const config = { debug: true, level: 'info' };
>>>>>> feat/agent-logging (日志系统)

请选择处理方式：
1. 保留 main 版本 (ours)
2. 保留日志系统版本 (theirs)
3. 手动解决
```

用户选择 theirs 后，子任务执行：

```bash
git checkout --theirs src/config.ts
git add src/config.ts
git commit -m "merge: 合并日志系统功能，解决配置文件冲突"
```
