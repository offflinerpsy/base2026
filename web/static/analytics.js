(() => {
  'use strict';

  const root = document.querySelector('[data-signal-lab]');
  if (!root) return;

  const state = {
    raw: null,
    data: null,
    charts: [],
    selectedTopic: '',
    selectedCreator: '',
    range: '12',
  };

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const fmt = new Intl.NumberFormat('en-US');
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const num = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const pct = (value) => `${Math.round(num(value) * 100)}%`;
  const assetVersion = window.BASE2026_ASSET_VERSION || new URLSearchParams(window.location.search).get('v') || Date.now();
  const hasEcharts = () => Boolean(window.echarts && typeof window.echarts.init === 'function');

  function knowledgeUrl(params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    return `/knowledge/${query.toString() ? `?${query.toString()}` : ''}`;
  }

  function sourceUrl(sourceId) {
    return knowledgeUrl({ source: sourceId });
  }

  function skeleton(selector, text = 'Loading public signal data…') {
    const el = $(selector);
    if (el) el.innerHTML = `<div class="signal-lab-skeleton">${esc(text)}</div>`;
  }

  function showEmpty(selector, text) {
    const el = $(selector);
    if (el) el.innerHTML = `<p class="signal-lab-empty">${esc(text)}</p>`;
  }

  function normalizePayload(payload) {
    if (payload && payload.schema === 'base2026.signal_lab.v1') return payload;
    const topics = (payload?.topics || payload?.top_topics || []).map((row) => ({
      topic_id: row.topic_id,
      topic_label: row.topic_label || row.topic || row.label || row.topic_id,
      source_count: num(row.source_count),
      passage_count: num(row.passage_count),
      public_insight_count: num(row.public_insight_count),
      creator_count: num(row.creator_count),
      latest_source_date: row.latest_source_date || '',
      signal_score: num(row.signal_score) > 1 ? Math.min(1, num(row.signal_score) / 100) : num(row.signal_score),
      momentum_score: 0,
      freshness_score: 0,
      trend: row.has_signal_brief ? 'briefed' : 'steady',
      workspace_url: knowledgeUrl({ topic: row.topic_id }),
    }));
    const creators = (payload?.creators || payload?.top_creators || []).map((row) => ({
      creator_handle: row.creator_handle || row.handle,
      display_name: row.display_name || row.handle,
      source_count: num(row.source_count),
      public_insight_count: num(row.public_insight_count),
      unique_topic_count: num(row.topic_count || row.unique_topic_count),
      top_topics: [],
      latest_source_date: row.latest_published_at || row.latest_source_date || '',
      workspace_url: knowledgeUrl({ creator: String(row.handle || row.creator_handle || '').replace(/^@/, '') }),
    }));
    return {
      schema: 'base2026.signal_lab.v1.fallback',
      generated_at: payload?.generated_at || '',
      source: payload?.totals || {},
      topics,
      creators,
      creator_fingerprints: creators,
      creator_topic_matrix: [],
      topic_momentum: (payload?.monthly_sources ? topics.slice(0, 5).map((topic) => ({ ...topic, monthly: payload.monthly_sources.slice().reverse() })) : []),
      signal_chains: [],
      coverage_gaps: [],
      query_presets: [],
      lookups: { topics_by_id: Object.fromEntries(topics.map((row) => [row.topic_id, row])), creators_by_handle: Object.fromEntries(creators.map((row) => [row.creator_handle, row])), sources_by_id: {} },
    };
  }

  async function fetchJson(path) {
    const response = await fetch(`${path}?v=${encodeURIComponent(assetVersion)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${path} returned ${response.status}`);
    return response.json();
  }

  async function loadData() {
    try {
      return normalizePayload(await fetchJson('./static/signal_lab.json'));
    } catch (primaryError) {
      console.warn('Signal Lab payload missing, falling back to analytics_summary.json', primaryError);
      return normalizePayload(await fetchJson('./static/analytics_summary.json'));
    }
  }

  function populateControls(data) {
    const topicSelect = $('[data-signal-topic]');
    const creatorSelect = $('[data-signal-creator]');
    if (topicSelect) {
      topicSelect.innerHTML = '<option value="">All strong topics</option>' + data.topics.slice(0, 80).map((topic) => `<option value="${esc(topic.topic_id)}">${esc(topic.topic_label)}</option>`).join('');
      topicSelect.value = state.selectedTopic;
    }
    if (creatorSelect) {
      creatorSelect.innerHTML = '<option value="">All creators</option>' + data.creators.map((creator) => `<option value="${esc(creator.creator_handle)}">${esc(creator.creator_handle)}</option>`).join('');
      creatorSelect.value = state.selectedCreator;
    }
  }

  function renderStats(data) {
    const totals = data.source || {};
    const stats = [
      ['Sources', totals.source_records || totals.documents || 0],
      ['Creators', totals.creators || data.creators.length || 0],
      ['Topics', totals.topics || data.topics.length || 0],
      ['Public insights', totals.public_insight_cards || 0],
    ];
    const el = $('[data-signal-stats]');
    if (!el) return;
    el.innerHTML = stats.map(([label, value]) => `<span><strong>${fmt.format(num(value))}</strong><em>${esc(label)}</em></span>`).join('');
  }

  function filteredMatrix(data) {
    let rows = data.creator_topic_matrix || [];
    if (state.selectedTopic) rows = rows.filter((row) => row.topic_id === state.selectedTopic);
    if (state.selectedCreator) rows = rows.filter((row) => row.creator_handle === state.selectedCreator);
    return rows;
  }

  function visibleTopics(data) {
    if (state.selectedTopic) return data.topics.filter((topic) => topic.topic_id === state.selectedTopic);
    const matrixTopicIds = new Set(filteredMatrix(data).map((row) => row.topic_id));
    const topics = data.topics.filter((topic) => matrixTopicIds.has(topic.topic_id)).slice(0, window.innerWidth < 520 ? 8 : 16);
    return topics.length ? topics : data.topics.slice(0, window.innerWidth < 520 ? 8 : 16);
  }

  function visibleCreators(data) {
    if (state.selectedCreator) return data.creators.filter((creator) => creator.creator_handle === state.selectedCreator);
    const matrixCreatorIds = new Set(filteredMatrix(data).map((row) => row.creator_handle));
    const creators = data.creators.filter((creator) => matrixCreatorIds.has(creator.creator_handle)).slice(0, window.innerWidth < 520 ? 8 : 12);
    return creators.length ? creators : data.creators.slice(0, window.innerWidth < 520 ? 8 : 12);
  }

  function attachResize(chart, el) {
    if (!chart || !el) return;
    state.charts.push(chart);
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => chart.resize());
      observer.observe(el);
    } else {
      window.addEventListener('resize', () => chart.resize(), { passive: true });
    }
  }

  function disposeCharts() {
    state.charts.forEach((chart) => chart.dispose && chart.dispose());
    state.charts = [];
  }

  function renderMatrixFallback(data, rows, topics, creators) {
    const el = $('[data-chart-matrix]');
    if (!el) return;
    const byKey = new Map(rows.map((row) => [`${row.creator_handle}::${row.topic_id}`, row]));
    el.innerHTML = `<div class="signal-lab-matrix-fallback" role="table" aria-label="Creator topic matrix" style="--cols:${topics.length || 1}">
      <div class="signal-lab-matrix-row signal-lab-matrix-head" role="row"><span></span>${topics.map((topic) => `<span>${esc(topic.topic_label)}</span>`).join('')}</div>
      ${creators.map((creator) => `<div class="signal-lab-matrix-row" role="row"><strong>${esc(creator.creator_handle)}</strong>${topics.map((topic) => {
        const cell = byKey.get(`${creator.creator_handle}::${topic.topic_id}`);
        const value = cell ? Math.max(0.08, num(cell.signal_score)) : 0;
        return `<a role="cell" href="${cell?.workspace_url || knowledgeUrl({ creator: creator.creator_handle.replace(/^@/, ''), topic: topic.topic_id })}" style="--signal:${value}">${cell ? fmt.format(cell.source_count) : '–'}</a>`;
      }).join('')}</div>`).join('')}
    </div>`;
  }

  function renderMatrix(data) {
    const el = $('[data-chart-matrix]');
    if (!el) return;
    const rows = filteredMatrix(data);
    const topics = visibleTopics(data);
    const creators = visibleCreators(data);
    if (!rows.length || !topics.length || !creators.length) return renderMatrixFallback(data, rows, topics, creators);
    if (!hasEcharts()) return renderMatrixFallback(data, rows, topics, creators);
    el.innerHTML = '';
    const chart = window.echarts.init(el, null, { renderer: 'canvas' });
    const topicIndex = new Map(topics.map((topic, index) => [topic.topic_id, index]));
    const creatorIndex = new Map(creators.map((creator, index) => [creator.creator_handle, index]));
    const cells = rows.filter((row) => topicIndex.has(row.topic_id) && creatorIndex.has(row.creator_handle)).map((row) => ({
      value: [topicIndex.get(row.topic_id), creatorIndex.get(row.creator_handle), num(row.signal_score), row.source_count, row.public_insight_count],
      item: row,
    }));
    chart.setOption({
      animation: false,
      tooltip: {
        appendToBody: true,
        formatter: (params) => {
          const row = params.data.item;
          return `<strong>${esc(row.creator_handle)} × ${esc(row.topic_label)}</strong><br/>Sources: ${fmt.format(row.source_count)}<br/>Insights: ${fmt.format(row.public_insight_count)}<br/>Latest: ${esc(row.latest_source_date || 'unknown')}<br/><em>Click to open workspace</em>`;
        },
      },
      grid: { left: 116, right: 20, top: 28, bottom: window.innerWidth < 520 ? 84 : 58 },
      xAxis: { type: 'category', data: topics.map((topic) => topic.topic_label), axisLabel: { rotate: 35, width: 92, overflow: 'truncate', color: '#5f6a72' }, axisLine: { lineStyle: { color: '#e6ded1' } }, splitArea: { show: true } },
      yAxis: { type: 'category', data: creators.map((creator) => creator.creator_handle), axisLabel: { color: '#5f6a72' }, axisLine: { lineStyle: { color: '#e6ded1' } }, splitArea: { show: true } },
      visualMap: { min: 0, max: Math.max(0.1, ...cells.map((cell) => cell.value[2])), show: false, inRange: { color: ['#fff7ed', '#fed7aa', '#fb923c', '#c84f07', '#7c2d12'] } },
      series: [{ type: 'heatmap', data: cells, label: { show: false }, emphasis: { itemStyle: { borderColor: '#10231f', borderWidth: 1 } }, itemStyle: { borderRadius: 4, borderColor: '#fffaf0', borderWidth: 2 } }],
    });
    chart.on('click', (params) => {
      if (params?.data?.item?.workspace_url) window.location.href = params.data.item.workspace_url;
    });
    attachResize(chart, el);
  }

  function renderMomentumFallback(rows) {
    const el = $('[data-chart-momentum]');
    if (!el) return;
    el.innerHTML = rows.length ? `<div class="signal-lab-lines-fallback">${rows.map((topic) => `<a href="${topic.workspace_url}" class="signal-lab-line-row"><strong>${esc(topic.topic_label)}</strong><span>${fmt.format(topic.source_count)} sources</span><em>${esc(topic.trend || 'steady')}</em></a>`).join('')}</div>` : '<p class="signal-lab-empty">No monthly topic momentum is available yet.</p>';
  }

  function renderMomentum(data) {
    const el = $('[data-chart-momentum]');
    if (!el) return;
    let rows = data.topic_momentum || [];
    if (state.selectedTopic) rows = rows.filter((row) => row.topic_id === state.selectedTopic);
    rows = rows.slice(0, state.selectedTopic ? 1 : 5);
    if (!rows.length || !hasEcharts()) return renderMomentumFallback(rows);
    const months = Array.from(new Set(rows.flatMap((row) => (row.monthly || []).map((month) => month.month)))).sort().slice(-num(state.range));
    if (!months.length) return renderMomentumFallback(rows);
    el.innerHTML = '';
    const chart = window.echarts.init(el, null, { renderer: 'canvas' });
    chart.setOption({
      animation: false,
      color: ['#c84f07', '#10231f', '#ef6b13', '#6b7280', '#92400e'],
      tooltip: {
        trigger: 'axis', appendToBody: true,
        formatter: (params) => params.map((param) => {
          const item = param.data?.item || {};
          return `<strong>${esc(param.seriesName)}</strong><br/>${esc(param.name)} · ${fmt.format(item.source_count || param.value)} sources · ${fmt.format(item.public_insight_count || 0)} insights · ${fmt.format(item.creator_count || 0)} creators`;
        }).join('<hr/>'),
      },
      grid: { left: 42, right: 16, top: 22, bottom: 42 },
      xAxis: { type: 'category', data: months, axisLabel: { color: '#5f6a72' }, axisLine: { lineStyle: { color: '#e6ded1' } } },
      yAxis: { type: 'value', minInterval: 1, axisLabel: { color: '#5f6a72' }, splitLine: { lineStyle: { color: '#eee4d4' } } },
      series: rows.map((row) => {
        const byMonth = new Map((row.monthly || []).map((month) => [month.month, month]));
        return { name: row.topic_label, type: 'line', smooth: true, symbolSize: 6, lineStyle: { width: 2 }, data: months.map((month) => ({ value: byMonth.get(month)?.source_count || 0, item: byMonth.get(month) || { month, source_count: 0 } })) };
      }),
    });
    chart.on('click', (params) => {
      const row = rows.find((item) => item.topic_label === params.seriesName);
      if (row?.workspace_url) window.location.href = row.workspace_url;
    });
    attachResize(chart, el);
  }

  function renderFingerprints(data) {
    const el = $('[data-fingerprints]');
    if (!el) return;
    let rows = data.creator_fingerprints || data.creators || [];
    if (state.selectedCreator) rows = rows.filter((row) => row.creator_handle === state.selectedCreator);
    rows = rows.slice(0, 8);
    if (!rows.length) return showEmpty('[data-fingerprints]', 'No creator fingerprints match this filter yet.');
    el.innerHTML = rows.map((creator) => `<article class="signal-lab-fingerprint">
      <a href="${creator.workspace_url || knowledgeUrl({ creator: creator.creator_handle.replace(/^@/, '') })}" class="signal-lab-fingerprint__head">
        <strong>${esc(creator.creator_handle)}</strong>
        <span>${fmt.format(creator.source_count)} sources · ${fmt.format(creator.public_insight_count)} insights</span>
      </a>
      <div class="signal-lab-bars">${(creator.top_topics || []).slice(0, 5).map((topic) => `<a href="${topic.workspace_url || knowledgeUrl({ creator: creator.creator_handle.replace(/^@/, ''), topic: topic.topic_id })}" style="--w:${Math.max(8, Math.min(100, Math.round(num(topic.score) * 100)))}%"><span>${esc(topic.topic_label)}</span><em>${fmt.format(topic.source_count)}</em></a>`).join('') || '<p class="signal-lab-empty signal-lab-empty--tight">Topic fingerprint builds as public topic links grow.</p>'}</div>
      <p class="signal-lab-fingerprint__meta">Latest: ${esc(creator.latest_source_date || 'unknown')} · Unique topics: ${fmt.format(creator.unique_topic_count || 0)} · Fresh topics: ${fmt.format(creator.fresh_topic_count || 0)}</p>
    </article>`).join('');
  }

  function renderChainFallback(chain) {
    const el = $('[data-chart-chain]');
    if (!el) return;
    if (!chain) return showEmpty('[data-chart-chain]', 'Choose a strong topic to preview source chains.');
    el.innerHTML = `<div class="signal-lab-chain-list">${(chain.top_sources || []).slice(0, 8).map((source) => `<a href="${source.url || sourceUrl(source.source_id)}"><strong>${esc(source.creator_handle || 'source')}</strong><span>${esc(source.title || source.source_id)}</span></a>`).join('')}</div>`;
  }

  function renderChain(data) {
    const el = $('[data-chart-chain]');
    if (!el) return;
    const chain = (data.signal_chains || []).find((row) => !state.selectedTopic || row.topic_id === state.selectedTopic) || (data.signal_chains || [])[0];
    if (!chain || !hasEcharts()) return renderChainFallback(chain);
    el.innerHTML = '';
    const chart = window.echarts.init(el, null, { renderer: 'canvas' });
    const categories = [{ name: 'Topic' }, { name: 'Creators' }, { name: 'Sources' }, { name: 'Insights' }];
    const categoryIndex = { topic: 0, creator: 1, source: 2, insight: 3 };
    chart.setOption({
      animation: false,
      tooltip: { appendToBody: true, formatter: (params) => params.dataType === 'edge' ? 'Source-backed connection' : `<strong>${esc(params.data.label || params.name)}</strong><br/>${esc(params.data.type || '')}<br/><em>Click to open evidence</em>` },
      series: [{
        type: 'graph', layout: 'force', roam: false, draggable: false, categories,
        force: { repulsion: 110, edgeLength: [42, 92], gravity: 0.06 },
        label: { show: true, formatter: (params) => params.data.type === 'source' ? '' : params.data.label, color: '#111820', fontSize: 11 },
        data: (chain.nodes || []).slice(0, 40).map((node) => ({ ...node, name: node.id, category: categoryIndex[node.type] ?? 2, symbolSize: node.type === 'topic' ? 38 : node.type === 'creator' ? 25 : node.type === 'insight' ? 18 : 12, itemStyle: { color: node.type === 'topic' ? '#c84f07' : node.type === 'creator' ? '#10231f' : node.type === 'insight' ? '#ef6b13' : '#9ca3af' } })),
        links: (chain.edges || []).slice(0, 70),
        lineStyle: { color: '#c8bca9', opacity: 0.72, width: 1 },
      }],
    });
    chart.on('click', { dataType: 'node' }, (params) => {
      if (params?.data?.url) window.location.href = params.data.url;
    });
    attachResize(chart, el);
  }

  function renderGaps(data) {
    const el = $('[data-gaps]');
    if (!el) return;
    let gaps = data.coverage_gaps || [];
    if (state.selectedTopic) gaps = gaps.filter((gap) => gap.topic_id === state.selectedTopic);
    gaps = gaps.slice(0, 12);
    if (!gaps.length) return showEmpty('[data-gaps]', 'No coverage gaps for this filter. Coverage gaps appear when evidence is thin, stale, or under-reviewed.');
    el.innerHTML = gaps.map((gap) => `<a class="signal-lab-gap-row" href="${gap.workspace_url || knowledgeUrl({ topic: gap.topic_id })}">
      <span><strong>${esc(gap.topic_label)}</strong><em>${esc(gap.gap_type.replaceAll('_', ' '))}</em></span>
      <small>${fmt.format(gap.source_count)} sources · ${fmt.format(gap.public_insight_count)} insights · ${fmt.format(gap.creator_count)} creators</small>
      <p>${esc(gap.suggested_action)}</p>
    </a>`).join('');
  }

  function queryTokens(value) {
    return new Set(String(value || '').toLowerCase().match(/[a-z0-9]+/g)?.filter((token) => !['the', 'and', 'for', 'with', 'this', 'that'].includes(token)) || []);
  }

  function overlapScore(query, values) {
    const q = queryTokens(query);
    if (!q.size) return 0;
    const hay = queryTokens(values.join(' '));
    return Array.from(q).reduce((score, token) => score + (hay.has(token) ? 1 : 0), 0) / q.size;
  }

  function buildPlaybook(data, query) {
    const topics = data.topics.map((topic) => ({ ...topic, match: overlapScore(query, [topic.topic_id, topic.topic_label]) })).filter((topic) => topic.match > 0).sort((a, b) => b.match - a.match || b.signal_score - a.signal_score).slice(0, 8);
    const topicIds = new Set(topics.map((topic) => topic.topic_id));
    const matrix = (data.creator_topic_matrix || []).filter((row) => topicIds.has(row.topic_id)).sort((a, b) => b.signal_score - a.signal_score);
    const creators = Array.from(new Set(matrix.map((row) => row.creator_handle))).slice(0, 8);
    let preset = (data.query_presets || []).map((row) => ({ ...row, match: overlapScore(query, [row.query_label, ...(row.query_terms || [])]) })).sort((a, b) => b.match - a.match)[0];
    if (!preset || preset.match === 0) preset = null;
    const actions = (preset?.source_backed_actions || []).slice(0, 5);
    const sources = (preset?.top_sources || []).slice(0, 6);
    return { topics, matrix, creators, preset, actions, sources };
  }

  function renderPlaybook(data) {
    const input = $('[data-playbook-query]');
    const el = $('[data-playbook-output]');
    if (!el) return;
    const query = (input?.value || new URLSearchParams(window.location.search).get('q') || '').trim();
    if (!query) {
      el.innerHTML = '<p class="signal-lab-empty">Enter a topic or keyword to build a source-backed playbook from public creator records.</p>';
      return;
    }
    const result = buildPlaybook(data, query);
    if (!result.topics.length && !result.preset) {
      el.innerHTML = `<p class="signal-lab-empty">Not enough public source coverage yet. Try a broader topic or open the search workspace.</p><a class="ay-button-secondary" href="${knowledgeUrl({ q: query })}">Open this search in workspace</a>`;
      return;
    }
    const topicSourceCount = result.topics.reduce((sum, topic) => sum + num(topic.source_count), 0);
    const insightCount = result.topics.reduce((sum, topic) => sum + num(topic.public_insight_count), 0);
    el.innerHTML = `<div class="signal-lab-playbook-result">
      <div class="signal-lab-playbook-summary"><strong>Current signal</strong><span>${fmt.format(result.creators.length || result.preset?.creator_count || 0)} creators · ${fmt.format(result.preset?.source_count || topicSourceCount)} source records · ${fmt.format(result.preset?.public_insight_count || insightCount)} public insights</span></div>
      <section><h3>Matching topics</h3><div class="signal-lab-chip-row">${result.topics.slice(0, 6).map((topic) => `<a href="${topic.workspace_url || knowledgeUrl({ topic: topic.topic_id })}">${esc(topic.topic_label)} <em>${fmt.format(topic.source_count)}</em></a>`).join('')}</div></section>
      <section><h3>Creator coverage</h3>${result.creators.length ? `<ul>${result.creators.map((creator) => `<li><a href="${knowledgeUrl({ creator: creator.replace(/^@/, ''), q: query })}">${esc(creator)}</a></li>`).join('')}</ul>` : '<p class="signal-lab-empty signal-lab-empty--tight">Creator overlap is thin for this query.</p>'}</section>
      <section><h3>Source-backed actions</h3>${result.actions.length ? `<ol>${result.actions.map((action) => `<li>${esc(action.text)} ${action.url ? `<a href="${action.url}">source</a>` : ''}</li>`).join('')}</ol>` : '<p class="signal-lab-empty signal-lab-empty--tight">No reviewed public action cards match closely yet.</p>'}</section>
      <section><h3>Evidence pack</h3>${result.sources.length ? `<ul>${result.sources.map((source) => `<li><a href="${source.url || sourceUrl(source.source_id)}">${esc(source.title || source.source_id)}</a> <span>${esc(source.creator_handle || '')}</span></li>`).join('')}</ul>` : '<p class="signal-lab-empty signal-lab-empty--tight">Open the workspace search for source-level evidence.</p>'}</section>
      <a class="ay-button" href="${knowledgeUrl({ q: query })}">Open this search in workspace</a>
    </div>`;
  }

  function renderAll() {
    if (!state.data) return;
    disposeCharts();
    populateControls(state.data);
    renderStats(state.data);
    renderMatrix(state.data);
    renderMomentum(state.data);
    renderFingerprints(state.data);
    renderChain(state.data);
    renderGaps(state.data);
    renderPlaybook(state.data);
  }

  function bindControls() {
    $('[data-signal-topic]')?.addEventListener('change', (event) => { state.selectedTopic = event.target.value; renderAll(); });
    $('[data-signal-creator]')?.addEventListener('change', (event) => { state.selectedCreator = event.target.value; renderAll(); });
    $('[data-signal-range]')?.addEventListener('change', (event) => { state.range = event.target.value; renderAll(); });
    $('[data-signal-reset]')?.addEventListener('click', () => { state.selectedTopic = ''; state.selectedCreator = ''; state.range = '12'; const range = $('[data-signal-range]'); if (range) range.value = '12'; renderAll(); });
    $('[data-playbook-form]')?.addEventListener('submit', (event) => { event.preventDefault(); renderPlaybook(state.data); });
  }

  async function init() {
    skeleton('[data-chart-matrix]');
    skeleton('[data-chart-momentum]');
    skeleton('[data-chart-chain]');
    skeleton('[data-fingerprints]');
    skeleton('[data-gaps]');
    bindControls();
    try {
      state.data = await loadData();
      const params = new URLSearchParams(window.location.search);
      state.selectedTopic = params.get('topic') || '';
      state.selectedCreator = params.get('creator') ? `@${params.get('creator').replace(/^@/, '')}` : '';
      const queryInput = $('[data-playbook-query]');
      if (queryInput && params.get('q')) queryInput.value = params.get('q');
      renderAll();
      root.dataset.loaded = 'true';
    } catch (error) {
      console.error('Signal Lab failed to load', error);
      showEmpty('[data-playbook-output]', 'Signal Lab public analytics could not be loaded. The search workspace still works.');
      ['[data-chart-matrix]', '[data-chart-momentum]', '[data-chart-chain]', '[data-fingerprints]', '[data-gaps]'].forEach((selector) => showEmpty(selector, 'Dataset unavailable.'));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
