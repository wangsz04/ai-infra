---
name: npm-workspace
description: 用于创建和管理npm workspace的技能，将子包放在packages/目录下，并在根包package.json中引用子包的重要scripts（构建、开发服务、执行命令等）
---

# npm-workspace

## 概述

npm workspace 是 npm 7+ 提供的特性，允许在单个根包下管理多个子包。

## 目录结构

```
project/
├── packages/              # 所有子包放在此目录
│   ├── pkg-a/
│   │   └── package.json
│   └── pkg-b/
│       └── package.json
├── package.json           # 根包，引用子包scripts
└── ...
```

## 初始化

### 1. 创建根包

```json
{
  "name": "my-workspace",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "npm run dev --workspaces",
    "build": "npm run build --workspaces"
  }
}
```

### 2. 创建子包

```json
{
  "name": "@my-workspace/pkg-a",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build"
  }
}
```

## 引用子包 Scripts

根包通过 `npm run <script> --workspaces` 或 `npm run <script> --workspace=<pkg>` 执行子包命令：

| 根包命令 | 子包执行 |
|---------|---------|
| `npm run dev --workspaces` | 所有子包执行 dev |
| `npm run dev --workspace=@my-workspace/pkg-a` | 仅 pkg-a 执行 dev |

## 常用命令

```bash
# 安装依赖（自动链接workspace）
npm install

# 所有子包执行命令
npm run <script> --workspaces

# 指定子包执行命令
npm run <script> --workspace=@my-workspace/pkg-a

# 添加依赖到指定子包
npm install <pkg> -w @my-workspace/pkg-a
```

## 示例

### 根 package.json

```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "npm run dev --workspaces",
    "build": "npm run build --workspaces",
    "clean": "npm run clean --workspaces",
    "lint": "npm run lint --workspaces"
  }
}
```

### 子包 package.json (pkg-a)

```json
{
  "name": "@my-monorepo/pkg-a",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite --port 3001",
    "build": "tsc && vite build",
    "clean": "rm -rf dist",
    "lint": "eslint src"
  },
  "dependencies": {
    "vue": "^3.4.0"
  }
}
```

### 子包 package.json (pkg-b)

```json
{
  "name": "@my-monorepo/pkg-b",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite --port 3002",
    "build": "tsc && vite build",
    "clean": "rm -rf dist",
    "lint": "eslint src"
  },
  "dependencies": {
    "react": "^18.2.0"
  }
}
```

## 依赖提升

默认情况下，workspace 的依赖会提升到根目录的 `node_modules`。如需单独安装，可使用 `-w` flag：

```bash
npm install -w @my-monorepo/pkg-a <package>
```
