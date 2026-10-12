import policyLab from './policy-lab.js';

const READ_TOOL = 'context_tree_query';
const scopedEvents = new Set(['context', 'before_provider_request', 'message_end', 'turn_end', 'agent_end']);
const isAstra = (ctx) => ctx.model?.provider === 'openai-codex' && ctx.model?.id === 'gpt-6-astra';

export default function astraPruner(pi) {
  policyLab({
    ...pi,
    on(event, handler) {
      pi.on(event, scopedEvents.has(event)
        ? (message, ctx) => isAstra(ctx) ? handler(message, ctx) : undefined
        : handler);
    },
    registerTool(tool) {
      pi.registerTool({
        ...tool,
        execute: (id, args, signal, onUpdate, ctx) => isAstra(ctx)
          ? tool.execute(id, args, signal, onUpdate, ctx)
          : { content: [{ type: 'text', text: '此工具仅供 Astra 使用。' }], details: {} },
      });
    },
    registerCommand(name, command) {
      pi.registerCommand(name, {
        ...command,
        handler: (args, ctx) => isAstra(ctx)
          ? command.handler(args, ctx)
          : ctx.ui.notify('上下文裁剪仅对 Astra 生效。', 'info'),
      });
    },
  });

  const syncReadTool = (_event, ctx) => {
    const active = pi.getActiveTools();
    if (isAstra(ctx) && !active.includes(READ_TOOL)) pi.setActiveTools([...active, READ_TOOL]);
    if (!isAstra(ctx) && active.includes(READ_TOOL)) pi.setActiveTools(active.filter(name => name !== READ_TOOL));
  };
  pi.on('session_start', syncReadTool);
  pi.on('model_select', syncReadTool);
}
