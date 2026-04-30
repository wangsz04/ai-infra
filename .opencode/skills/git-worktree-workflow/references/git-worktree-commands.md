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
# 列出所有 worktree（带 * 标记当前 worktree）
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

### 识别主 worktree

```bash
# 查看当前 worktree 列表，带 * 标记的是当前所在的 worktree
# 主 worktree 通常是列表中的第一个，路径为项目根目录
git worktree list

# 查看当前分支（确认不在主分支上操作）
git branch --show-current
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
# 切换到目标分支（仅在独立 worktree 中操作，不得在主 worktree 执行）
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
- **绝对禁止**在主 worktree（项目根目录）执行 `git checkout`、`git merge`、`git rebase` 等切换/修改分支的操作
- 合并操作应在新创建的独立 worktree 中执行，或在用户明确许可后于主 worktree 执行

## 来源

- [Git 官方文档 - git-worktree](https://git-scm.com/docs/git-worktree)
- [Pro Git - Git Worktree](https://git-scm.com/book/en/v2/Git-Internals-Git-Worktree)
