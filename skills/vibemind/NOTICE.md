# 来源与许可

VibeMind 的教学指令借鉴并改编自 Noah Kim 的 [VibeWise](https://github.com/nykooi1/vibe-wise)，尤其是用户参与设计、直接解释概念、区分确认与理解证据、项目地图和未完成决定恢复。项目定位及备份保护的设计也参考了原作。以下原作版权及 MIT 许可随技能包保留。

本项目自行实现了 Node CLI、旧 JSON 迁移、用户级 SQLite 与项目身份、知识卡/概念/别名/学习证据图谱、独立 revision、事务快照和在线备份，以及本地 stdio MCP 入口。CLI、集成代码和测试为本项目编写。MCP 使用官方 SDK，按其 Apache-2.0 许可证分发；VibeMind 由独立维护者维护。

## VibeMind

MIT License

Copyright (c) 2026 nahida1

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## VibeWise

来源：https://github.com/nykooi1/vibe-wise

MIT License

Copyright (c) 2026 Noah Kim

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## roadmap.sh 知识来源与 Learning Opportunities 参考

0.5.0 的全域检索读取 [roadmap.sh](https://roadmap.sh) 的公开主题资料；公开仓库只包含独立实现的接入代码、原创判断规则和来源链接，不分发上游教程、图片或路线图。用户运行时读取及缓存的原始资料仍受 [上游许可](https://github.com/nilbuild/developer-roadmap/blob/master/license) 约束，不因 VibeMind 的 MIT 许可证而获得再分发许可。
任务结束后先邀请再引导、接受与能力证据分离等设计参考 [Learning Opportunities](https://github.com/DrCatHicks/learning-opportunities)，作者为 DrCatHicks 及其贡献者，原作采用 [CC BY 4.0](https://github.com/DrCatHicks/learning-opportunities/blob/main/LICENSE)。VibeMind 独立实现存储、额度及发现机制，未打包原作练习正文；本参考说明不改变原作许可。
