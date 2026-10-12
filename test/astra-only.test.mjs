import test from 'node:test';
import assert from 'node:assert/strict';
import setup from '../dist/index.js';
function harness() {
  const handlers=new Map(),tools=new Map(),commands=new Map();let active=['read','context_tree_query'];
  setup({on:(n,h)=>handlers.set(n,[...(handlers.get(n)??[]),h]),registerTool:t=>tools.set(t.name,t),registerCommand:(n,c)=>commands.set(n,c),appendEntry(){throw Error('不应写入');},getActiveTools:()=>active,setActiveTools:n=>active=n});
  return {handlers,tools,commands,active:()=>active};
}
const astra={model:{provider:'openai-codex',id:'gpt-6-astra'}};
const sol={model:{provider:'openai-codex',id:'gpt-6.1-sol'}};
test('非 Astra 的五条执行路径不运行裁剪回调',async()=>{
 const h=harness();for(const name of ['context','before_provider_request','message_end','turn_end','agent_end']){
  for(const fn of h.handlers.get(name))assert.equal(await fn({},sol),undefined);
 }
});
test('切换模型时恢复接口只对指定 Astra 开启',()=>{
 const h=harness(),sync=h.handlers.get('model_select').at(-1);
 sync({},sol);assert.deepEqual(h.active(),['read']);
 sync({},astra);assert.deepEqual(h.active(),['read','context_tree_query']);
 sync({},sol);assert.deepEqual(h.active(),['read']);
 sync({},{model:{provider:'radius',id:'gpt-6-astra'}});assert.deepEqual(h.active(),['read']);
});
test('非 Astra 不能通过直接调用恢复接口触发读取',async()=>{
 const h=harness();const result=await h.tools.get('context_tree_query').execute('x',{},null,null,sol);
 assert.equal(result.content[0].text,'此工具仅供 Astra 使用。');
});
test('非 Astra 执行裁剪命令不改变状态',async()=>{
 const h=harness();let note='';await h.commands.get('pruner-pause').handler('',{...sol,ui:{notify:s=>note=s}});
 assert.equal(note,'上下文裁剪仅对 Astra 生效。');
});
