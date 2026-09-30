(function(){
'use strict'; const E=window.Archimedes,$=id=>document.getElementById(id); let last=null;
const PARAMS={coupling:[0,2],learning:[.1,5],diffusion:[0,1],noise:[0,.15],sensorEvery:[1,20]};
function clone(x){return JSON.parse(JSON.stringify(x))}
function score(m){return m.C + .5*m.energy + .25*m.coverage - Math.max(0,m.D) - .5*m.residual}
function applyPolicy(w,p){if(p==='none')return w;if(p==='source')return E.intervene(w,'source');return E.setAction(w,p)}
function trajectory(seed,horizon,shock,policy,delay,params={}){
 let a=E.createWorld(seed,params),b=E.createWorld(seed,params),ta=[],tb=[];
 const shockAt=Math.max(10,Math.floor(horizon*.2));
 for(let t=0;t<horizon;t++){if(t===shockAt){a=E.intervene(a,shock);b=E.intervene(b,shock)}
   if(t===shockAt+delay)b=applyPolicy(b,policy);a=E.step(a,1);b=E.step(b,1);
   if(t%5===0){ta.push(E.metrics(a));tb.push(E.metrics(b))}
 }
 return {a,b,ta,tb,shockAt,metricsA:E.metrics(a),metricsB:E.metrics(b),delta:score(E.metrics(b))-score(E.metrics(a))}
}
function spec(){return {seed:$('seed').value||'OBS-001',horizon:+$('horizon').value,shock:$('shock').value,policy:$('policy').value,delay:+$('delay').value}}
function draw(r){const c=$('chart'),x=c.getContext('2d'),W=c.width,H=c.height;x.clearRect(0,0,W,H);x.strokeStyle='#29414b';for(let i=1;i<5;i++){x.beginPath();x.moveTo(0,i*H/5);x.lineTo(W,i*H/5);x.stroke()}
 const line=(arr,key,color)=>{x.strokeStyle=color;x.lineWidth=2;x.beginPath();arr.forEach((m,i)=>{let xx=i/(arr.length-1)*W,yy=H-(Math.max(0,Math.min(1,m[key]))*H);i?x.lineTo(xx,yy):x.moveTo(xx,yy)});x.stroke()};
 line(r.ta,'C','#6d9295');line(r.tb,'C','#7bc4c5');line(r.ta,'energy','#9a775b');line(r.tb,'energy','#eeb77f');
 x.fillStyle='#9db1ae';x.font='12px monospace';x.fillText('C: gray=A / cyan=B    energy: brown=A / amber=B',12,18)
}
function sensitivity(s,base){
 const rows=[]; for(const k of Object.keys(PARAMS)){let v=E.DEFAULTS[k],lo=PARAMS[k][0],hi=PARAMS[k][1],d=k==='sensorEvery'?1:Math.max((hi-lo)*.08,Math.abs(v)*.12),vm=Math.max(lo,v-d),vp=Math.min(hi,v+d);
   if(k==='sensorEvery'){vm=Math.round(vm);vp=Math.round(vp)} let rm=trajectory(s.seed,s.horizon,s.shock,s.policy,s.delay,{[k]:vm}),rp=trajectory(s.seed,s.horizon,s.shock,s.policy,s.delay,{[k]:vp});
   let effect=(rp.delta-rm.delta)/(vp-vm||1);rows.push({parameter:k,low:vm,high:vp,effect,absolute:Math.abs(effect)})}
 rows.sort((a,b)=>b.absolute-a.absolute);return rows
}
function renderSens(rows){let max=Math.max(...rows.map(r=>r.absolute),1e-9);$('sensitivity').innerHTML=rows.map(r=>'<div class="sens"><span>'+r.parameter+'</span><div class="bar" style="color:'+(r.effect>=0?'#7bc4c5':'#eeb77f')+'"><i style="width:'+(100*r.absolute/max).toFixed(1)+'%"></i></div><span class="mono">'+(r.effect>=0?'+':'')+r.effect.toFixed(3)+'</span></div>').join('')+'<p class="mono">Local finite-difference effect on B−A terminal composite score; ranking is experiment-specific, not a universal EFMW importance ordering.</p>'}
function ledger(s,r){return [
 {tier:'CONFIG',kind:'est',text:'Seed '+s.seed+'; '+s.horizon+' ticks; deterministic paired initialization.'},
 {tier:'SHOCK',kind:'est',text:s.shock+' applied to both twins at tick '+r.shockAt+'.'},
 {tier:'POLICY',kind:'est',text:s.policy+' applied only to B after '+s.delay+' ticks.'},
 {tier:'REFERENCE',kind:'est',text:'Engine field diffusion, bounded motion, energy bookkeeping, seeded RNG and explicit interventions are simulation mechanics.'},
 {tier:'EFMW-HYP',kind:'hyp',text:'Self-model m, coherence C, divergence D, recursive feedback phi, R alignment surrogate and integral I are experimental EFMW-adapted constructs.'},
 {tier:'LIMIT',kind:'hyp',text:'No simulated trajectory constitutes observational evidence for EFMW or a real-world forecast.'}
 ]}
function renderRegistry(){const extra=[...E.REGISTRY,{id:'OBSERVATORY',operation:'Paired interventions, ensembles and local sensitivity',trigger:'Experiment run',status:'Auditable simulation instrument'}];$('registry').innerHTML=extra.map(x=>'<div class="entry"><b>'+x.id+'</b><br><span class="mono">'+x.operation+'</span><br><small>'+x.status+'</small></div>').join('')}
function run(){const s=spec(),r=trajectory(s.seed,s.horizon,s.shock,s.policy,s.delay),sens=sensitivity(s,r);last={format:'archimedes-observatory-experiment',engine:E.VERSION,created:new Date().toISOString(),spec:s,result:{metricsA:r.metricsA,metricsB:r.metricsB,delta:r.delta,shockAt:r.shockAt},sensitivity:sens,ledger:ledger(s,r),checksumA:E.checksum(r.a),checksumB:E.checksum(r.b)};
 draw(r);renderSens(sens);$('summary').innerHTML='<div class="metric"><span>Terminal B−A score</span><b>'+(r.delta>=0?'+':'')+r.delta.toFixed(4)+'</b></div><div class="metric"><span>A regime</span><b>'+r.metricsA.regime+'</b></div><div class="metric"><span>B regime</span><b>'+r.metricsB.regime+'</b></div>';
 $('ledger').innerHTML=last.ledger.map(e=>'<div class="entry"><span class="tag '+e.kind+'">'+e.tier+'</span>'+e.text+'</div>').join('');$('record').textContent=JSON.stringify(last,null,2);return last}
function ensemble(){const s=spec(),vals=[];for(let i=0;i<32;i++)vals.push(trajectory(s.seed+'-'+String(i).padStart(2,'0'),s.horizon,s.shock,s.policy,s.delay).delta);vals.sort((a,b)=>a-b);let mean=vals.reduce((a,b)=>a+b,0)/vals.length;run();last.ensemble={n:32,mean,median:(vals[15]+vals[16])/2,min:vals[0],max:vals[31],values:vals};$('record').textContent=JSON.stringify(last,null,2);$('summary').innerHTML+='<div class="metric"><span>32-seed mean B−A</span><b>'+mean.toFixed(4)+'</b></div>'}
$('run').onclick=run;$('ensemble').onclick=ensemble;$('download').onclick=()=>{if(!last)run();let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(last,null,2)],{type:'application/json'}));a.download='archimedes-observatory-'+last.spec.seed+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};renderRegistry();run();
})();