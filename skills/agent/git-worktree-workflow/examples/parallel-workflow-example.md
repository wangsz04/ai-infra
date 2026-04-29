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

Agent A（登录功能）：
```bash
# 在 .temp/worktree/agent-user-login 中工作
# 使用 workdir 参数指定路径
```

Agent B（日志系统）：
```bash
# 在 .temp/worktree/agent-logging 中工作
# 使用 workdir 参数指定路径
```

### STEP5: 合并代码

```bash
# 切换到目标分支
git checkout main

# 合并第一个任务
git merge feat/agent-user-login

# 合并第二个任务
git merge feat/agent-logging
```

### STEP6: 清理 worktree

```bash
# 删除 worktree
git worktree remove .temp/worktree/agent-user-login
git worktree remove .temp/worktree/agent-logging

# 删除已合并的分支
git branch -d feat/agent-user-login
git branch -d feat/agent-logging
```

## 冲突处理示例

如果合并 `feat/agent-logging` 时发生冲突：

```bash
# 查看冲突文件
git diff --name-only --diff-filter=U
# 输出: src/config.ts

# 报告给用户并询问处理方式
# 假设用户选择 theirs
git checkout --theirs src/config.ts
git add src/config.ts
git commit -m "merge: 合并日志系统功能，解决配置文件冲突"
```
