(function () {
  'use strict';
  const E = window.Archimedes, $ = id => document.getElementById(id);
  const KEY = 'monolithic.archimedes.v0.1';
  let session = E.createSession('ARCHIMEDES-001'), running = false, forecast = null, selected = null;
  let journalView = 'events', last = 0, accumulator = 0, historyKey = '', toastTimer;
  const colors = ['#6cbfc2', '#eeb77f'];
  const node = (tag, text, className) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; };
  function toast(message) { $('toast').textContent = message; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4000); }
  function save() {
    try { localStorage.setItem(KEY, E.exportSession(session)); $('storage-state').textContent = 'Saved on this device'; }
    catch { $('storage-state').textContent = 'Use Export to save'; }
  }
  try { const saved = localStorage.getItem(KEY); if (saved) session = E.importSession(saved); }
  catch { toast('Saved session could not be restored. A new world is ready.'); }
  function setRunning(value) {
    running = value; accumulator = 0; last = performance.now();
    $('play').textContent = value ? 'Ⅱ Pause world' : '▶ Run world';
    $('run-status').textContent = value ? 'Running' : 'Paused'; $('status-dot').classList.toggle('running', value);
  }
  function clearForecast() {
    forecast = null; selected = null; $('future-empty').hidden = false; $('future-results').hidden = true;
    $('branch-count').textContent = 'READY TO EXPLORE'; $('janus-result').hidden = true;
  }
  function checkpoint(label) { session = E.checkpoint(session, label); save(); }
  function syncControls() {
    const w = session.world; $('seed').value = w.seed; $('goal').value = w.goal; $('intention').value = w.action; $('note').value = w.player.note;
    for (const k of ['coupling', 'learning', 'noise']) { $(k).value = w.params[k]; $(`${k}-value`).textContent = w.params[k].toFixed(k === 'noise' ? 3 : 2); }
  }
  function drawWorld() {
    const canvas = $('world'), rect = canvas.getBoundingClientRect(); if (!rect.width) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2), width = Math.round(rect.width * ratio), height = Math.round(rect.height * ratio);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    const c = canvas.getContext('2d'); c.setTransform(ratio, 0, 0, ratio, 0, 0);
    const cw = rect.width, ch = rect.height, pad = cw * 0.07, sx = (cw - 2 * pad) / E.W, sy = (ch - 2 * pad) / E.H;
    const px = x => pad + x * sx, py = y => pad + y * sy, w = session.world;
    c.fillStyle = '#101d25'; c.fillRect(0, 0, cw, ch);
    if ($('field-visible').checked) for (let y = 0; y < E.H; y++) for (let x = 0; x < E.W; x++) {
      const f = w.field[y * E.W + x]; c.fillStyle = `rgba(81,169,151,${0.015 + f * 0.27})`; c.fillRect(px(x), py(y), sx + 0.5, sy + 0.5);
      if (f > 0.16) { c.beginPath(); c.fillStyle = `rgba(124,198,166,${f * 0.35})`; c.arc(px(x + 0.5), py(y + 0.5), 0.6 + f * 1.2, 0, Math.PI * 2); c.fill(); }
    }
    c.strokeStyle = '#29404966'; c.lineWidth = 0.5;
    for (let x = 0; x <= E.W; x++) { c.beginPath(); c.moveTo(px(x), py(0)); c.lineTo(px(x), py(E.H)); c.stroke(); }
    for (let y = 0; y <= E.H; y++) { c.beginPath(); c.moveTo(px(0), py(y)); c.lineTo(px(E.W), py(y)); c.stroke(); }
    c.strokeStyle = '#66837d'; c.lineWidth = 1; c.strokeRect(px(0), py(0), E.W * sx, E.H * sy);
    c.strokeStyle = '#bedcbe'; c.lineWidth = 2;
    for (const [x, y, dx, dy] of [[0, 0, 1, 1], [24, 0, -1, 1], [0, 16, 1, -1], [24, 16, -1, -1]]) {
      c.beginPath(); c.moveTo(px(x), py(y + 0.6 * dy)); c.lineTo(px(x), py(y)); c.lineTo(px(x + 0.6 * dx), py(y)); c.stroke();
    }
    c.font = `${Math.max(6, cw / 100)}px ui-monospace,monospace`; c.fillStyle = '#678089'; c.textAlign = 'center';
    for (let x = 0; x <= 24; x += 4) c.fillText(String(x).padStart(2, '0'), px(x), py(0) - 10);
    for (let y = 0; y <= 16; y += 4) c.fillText(String(y).padStart(2, '0'), px(0) - 14, py(y) + 2);
    for (const o of E.OBJECTS) {
      const x = px(o.x), y = py(o.y), r = o.r * sx;
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
      if (o.kind === 'solid') { c.fillStyle = '#263741'; c.fill(); c.strokeStyle = '#4b5e68'; c.stroke();
        c.beginPath(); c.moveTo(x - r * 0.5, y - r * 0.5); c.lineTo(x + r * 0.5, y + r * 0.5); c.moveTo(x + r * 0.5, y - r * 0.5); c.lineTo(x - r * 0.5, y + r * 0.5); c.stroke(); continue; }
      c.strokeStyle = o.id === 'source' && !w.sourceOn ? '#8b6961' : '#a4c7aa'; c.fillStyle = '#172e30'; c.fill(); c.stroke();
      c.beginPath(); c.arc(x, y, r * 0.55, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(x - r - 3, y); c.lineTo(x + r + 3, y); c.moveTo(x, y - r - 3); c.lineTo(x, y + r + 3); c.stroke();
      c.fillStyle = '#a8bab9'; c.font = `${Math.max(6, cw / 85)}px ui-monospace,monospace`; c.fillText(o.id.toUpperCase(), x, y + r + 15);
    }
    w.agents.forEach((a, i) => {
      const color = colors[i]; c.strokeStyle = color + '65'; c.lineWidth = 1.5; c.beginPath();
      a.trail.forEach((p, j) => j ? c.lineTo(px(p[0]), py(p[1])) : c.moveTo(px(p[0]), py(p[1]))); c.stroke();
      const t = E.target(w, a); c.strokeStyle = color + '55'; c.setLineDash([2, 5]); c.beginPath(); c.moveTo(px(a.x), py(a.y)); c.lineTo(px(t.x), py(t.y)); c.stroke(); c.setLineDash([]);
      if ($('belief-visible').checked) {
        const mx = px(a.m[0] * E.W), my = py(a.m[1] * E.H); c.strokeStyle = color + 'a0'; c.setLineDash([3, 3]);
        c.beginPath(); c.arc(mx, my, 11, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
      }
      if (forecast) {
        const alternative = forecast.alternatives.find(n => n.action === selected), pos = alternative?.positions[i];
        if (pos) { c.strokeStyle = color + '90'; c.lineWidth = 1; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(px(a.x), py(a.y)); c.lineTo(px(pos[0]), py(pos[1])); c.stroke(); c.strokeRect(px(pos[0]) - 5, py(pos[1]) - 5, 10, 10); c.setLineDash([]); }
      }
      const x = px(a.x), y = py(a.y); c.fillStyle = color + '18'; c.beginPath(); c.arc(x, y, 15, 0, Math.PI * 2); c.fill();
      c.fillStyle = color; c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill();
      c.strokeStyle = color; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 8, -Math.PI / 2, -Math.PI / 2 + a.energy * 2 * Math.PI); c.stroke();
      c.fillStyle = color; c.textAlign = 'left'; c.font = `${Math.max(7, cw / 78)}px ui-monospace,monospace`; c.fillText(a.name, x + 13, y - 9);
      c.textAlign = 'center';
    });
    if (w.blackout) { c.fillStyle = '#eeb77f'; c.font = `${Math.max(7, cw / 80)}px ui-monospace,monospace`; c.fillText(`SENSOR BLACKOUT / ${(w.blackout * E.DT).toFixed(1)}s`, cw / 2, py(0) + 20); }
  }
  function drawChart() {
    const traces = session.world.traces, path = (key, scale) => traces.map((t, i) => `${i ? 'L' : 'M'}${(i / Math.max(1, traces.length - 1) * 240).toFixed(1)},${(60 - Math.min(1, t[key] / scale) * 50).toFixed(1)}`).join(' ');
    $('chart').innerHTML = `<svg viewBox="0 0 240 70" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 10H240 M0 35H240 M0 60H240" stroke="#31414a" stroke-width=".5"/><path d="${path('C', 1)}" fill="none" stroke="#c7e7c4" stroke-width="1.4"/><path d="${path('phi', 1.5)}" fill="none" stroke="#eeb77f" stroke-width="1.2"/></svg>`;
  }
  function renderAgents() {
    $('agents').replaceChildren();
    for (const a of session.world.agents) {
      const card = node('div', undefined, 'agent'), head = node('div', undefined, 'agent-head');
      head.append(node('span', '', 'agent-dot'), node('span', a.name, 'agent-name'), node('span', `${Math.round(a.energy * 100)}% energy`, 'muted')); card.append(head);
      for (const [label, value] of [['Position', `${a.x.toFixed(1)}, ${a.y.toFixed(1)}`], ['Self-model C', a.C.toFixed(4)], ['Last field reading', `${((session.world.tick - a.lastSeen) * E.DT).toFixed(1)}s ago`]]) {
        const row = node('div', undefined, 'agent-row'); row.append(node('span', label), node('b', value)); card.append(row);
      }
      const bar = node('div', undefined, 'energy-bar'), fill = node('span'); fill.style.width = `${a.energy * 100}%`; bar.append(fill); card.append(bar); $('agents').append(card);
    }
  }
  function renderJournal() {
    $('journal').replaceChildren();
    const items = journalView === 'events' ? session.world.events.slice(-12).reverse() : session.world.evidence.slice(-12).reverse();
    if (!items.length) $('journal').append(node('p', 'Field samples arrive every 0.5 simulation seconds.', 'micro'));
    for (const e of items) {
      const item = node('div', undefined, 'log-entry');
      const text = journalView === 'events' ? e.text : `${['ADA', 'NOETHER'][e.agent]} · field ${e.value.toFixed(4)} · simulated`;
      item.append(node('time', `${(e.tick * E.DT).toFixed(1)}s`), node('span', text)); $('journal').append(item);
    }
  }
  function renderHistory() {
    const key = `${session.nextId}:${session.cursor}`; if (key === historyKey) return; historyKey = key;
    $('history').replaceChildren(); $('history-count').textContent = `${session.history.length} CHECKPOINT${session.history.length === 1 ? '' : 'S'}`;
    for (const h of session.history) {
      const b = node('button', `#${String(h.id).padStart(2, '0')}`, `history-node${h.id === session.cursor ? ' current' : ''}`);
      b.append(node('strong', `${(h.world.tick * E.DT).toFixed(1)}s`), node('small', h.label)); b.title = `${h.label}; parent ${h.parent ?? 'root'}`;
      b.setAttribute('aria-label', `Restore checkpoint ${h.id}, ${h.label}, time ${(h.world.tick * E.DT).toFixed(1)} seconds`);
      b.onclick = () => { setRunning(false); session = E.restore(session, h.id); clearForecast(); syncControls(); save(); render(); toast(`Restored checkpoint #${h.id}. The next change will branch here.`); };
      $('history').append(b);
    }
    const active = $('history').querySelector('.current'); if (active) $('history').scrollLeft = Math.max(0, active.offsetLeft - $('history').offsetLeft - $('history').clientWidth + 130);
  }
  function render() {
    const w = session.world, m = E.metrics(w);
    $('clock').textContent = `t = ${m.time.toFixed(1)} s`; $('regime').textContent = m.regime.toUpperCase();
    $('metric-c').textContent = m.C.toFixed(3); $('metric-phi').textContent = m.phi.toFixed(3); $('metric-d').textContent = m.D.toFixed(3); $('metric-coverage').textContent = `${(100 * m.coverage).toFixed(1)}%`;
    $('alarm').classList.toggle('warning', m.alarm); $('alarm').textContent = m.alarm ? 'Demo monitor threshold crossed' : 'Monitor within demo thresholds';
    $('source-label').textContent = w.sourceOn ? 'Switch source off' : 'Switch source on';
    drawWorld(); drawChart(); renderAgents(); renderJournal(); renderHistory();
  }
  function drawTree() {
    const f = forecast, positions = new Map([[0, [300, 8]]]), width = 600, height = 130;
    for (let level = 1; level <= f.depth; level++) {
      const nodes = f.nodes.filter(n => n.level === level);
      nodes.forEach((n, i) => positions.set(n.id, [(i + 0.5) / nodes.length * width, 8 + level * 110 / f.depth]));
    }
    let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${f.evaluated} evaluated future branches. Highlighted path ${f.sequence.join(', ')}.">`;
    for (const n of f.nodes) {
      const p = positions.get(n.parent), q = positions.get(n.id), best = f.path.includes(n.id);
      svg += `<path d="M${p[0]} ${p[1]}C${p[0]} ${(p[1] + q[1]) / 2},${q[0]} ${(p[1] + q[1]) / 2},${q[0]} ${q[1]}" stroke="${best ? '#c7e7c4' : '#3a515b'}" stroke-width="${best ? 1.8 : 0.8}" fill="none"/><circle cx="${q[0]}" cy="${q[1]}" r="${best ? 4 : 2.4}" fill="${best ? '#c7e7c4' : '#66818a'}"><title>${n.action}: ${n.score.toFixed(3)}</title></circle>`;
    }
    svg += '<circle cx="300" cy="8" r="4" fill="#eeb77f"/></svg>'; $('tree').innerHTML = svg;
  }
  function renderForecast() {
    $('future-empty').hidden = true; $('future-results').hidden = false;
    $('branch-count').textContent = `${forecast.evaluated} BRANCHES / ${forecast.depth} LEVELS`;
    drawTree(); $('alternatives').replaceChildren();
    for (const n of forecast.alternatives) {
      const b = node('button', n.action.toUpperCase(), `alternative${selected === n.action ? ' selected' : ''}`);
      b.append(node('strong', n.score.toFixed(3)), node('small', `${(n.metrics.coverage * 100).toFixed(1)}% visited · 2s`));
      b.setAttribute('aria-label', `Select ${n.action}, first-level score ${n.score.toFixed(3)}`);
      b.onclick = () => { selected = n.action; renderForecast(); drawWorld(); }; $('alternatives').append(b);
    }
    $('sequence').textContent = selected === forecast.sequence[0] ? `Best path: ${forecast.sequence.join(' → ')} · J = ${forecast.score.toFixed(3)}` : `Selected: ${selected}. Cards show first-level scores; tree shows the best full path.`;
  }
  function explore() {
    setRunning(false); $('explore').disabled = true; $('explore').textContent = 'Exploring…';
    setTimeout(() => {
      try { forecast = E.plan(session.world, { depth: Number($('depth').value) }); selected = forecast.sequence[0]; renderForecast(); drawWorld(); }
      catch (e) { toast(e.message); }
      finally { $('explore').disabled = false; $('explore').textContent = 'Explore possible futures ↗'; }
    }, 20);
  }
  $('play').onclick = () => { if (!running) clearForecast(); setRunning(!running); if (!running) save(); };
  $('step').onclick = () => { setRunning(false); clearForecast(); session.world = E.step(session.world); checkpoint('Single step'); render(); };
  $('explore').onclick = explore; $('explore-inline').onclick = explore;
  $('apply').onclick = () => {
    if (!forecast || forecast.originChecksum !== E.checksum(session.world)) { clearForecast(); toast('The world changed. Explore again before applying.'); return; }
    session.world = E.setAction(session.world, selected); checkpoint(`Chose ${selected}`); clearForecast(); syncControls(); render(); toast('Intention applied. Run the world to observe its consequences.');
  };
  $('reset').onclick = () => {
    try { const next = E.createSession($('seed').value.trim(), session.world.params); setRunning(false); session = next; historyKey = ''; clearForecast(); syncControls(); save(); render(); toast('New seeded world ready.'); }
    catch (e) { toast(e.message); }
  };
  $('goal').onchange = () => { session.world.goal = $('goal').value; clearForecast(); checkpoint(`Objective: ${session.world.goal}`); render(); };
  $('intention').onchange = () => { session.world = E.setAction(session.world, $('intention').value); clearForecast(); checkpoint(`Intention: ${session.world.action}`); render(); };
  $('depth').oninput = () => { $('depth-value').textContent = $('depth').value; clearForecast(); };
  for (const k of ['coupling', 'learning', 'noise']) {
    $(k).oninput = () => { $(`${k}-value`).textContent = Number($(k).value).toFixed(k === 'noise' ? 3 : 2); };
    $(k).onchange = () => { session.world.params = E.parameters({ ...session.world.params, [k]: Number($(k).value) }); clearForecast(); checkpoint(`Parameter: ${k}`); render(); };
  }
  document.querySelectorAll('[data-intervene]').forEach(b => b.onclick = () => { session.world = E.intervene(session.world, b.dataset.intervene); clearForecast(); checkpoint(`Intervention: ${b.dataset.intervene}`); render(); });
  $('checkpoint').onclick = () => { checkpoint('Manual checkpoint'); render(); toast('Checkpoint saved.'); };
  $('janus').onclick = () => {
    setRunning(false); const result = E.counterfactual(session.world); $('janus-result').hidden = false;
    $('janus-result').textContent = `JANUS · After 8s: current source state → ${(result.factual.energy * 100).toFixed(1)}% mean energy; opposite source state → ${(result.counterfactual.energy * 100).toFixed(1)}%. Coherence ${result.factual.C.toFixed(3)} vs ${result.counterfactual.C.toFixed(3)}. Same initial state and random stream. Both are simulated; the live world is unchanged.`;
  };
  $('note').onchange = () => { session.world.player.note = $('note').value; clearForecast(); checkpoint('Player note'); render(); };
  $('field-visible').onchange = drawWorld; $('belief-visible').onchange = drawWorld;
  document.querySelectorAll('[data-journal]').forEach(b => b.onclick = () => { journalView = b.dataset.journal; document.querySelectorAll('[data-journal]').forEach(x => x.classList.toggle('selected', x === b)); renderJournal(); });
  document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { document.querySelectorAll('.view').forEach(v => v.hidden = v.id !== b.dataset.view); document.querySelectorAll('[data-view]').forEach(x => x.classList.toggle('active', x === b)); if (b.dataset.view !== 'laboratory') setRunning(false); render(); });
  $('export').onclick = () => {
    const blob = new Blob([E.exportSession(session)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = node('a');
    a.href = url; a.download = `archimedes-session-${session.world.tick}.json`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Session exported with parameters, history, and random state.');
  };
  $('import').onclick = () => $('import-file').click();
  $('import-file').onchange = async () => {
    const file = $('import-file').files[0]; if (!file) return; setRunning(false);
    try { if (file.size > 8_000_000) throw new Error('Import is too large (8 MB limit).'); const next = E.importSession(await file.text()); session = next; historyKey = ''; clearForecast(); syncControls(); save(); render(); toast('Session restored.'); }
    catch (e) { toast(`Import rejected: ${e.message}`); } finally { $('import-file').value = ''; }
  };
  $('about').onclick = () => { setRunning(false); $('help').showModal(); }; $('close-help').onclick = () => $('help').close();
  $('help').addEventListener('click', e => { if (e.target === $('help')) { const r = $('help').getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) $('help').close(); } });
  for (const op of E.REGISTRY) { const row = node('article', undefined, 'operator-row'); row.append(node('h2', op.id), node('p', op.operation), node('small', `${op.trigger}. ${op.status}.`)); $('operator-list').append(row); }
  function frame(now) {
    if (running && !document.hidden) {
      accumulator += Math.min(0.25, (now - last) / 1000) * Number($('speed').value); let changed = false;
      while (accumulator >= E.DT) {
        if ($('autopilot').checked && session.world.tick % 20 === 0) {
          const p = E.plan(session.world, { depth: Number($('depth').value) }); session.world = E.setAction(session.world, p.sequence[0]); $('intention').value = session.world.action;
        }
        session.world = E.step(session.world); accumulator -= E.DT; changed = true;
        if (session.world.tick % 20 === 0) checkpoint('World advanced');
      }
      if (changed) render();
    }
    last = now; requestAnimationFrame(frame);
  }
  window.addEventListener('resize', drawWorld);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { setRunning(false); save(); } });
  window.addEventListener('pagehide', save);
  syncControls(); render(); requestAnimationFrame(frame);
})();
