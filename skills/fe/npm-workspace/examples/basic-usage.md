# npm-workspace 完整示例

## 项目结构

```
my-monorepo/
├── package.json
├── packages/
│   ├── core/
│   │   ├── package.json
│   │   └── src/
│   │       └── index.ts
│   ├── utils/
│   │   ├── package.json
│   │   └── src/
│   │       └── index.ts
│   └── ui/
│       ├── package.json
│       └── src/
│           └── index.tsx
└── tsconfig.json
```

## 根 package.json

```json
{
  "name": "my-monorepo",
  "version": "1.0.0",
  "workspaces": [
    "packages/*"
  ],
  "private": true,
  "scripts": {
    "build": "npm run build -ws",
    "test": "npm run test -ws",
    "clean": "npm run clean -ws",
    "dev": "npm run dev -ws"
  }
}
```

## 子包配置

### packages/utils/package.json

```json
{
  "name": "@my-monorepo/utils",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist"
  }
}
```

### packages/core/package.json

```json
{
  "name": "@my-monorepo/core",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "dependencies": {
    "@my-monorepo/utils": "^1.0.0"
  },
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist"
  }
}
```

### packages/ui/package.json

```json
{
  "name": "@my-monorepo/ui",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "dependencies": {
    "@my-monorepo/utils": "^1.0.0"
  },
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist"
  }
}
```

## 常用命令示例

```bash
# 安装所有依赖
npm install

# 为 core 包添加 lodash 依赖
npm install lodash -w @my-monorepo/core

# 为所有包添加开发依赖
npm install -D typescript -ws

# 构建所有包
npm run build

# 只构建 core 包
npm run build -w @my-monorepo/core

# 查看依赖树
npm ls
```
