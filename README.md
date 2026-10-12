# pi-astra-context-prune

仅对 `openai-codex/gpt-6-astra` 生效的 Pi 上下文裁剪扩展。旧工具输出由后台摘要替换，完整文本留在会话归档中，可按行和字符游标分页取回。

## 运行方式

- 只裁剪旧工具输出；用户消息、助手回复和工具调用参数保留。
- 最近 2 轮工具结果、技能指令、图片结果和原文回查结果保留。
- 可释放输出累计达到阈值后，摘要模型在后台处理；结果在后续请求边界应用。
- `context_tree_query` 提供局部回查和续读游标，超长单行和 Unicode 内容可完整恢复。
- 切换到其他模型后停止裁剪，并关闭原文回查工具。
- 主模型、推理档位和上下文窗口由 Pi 管理，扩展不修改这些设置。

## 安装

要求 Node.js 24+、Pi 1.1.0+。同一环境只加载一个上下文裁剪扩展。

```bash
pi install git:github.com/jiuai233/pi-astra-context-prune
```

安装后执行 `/reload` 或新开会话，选择 `openai-codex/gpt-6-astra`。

## 配置

配置路径：`<Pi 配置目录>/context-prune/policy-lab.json`。默认 Pi 配置目录为 `~/.pi/agent`；设置 `PI_CODING_AGENT_DIR` 时使用指定目录。

```json
{
  "mode": "budget-summary",
  "triggerTokens": 15000,
  "keepRecentToolTurns": 2,
  "summarizerModel": "opencode-go/deepseek-v4.1-flash",
  "summarizerThinking": "high",
  "summarizerMaxCharsPerResult": 8000
}
```

摘要模型需要在 Pi 中可用且已完成认证。OpenCode 摘要请求会附带会话标识。

`triggerTokens` 是可释放旧输出的累计 token 阈值；`keepRecentToolTurns` 是原样保留的最近工具轮数。`summarizerMaxCharsPerResult` 限制摘要模型看到的每条结果字符数，设为 `0` 时发送完整文本。

缺失或非法配置会提示告警，并使用不调用摘要模型的 `cold-mask` 模式：原文归档后替换为短回执，仍可分页回查。

## 命令

- `/pruner-status`：查看状态。
- `/pruner-pause`：停止新增裁剪，保留已有回查能力。
- `/pruner-resume`：恢复裁剪。
- `/pruner-threshold`：调整当前会话的触发阈值。

## 信息恢复与限制

摘要不保证包含全部细节；归档保存原始工具输出文本。回查工具支持 `toolCallIds`、`offset`、`limit` 和 `charOffset`，每次最多返回 16,000 个 UTF-16 单元的正文，并提供下一页游标。删除会话或离开包含归档的分支后，相关内容无法通过当前分支的索引取回。

模型是否主动回查、是否选择正确片段，取决于模型行为。任务质量需要通过真实业务任务检验。裁剪可能改变前缀缓存，实际 token、费用和延迟需要按真实任务评估。

摘要用量目前记录在插件内部统计中，尚未接入 Pi 的统一用量账本。

## 开发与测试

```bash
npm ci
npm test
```

测试使用模拟摘要供应商和安装依赖的 Responses 转换器，不调用真实模型。`PI_CONTEXT_PRUNE_TEST_AI_DIST` 可指定另一份 Pi 的 `pi-ai/dist` 目录。

`npm run build` 生成 `dist/index.js`；该运行产物随 Git 仓库提交，支持直接从 GitHub 安装。

## 来源与许可

MIT。裁剪内核基于 [championswimmer/pi-context-prune](https://github.com/championswimmer/pi-context-prune) 及 [syansunyang-collab/pi-context-prune](https://github.com/syansunyang-collab/pi-context-prune) 的 `1.6.0-local.12` 源码快照，Astra 专用接线位于 `index.ts`。版权声明见 `LICENSE`，打包依赖许可见 `THIRD_PARTY_LICENSES.txt`。
