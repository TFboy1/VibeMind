<div align="center">

<img src="assets/banner.png" alt="VibeMind：用 AI 写代码，也能留下真正学会的东西" width="100%" />

# VibeMind

**用 AI 写代码，也能留下真正学会的东西**

[![Skills.sh](https://img.shields.io/badge/Skills.sh-Install%20VibeMind-00C853?style=for-the-badge&logo=hackthebox&logoColor=white)](https://skills.sh/tfboy1/vibemind/vibemind)
[![GitHub Stars](https://img.shields.io/github/stars/tfboy1/vibemind?style=for-the-badge&logo=github&color=yellow)](https://github.com/TFboy1/VibeMind/stargazers)
[![License](https://img.shields.io/github/license/tfboy1/vibemind?style=for-the-badge&color=blue)](LICENSE)

</div>

AI 帮你把功能做出来了，可你可能还是会想：

> 这段代码为什么这么写？下次不靠 AI，我还会吗？

**VibeMind 想帮你把“好像做了很多，却没学到什么”的时刻，变成可以继续积累的学习过程**。它会结合你正在做的项目和任务，陪你理解代码背后的思路。项目背景、设计决定和学过的内容也会留下来，方便你下次接着学，不必每次从头解释。

VibeMind 不要求你放弃 AI，也不要求你把每个知识点都学透。你可以让 AI 直接实现，也可以随时让它先讲讲，按自己的节奏来。

## VibeMind 能做什么？

- **结合手头项目讲解**：从真实代码和当前任务出发，解释相关概念和实现思路。
- **减少重复讲解**：记住之前解释过哪些内容；熟悉的部分少重复，没讲过的部分仍会补上。
- **下次接着学**：保存项目背景、设计决定和学习记录，让后续的 AI 开发会话更容易衔接。
- **记忆保存在本机**：不需要额外账号、云服务或模型 API。

## 开始使用

需要 Node.js **22.20.0 或更新版本**，以及支持 Agent Skills 的 AI 开发工具。

你也可以直接把这句话发给 AI 助手，让它帮你安装：

> 请帮我在当前项目安装 VibeMind Skill https://github.com/TFboy1/VibeMind，确认安装完成后，再告诉我怎么开始使用。

安装 VibeMind Skill：

```sh
npx skills add TFboy1/VibeMind --skill vibemind --copy
```

进入项目后，告诉 AI 你希望它用 VibeMind 陪你开发。例如：

> 用 VibeMind 陪我开发这个项目。请先看看现有代码和我的想法，再和我讨论怎么实现。

安装 Skill 后，需要在项目里明确调用 VibeMind 才会开始工作。你也可以随时要求它只讨论方案、解释概念、跳过讲解，或按已经确认的方案直接实现。

## 记忆保存在哪里？

VibeMind 使用本机 SQLite 保存学习记录和项目上下文，不需要登录 VibeMind 账号，也不需要把记录上传到云端。你可以在不同项目和会话中接续之前的学习记录；默认共享的是通用学习摘要，敏感项目也可以设为不共享项目间的信息。

## 可选：连接本地 MCP

如果你希望通过 MCP 使用 VibeMind，可以连接本地 MCP 服务。CLI、MCP 配置、记忆保存方式、升级步骤和更多技术说明见[技术说明](docs/TECHNICAL_DETAILS.md)。

## 适合谁？

如果你正在用 AI 写代码，也希望自己逐渐看懂项目、理解设计选择，VibeMind 可以陪你把开发过程中的问题和收获留存下来。

VibeMind 不会自动替你学习，也不会把 AI 写出的代码直接当成你已经掌握的内容。只有实际发生的讲解和应用，才会记录为相应的学习证据。

---

[技术说明与完整使用指南](docs/TECHNICAL_DETAILS.md) · [发现功能说明](skills/vibemind/references/discovery.md) · [学习记录规范](skills/vibemind/references/records.md)
