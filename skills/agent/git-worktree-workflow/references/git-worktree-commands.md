# Git Worktree 命令参考

## 常用命令

### 创建 worktree

```bash
# 基于已有分支创建 worktree
git worktree add <路径> <已有分支名>

# 创建新分支并关联 worktree
git worktree add <路径> -b <新分支名> [<起点>]

# 基于某个 commit 创建
git worktree add <路径> -b <新分支名> <commit-hash>
```

### 查看 worktree 列表

```bash
# 列出所有 worktree
git worktree list

# 精简输出
git worktree list --porcelain
```

### 删除 worktree

```bash
# 正常删除（worktree 必须是干净的）
git worktree remove <路径>

# 强制删除（即使有未提交更改）
git worktree remove --force <路径>

# 清理已删除目录的 worktree 记录
git worktree prune
```

### 移动 worktree

```bash
git worktree move <源路径> <目标路径>
```

### 锁定/解锁 worktree

```bash
# 锁定（防止自动清理）
git worktree lock <路径>

# 解锁
git worktree unlock <路径>
```

## 合并相关命令

```bash
# 切换到目标分支
git checkout <目标分支>

# 合并 agent 分支
git merge <agent分支名>

# 查看冲突文件
git diff --name-only --diff-filter=U

# 放弃合并（回退冲突状态）
git merge --abort

# 使用 ours 策略解决单个文件冲突
git checkout --ours <文件路径>
git add <文件路径>

# 使用 theirs 策略解决单个文件冲突
git checkout --theirs <文件路径>
git add <文件路径>
```

## 注意事项

- 同一分支不能同时被多个 worktree 检出，否则会报错
- 删除 worktree 目录前应优先使用 `git worktree remove`，而非直接删除文件夹
- 直接删除文件夹后需执行 `git worktree prune` 清理残留记录
- worktree 中的操作（commit、branch）与主仓库共享 .git 数据

## 来源

- [Git 官方文档 - git-worktree](https://git-scm.com/docs/git-worktree)
- [Pro Git - Git Worktree](https://git-scm.com/book/en/v2/Git-Internals-Git-Worktree)
