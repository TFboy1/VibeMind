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

还有一些问题，你可能还没想到要问：熟悉的做法之外，还有什么值得学？下一步该从哪里开始？

**VibeMind 想帮你把“好像做了很多，却没学到什么”的时刻，变成可以继续积累的学习过程**。它会结合你正在做的项目和任务，陪你理解代码背后的思路，也帮你发现相关的新知识。项目背景、设计决定和学过的内容会留下来，方便你换个项目也能接着学，不必每次从头解释。

VibeMind 不要求你放弃 AI，也不要求你把每个知识点都学透。你可以让 AI 直接实现，也可以随时让它先讲讲，按自己的节奏来。

## VibeMind 能做什么？

- **结合手头项目讲解**：从真实代码和当前任务出发，解释相关概念和实现思路。
- **减少重复讲解**：记住之前解释过哪些内容；熟悉的部分少重复，没讲过的部分仍会补上。
- **下次接着学**：保存项目背景、设计决定和学习记录，让后续的 AI 开发会话更容易衔接。
- **发现新的学习方向**：结合当前项目、学习历史和 roadmap.sh，找到值得进一步了解的知识，走出熟悉的做法。
- **记忆保存在本机**：不需要额外账号、云服务或模型 API。

## 从手头项目出发，走出知识舒适圈

熟悉的技术能帮你快速完成任务。新的问题，也可以成为接触陌生领域的入口。

例如，你刚给接口加上了失败重试。接下来可以顺着这个改动，讨论一个问题：

> 如果请求其实已经成功，只是响应丢了，再试一次会发生什么？

从一次具体改动出发，你就有了理解幂等设计的理由，也有了可以对照的真实代码。

VibeMind 会结合当前任务、已有学习记录和 roadmap.sh 的公开知识路线，寻找相关的基础概念、进阶方向、替代方案与跨领域联系，说明为什么值得探索，以及可以从哪里开始。

你可以随时说：

> 结合这个项目，帮我找几个值得走出舒适圈的学习方向。

每轮最多提供三个方向，由你选择是否继续。你也可以暂缓、跳过或关闭主动提醒，按自己的节奏推进项目。没有学习记录的内容会保持未知，不会据此认定你不会。

## 与类似项目的对比

| 功能 | **VibeMind** | [VibeWise](https://github.com/nykooi1/vibe-wise) | [Learning Opportunities](https://github.com/DrCatHicks/learning-opportunities) |
| --- | :---: | :---: | :---: |
| 结合真实项目学习 | ✓ | ✓ | ✓ |
| 开发者参与设计，AI 按确认的方案实现 | ✓ | ✓ | × |
| **跨项目保存学习记录，换项目也能接着学** | **✓** | × | × |
| **结合学习历史和 roadmap.sh，发现新的学习方向** | **✓** | × | × |
| 提供专门的 10–15 分钟互动练习流程 | × | × | ✓ |

✓ 表示内置支持；× 表示当前公开文档未提供该内置功能，不包含自行扩展的情况。

VibeMind 的教学方式借鉴并改编自 VibeWise，重点增加了**跨项目积累**和**知识边界探索**：让学过的东西接得上，也让下一步值得学什么更清楚。来源与许可见 [NOTICE.md](skills/vibemind/NOTICE.md)。

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
