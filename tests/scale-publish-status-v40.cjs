const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {TextEncoder,TextDecoder}=require('node:util');
(async()=>{
 const nodes=new Map(),handlers={};
 function node(id){if(!nodes.has(id))nodes.set(id,{textContent:'',dataset:{},value:'',addEventListener(type,fn){handlers[id+':'+type]=fn;},focus(){}});return nodes.get(id);}
 const document={querySelector:q=>node(q.slice(1)),addEventListener(){}};
 let current={wolf:1},live=1,repo=1,putPayload=null;
 const script=n=>'(function(root){root.SpartacusPublishedScales=Object.freeze({"wolf":'+n+'});})(window);';
 const window={PracticeScaleProfiles:{BASE:{wolf:1},DEFAULTS:{wolf:1},clamp:n=>Math.max(.65,Math.min(1.85,n)),read:()=>({})},SpartacusScaleStudio:{values:()=>({...current})}};
 const ctx={window,document,TextEncoder,TextDecoder,Uint8Array,console,setTimeout,clearTimeout,Date,atob:s=>Buffer.from(s,'base64').toString('binary'),btoa:s=>Buffer.from(s,'binary').toString('base64'),fetch:async(url,o={})=>{
  if(o.method==='PUT'){putPayload=JSON.parse(o.body);return {ok:true,json:async()=>({commit:{sha:'b'.repeat(40)}})};}
  if(url.startsWith('../'))return {ok:true,text:async()=>script(live)};
  const content=url.includes('ref='+ 'b'.repeat(40))?Buffer.from(putPayload.content,'base64').toString():script(repo);
  return {ok:true,json:async()=>({sha:'a'.repeat(40),content:Buffer.from(content).toString('base64')})};
 }};
 vm.runInNewContext(fs.readFileSync('public/tools/practice-scale-publish.js','utf8'),ctx);
 await new Promise(r=>setImmediate(r));
 assert.equal(node('repoHealth').dataset.state,'ok');assert.equal(node('liveHealth').dataset.state,'ok');
 current={wolf:1.2};await window.SpartacusScalePublisher.verifySaved();assert.equal(node('repoHealth').dataset.state,'warn');assert.equal(node('draftHealth').dataset.state,'warn');
 repo=1.2;await window.SpartacusScalePublisher.verifySaved();assert.match(node('liveHealth').textContent,/배포 대기/);
 live=1.2;await window.SpartacusScalePublisher.verifySaved();assert.equal(node('liveHealth').dataset.state,'ok');
 const payload=window.SpartacusScalePublisher.source();assert.equal(await window.SpartacusScalePublisher.commit('TEST_ONLY',payload),'b'.repeat(40));
 assert.equal(Buffer.from(putPayload.content,'base64').toString(),payload);
 ctx.fetch=async()=>({ok:false,status:401});
 await assert.rejects(window.SpartacusScalePublisher.commit('TEST_ONLY'),/401/);
 await window.SpartacusScalePublisher.verifySaved();assert.equal(node('repoHealth').dataset.state,'error');assert.equal(node('liveHealth').dataset.state,'error');
 assert.throws(()=>window.SpartacusScalePublisher.valuesFrom('alert(1)'),/형식/);
 console.log('PASS: dirty, GitHub saved, deploy pending, deploy verified, readback, auth failure and invalid-source states');
})().catch(e=>{console.error(e);process.exit(1)});
