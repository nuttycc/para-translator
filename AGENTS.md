# Para-Translator 浏览器扩展

## 项目概述

这是一个名为 **Para-Translator** 的浏览器扩展项目，旨在提供段落翻译，解析等功能，其根本目的是帮助用户学习外语，摆脱工具依赖。

该项目使用现代 Web 技术栈构建，主要包括：

- **框架**: [WXT](https://github.com/wxt-dev/wxt) (下一代 Web 扩展开发框架)
- **UI 库**: Vue 3
- **语言**: TypeScript
- **包管理器**: pnpm

项目结构遵循 WXT 框架的最佳实践，将不同的入口（如后台脚本、内容脚本、弹出页面）分离在 `src/entrypoints` 目录下。

## 构建与运行

_当前禁止 Agents 执行构建、运行、打包等任务。_

## 开发约定

- **模块化**: 代码遵循模块化原则，利用 TypeScript 的强类型特性。
- **组件化**: UI 部分使用 Vue 3 单文件组件 (`.vue`) 进行开发，存放于 `src/components` 和 `src/entrypoints`。
- **代码风格**: 项目使用 Prettier 进行代码格式化，并使用 Oxlint 进行代码质量检查。相关配置见 `.prettierrc` 和 `package.json`。
- **配置驱动**: 项目的核心构建和开发行为由 `wxt.config.ts` 文件配置。
- **依赖管理**: 使用 `pnpm` 管理依赖，具体版本锁定在 `pnpm-lock.yaml` 文件中。
