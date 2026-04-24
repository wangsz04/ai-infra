---
name: npm-workspace
description: npm workspace技能，详解monorepo项目管理，包含工作区配置、依赖管理、常用命令及最佳实践，适用于多包项目管理场景。
metadata:
  version: 1.0.0
  author: ai-infra
---

# npm-workspace

npm workspace 是 npm 7+ 引入的原生 monorepo 解决方案，用于在单个根目录 下管理多个子包。

## 核心概念

### 工作区结构

```
my-monorepo/
├── package.json          # 根workspace配置
├── packages/
│   ├── pkg1/
│   │   └── package.json
│   └── pkg2/
│       └── package.json
└── node_modules/         # 自动提升的依赖
```

### 根 package.json 配置

```json
{
  "name": "my-monorepo",
  "workspaces": [
    "packages/*"
  ],
  "private": true
}
```

- `workspaces`: 数组，支持 glob 模式（如 `packages/*`、`packages/@*`）
- `private`: 根包建议设为 `true`，防止意外发布

## 依赖管理

### 添加依赖

```bash
# 为指定工作区添加依赖
npm install lodash -w packages/pkg1

# 为所有工作区添加依赖
npm install lodash -ws

# 为开发依赖添加
npm install -D typescript -w packages/pkg1
```

### 依赖提升规则

- npm 会自动将所有工作区的依赖提升到根目录 `node_modules`
- 同一依赖只保留最高版本，避免重复安装
- 可通过 `npm ls <pkg>` 查看依赖树

### 链接本地包

工作区内的包可以直接相互引用，npm 会自动链接：

```json
// packages/pkg2/package.json
{
  "dependencies": {
    "pkg1": "^1.0.0"
  }
}
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm install` | 安装所有工作区依赖 |
| `npm install -w <pkg>` | 为指定工作区安装 |
| `npm install -ws` | 为所有工作区安装 |
| `npm run -w <pkg> <script>` | 在指定工作区运行脚本 |
| `npm run -ws` | 在所有工作区运行脚本 |
| `npm ls` | 查看依赖树 |
| `npm clean -w <pkg>` | 清理指定工作区 |

## 脚本执行

### 单工作区执行

```bash
npm run build -w packages/pkg1
npm test -w packages/pkg1
```

### 批量执行

```bash
# 所有工作区并行执行
npm run build -ws

# 过滤执行（需 npm 8+）
npm run build -ws --workspace=packages/pkg1
```

## 最佳实践

### 1. 依赖管理

- 共享依赖放在根目录，减少安装时间和磁盘占用
- 避免在不同工作区安装同一依赖的不同版本
- 使用 `-w` 明确指定目标工作区

### 2. 脚本设计

```json
// 根package.json
{
  "scripts": {
    "build": "npm run build -ws",
    "test": "npm run test -ws",
    "clean": "npm run clean -ws"
  }
}
```

### 3. 发布配置

```json
// packages/pkg1/package.json
{
  "publishConfig": {
    "access": "public",
    "registry": "https://npm.example.com"
  }
}
```

### 4. 类型定义

- 共享类型应放在独立的工作区（如 `@my-org/types`）
- 避免循环依赖

## 常见问题

### Q: 如何排除某个目录不作为工作区？

在对应目录的 package.json 添加 `"private": true` 和空数组 workspaces 即可。

### Q: 如何查看工作区列表？

```bash
npm query ':root > workspace'
```

## 参考资料

- [npm workspaces 官方文档](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [npm workspaces 博客介绍](https://github.blog/2021-07-27-npm-workspaces-redux/)
