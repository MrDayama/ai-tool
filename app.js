/* ============================================================
   RACE EV ANALYZER — App Logic
   ============================================================ */

'use strict';

// ── State ────────────────────────────────────────────────────
let horses = [];
let sortState = { col: 'ev', asc: false };

// ── Utility ──────────────────────────────────────────────────

function calcEV(aiProb, odds) {
    // EV = P_ai × odds  (normalized: 0–1 for aiProb, decimal odds)
    return (aiProb / 100) * odds;
}

function calcEdge(aiProb, odds) {
    // Market implied prob = 1/odds (×100 for %)
    const impliedProb = (1 / odds) * 100;
    return aiProb - impliedProb;
}

function impliedProb(odds) {
    return (1 / odds) * 100;
}

function fmt(n, decimals = 2) {
    return Number.isFinite(n) ? n.toFixed(decimals) : '-';
}

function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    const icon = type === 'success' ? '✅' : type === 'warn' ? '⚠️' : 'ℹ️';
    t.textContent = `${icon} ${msg}`;
    t.style.borderColor = type === 'success' ? 'rgba(34,213,123,0.5)' :
        type === 'warn' ? 'rgba(255,154,60,0.5)' :
            'rgba(79,163,255,0.35)';
    t.classList.add('show');
    clearTimeout(t._timeout);
    t._timeout = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Init ─────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    initDate();
    initParticles();
    bindEvents();
    initSearch();
    // Start with 5 empty rows
    for (let i = 0; i < 5; i++) addHorse();
});

function initDate() {
    const el = document.getElementById('currentDate');
    const now = new Date();
    el.textContent = now.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
    });
    // Set today as default race date
    const dateInput = document.getElementById('raceDate');
    dateInput.value = now.toISOString().split('T')[0];
}

function initParticles() {
    const container = document.getElementById('bgParticles');
    const colors = ['#f5c842', '#4fa3ff', '#22d57b', '#ff9a3c'];
    for (let i = 0; i < 28; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 4 + 2;
        p.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${Math.random() * 100}%;
      bottom: -10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${Math.random() * 18 + 14}s;
      animation-delay: ${Math.random() * 12}s;
    `;
        container.appendChild(p);
    }
}

function bindEvents() {
    document.getElementById('addHorseBtn').addEventListener('click', () => {
        addHorse();
        showToast('馬を追加しました', 'success');
    });

    document.getElementById('analyzeBtn').addEventListener('click', runAnalysis);
    document.getElementById('clearAllBtn').addEventListener('click', clearAll);
    document.getElementById('loadSampleBtn').addEventListener('click', loadSample);
    document.getElementById('exportBtn').addEventListener('click', exportCSV);

    // Sort header clicks
    document.querySelectorAll('.th-sort').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.dataset.col;
            if (sortState.col === col) {
                sortState.asc = !sortState.asc;
            } else {
                sortState.col = col;
                sortState.asc = false;
            }
            renderResultsTable();
        });
    });
}

// ── Horse Row Management ──────────────────────────────────────

function addHorse(data = {}) {
    const id = Date.now() + Math.random();
    const horse = { id, num: '', name: '', aiProb: '', odds: '' };
    Object.assign(horse, data);
    horses.push(horse);
    renderHorseList();
}

function removeHorse(id) {
    horses = horses.filter(h => h.id !== id);
    renderHorseList();
}

function renderHorseList() {
    const list = document.getElementById('horseList');

    if (horses.length === 0) {
        list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🐴</div>
        <div>「馬を追加」ボタンから出走馬を入力してください</div>
      </div>`;
        updateStats();
        return;
    }

    list.innerHTML = '';
    horses.forEach((horse, idx) => {
        const row = document.createElement('div');
        row.className = 'horse-row';
        row.dataset.id = horse.id;

        const evVal = (horse.aiProb !== '' && horse.odds !== '')
            ? calcEV(+horse.aiProb, +horse.odds) : null;
        const edgeVal = (horse.aiProb !== '' && horse.odds !== '')
            ? calcEdge(+horse.aiProb, +horse.odds) : null;

        const evClass = evVal === null ? 'neutral' : evVal >= 1 ? 'positive' : 'negative';
        const edgeClass = edgeVal === null ? 'neutral' : edgeVal >= 0 ? 'positive' : 'negative';
        const evText = evVal !== null ? evVal.toFixed(3) : '--';
        const edgeText = edgeVal !== null ? (edgeVal >= 0 ? '+' : '') + edgeVal.toFixed(1) + '%' : '--';

        row.innerHTML = `
      <div class="horse-num-display">${idx + 1}</div>
      <input type="text" class="horse-name" placeholder="馬名を入力" value="${escHtml(horse.name)}" data-field="name" />
      <input type="number" class="horse-ai" placeholder="例: 25.0" step="0.1" min="0" max="100" value="${horse.aiProb}" data-field="aiProb" />
      <input type="number" class="horse-odds" placeholder="例: 4.5" step="0.1" min="1" value="${horse.odds}" data-field="odds" />
      <div class="ev-preview ${evClass}">${evText}</div>
      <div class="edge-preview ${edgeClass}">${edgeText}</div>
      <button class="btn-remove-horse" title="削除">✕</button>
    `;

        // Field changes
        row.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', e => {
                const h = horses.find(h => h.id === horse.id);
                if (!h) return;
                const field = e.target.dataset.field;
                h[field] = e.target.value;
                // Live preview
                updateHorseRowPreview(row, h);
                updateStats();
            });
        });

        // Remove button
        row.querySelector('.btn-remove-horse').addEventListener('click', () => {
            removeHorse(horse.id);
        });

        list.appendChild(row);
    });

    updateStats();
}

function updateHorseRowPreview(row, horse) {
    const evEl = row.querySelector('.ev-preview');
    const edgeEl = row.querySelector('.edge-preview');

    if (horse.aiProb !== '' && horse.odds !== '' && +horse.odds > 0) {
        const ev = calcEV(+horse.aiProb, +horse.odds);
        const edge = calcEdge(+horse.aiProb, +horse.odds);

        evEl.textContent = ev.toFixed(3);
        evEl.className = 'ev-preview ' + (ev >= 1 ? 'positive' : 'negative');

        edgeEl.textContent = (edge >= 0 ? '+' : '') + edge.toFixed(1) + '%';
        edgeEl.className = 'edge-preview ' + (edge >= 0 ? 'positive' : 'negative');
    } else {
        evEl.textContent = '--';
        evEl.className = 'ev-preview neutral';
        edgeEl.textContent = '--';
        edgeEl.className = 'edge-preview neutral';
    }
}

function updateStats() {
    const valid = horses.filter(h => h.aiProb !== '' && h.odds !== '');
    document.getElementById('horseCount').textContent = `${horses.length}頭`;
    const totalAI = valid.reduce((s, h) => s + +h.aiProb, 0);
    const totalEl = document.getElementById('totalAiProb');
    totalEl.textContent = `合計AI勝率: ${totalAI.toFixed(1)}%`;
    totalEl.style.color = Math.abs(totalAI - 100) < 5 ? 'var(--green)' :
        Math.abs(totalAI - 100) < 15 ? 'var(--orange)' :
            'var(--red)';
}

// ── Analysis ─────────────────────────────────────────────────

function runAnalysis() {
    const valid = horses.filter(h =>
        h.name.trim() !== '' &&
        h.aiProb !== '' && +h.aiProb > 0 &&
        h.odds !== '' && +h.odds >= 1
    );

    if (valid.length < 2) {
        showToast('少なくとも2頭分のデータを入力してください', 'warn');
        return;
    }

    // Calculate all metrics
    const analyzed = valid.map((h, idx) => ({
        ...h,
        num: h.num || (idx + 1),
        aiProb: +h.aiProb,
        odds: +h.odds,
        impliedProb: impliedProb(+h.odds),
        ev: calcEV(+h.aiProb, +h.odds),
        edge: calcEdge(+h.aiProb, +h.odds),
    }));

    // Sort by EV descending by default
    analyzed.sort((a, b) => b.ev - a.ev);

    // Show results panel
    const panel = document.getElementById('resultsPanel');
    panel.style.display = 'block';
    panel.classList.add('fade-in');

    // Update summary cards
    const positiveEv = analyzed.filter(h => h.ev >= 1);
    const negativeEv = analyzed.filter(h => h.ev < 1);
    const topHorse = analyzed[0];

    document.getElementById('positiveEvCount').textContent = positiveEv.length;
    document.getElementById('negativeEvCount').textContent = negativeEv.length;
    document.getElementById('bestEvHorse').textContent = topHorse.name;
    document.getElementById('maxEv').textContent = topHorse.ev.toFixed(3);

    // Store for sort
    window._analyzedData = analyzed;

    renderResultsTable();
    renderChart(analyzed);

    // Scroll to results
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('分析完了！期待値の高い馬を特定しました', 'success');
}

function renderResultsTable() {
    const data = [...(window._analyzedData || [])];
    if (!data.length) return;

    // Sort
    const col = sortState.col;
    data.sort((a, b) => {
        let va = a[col], vb = b[col];
        if (col === 'name') { va = va || ''; vb = vb || ''; return sortState.asc ? va.localeCompare(vb) : vb.localeCompare(va); }
        return sortState.asc ? va - vb : vb - va;
    });

    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';

    data.forEach((horse, idx) => {
        const isTop = horse.ev === Math.max(...data.map(d => d.ev));
        const tr = document.createElement('tr');
        if (isTop) tr.classList.add('row-top1');

        // Recommendation
        let recHTML;
        if (horse.ev >= 1.3 && horse.edge >= 10) {
            recHTML = '<span class="rec-badge rec-strong">🔥 強く推奨</span>';
        } else if (horse.ev >= 1.0) {
            recHTML = '<span class="rec-badge rec-moderate">👍 推奨</span>';
        } else {
            recHTML = '<span class="rec-badge rec-skip">— スキップ</span>';
        }

        const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';
        const evClass = horse.ev >= 1.3 ? 'ev-positive' : horse.ev >= 1.0 ? 'ev-neutral' : 'ev-negative';
        const edgeCls = horse.edge >= 0 ? 'edge-positive' : 'edge-negative';

        const aiBarW = Math.min(horse.aiProb, 100).toFixed(1);
        const mktBarW = Math.min(horse.impliedProb, 100).toFixed(1);

        tr.innerHTML = `
      <td class="td-num">${horse.num}</td>
      <td class="td-name">
        ${rankEmoji ? `<span class="rank-badge">${rankEmoji}</span>` : ''}
        ${escHtml(horse.name)}
      </td>
      <td class="prob-cell">
        <div class="prob-bar-wrap">
          <div class="prob-bar-bg"><div class="prob-bar-fill ai" style="width:${aiBarW}%"></div></div>
          <span class="prob-value" style="color:var(--blue)">${horse.aiProb.toFixed(1)}%</span>
        </div>
      </td>
      <td class="prob-cell">
        <div class="prob-bar-wrap">
          <div class="prob-bar-bg"><div class="prob-bar-fill mkt" style="width:${mktBarW}%"></div></div>
          <span class="prob-value" style="color:var(--orange)">${horse.impliedProb.toFixed(1)}%</span>
        </div>
      </td>
      <td style="font-family:var(--font-display);font-weight:700;">${horse.odds.toFixed(1)}倍</td>
      <td><span class="ev-badge ${evClass}">${horse.ev.toFixed(3)}</span></td>
      <td class="${edgeCls}">${horse.edge >= 0 ? '+' : ''}${horse.edge.toFixed(1)}%</td>
      <td>${recHTML}</td>
    `;
        tbody.appendChild(tr);
    });
}

// ── Chart ─────────────────────────────────────────────────────

function renderChart(data) {
    const container = document.getElementById('chartContainer');
    container.innerHTML = '';

    const maxProb = Math.max(
        ...data.map(h => Math.max(h.aiProb, h.impliedProb))
    );
    const scale = 160 / maxProb; // px per %

    data.forEach(horse => {
        const aiH = Math.max(4, horse.aiProb * scale);
        const mktH = Math.max(4, horse.impliedProb * scale);

        const group = document.createElement('div');
        group.className = 'chart-group';
        group.innerHTML = `
      <div class="chart-bars">
        <div class="chart-bar chart-bar-ai"
          style="height:${aiH}px"
          data-tooltip="AI: ${horse.aiProb.toFixed(1)}%">
        </div>
        <div class="chart-bar chart-bar-mkt"
          style="height:${mktH}px"
          data-tooltip="市場: ${horse.impliedProb.toFixed(1)}%">
        </div>
      </div>
      <div class="chart-name">${escHtml(horse.name)}</div>
    `;
        container.appendChild(group);
    });

    // Legend
    const legend = document.createElement('div');
    legend.style.cssText = 'width:100%; display:flex; gap:20px; justify-content:center; padding-top:8px;';
    legend.innerHTML = `
    <div class="legend-item"><div class="legend-dot legend-ai"></div>AI予測勝率</div>
    <div class="legend-item"><div class="legend-dot legend-mkt"></div>市場勝率（インプライド）</div>
  `;
    container.after(legend);
}

// ── Sample Data ───────────────────────────────────────────────

function loadSample() {
    horses = [];
    document.getElementById('raceName').value = '第70回 大阪杯 (G1)';
    document.getElementById('raceVenue').value = '阪神競馬場';
    document.getElementById('raceDistance').value = '2000m 芝';

    const sampleHorses = [
        { name: 'ドウデュース', aiProb: '28.5', odds: '2.8' },
        { name: 'イクイノックス', aiProb: '22.0', odds: '3.5' },
        { name: 'スターズオンアース', aiProb: '18.0', odds: '5.2' },
        { name: 'ジャックドール', aiProb: '12.5', odds: '6.8' },
        { name: 'ダノンベルーガ', aiProb: '7.0', odds: '12.0' },
        { name: 'ヴェルトライゼンデ', aiProb: '5.5', odds: '15.5' },
        { name: 'マテンロウオリオン', aiProb: '3.0', odds: '22.0' },
        { name: 'ラーグルフ', aiProb: '1.5', odds: '45.0' },
    ];

    sampleHorses.forEach((h, i) => {
        addHorse({ ...h, num: i + 1 });
    });

    showToast('サンプルデータを読み込みました！', 'success');
    setTimeout(() => {
        document.getElementById('analyzeBtn').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
}

// ── Clear ─────────────────────────────────────────────────────

function clearAll() {
    horses = [];
    renderHorseList();
    document.getElementById('resultsPanel').style.display = 'none';
    document.getElementById('raceName').value = '';
    document.getElementById('raceVenue').value = '';
    document.getElementById('raceDistance').value = '';
    window._analyzedData = null;
    showToast('データをクリアしました');
    // Re-add 3 blank rows
    for (let i = 0; i < 3; i++) addHorse();
}

// ── CSV Export ────────────────────────────────────────────────

function exportCSV() {
    const data = window._analyzedData;
    if (!data || data.length === 0) {
        showToast('先に分析を実行してください', 'warn');
        return;
    }

    const raceName = document.getElementById('raceName').value || 'レース分析';
    const raceDate = document.getElementById('raceDate').value || new Date().toISOString().split('T')[0];
    const venue = document.getElementById('raceVenue').value || '';

    const header = ['枠番', '馬名', 'AI勝率(%)', '市場勝率(%)', 'オッズ(倍)', '期待値', 'エッジ(%)', '推奨'];
    const rows = data.map(h => [
        h.num,
        h.name,
        h.aiProb.toFixed(1),
        h.impliedProb.toFixed(1),
        h.odds.toFixed(1),
        h.ev.toFixed(4),
        h.edge.toFixed(2),
        h.ev >= 1.3 && h.edge >= 10 ? '強く推奨' : h.ev >= 1.0 ? '推奨' : 'スキップ'
    ]);

    const meta = `# ${raceName} - ${raceDate} ${venue}\n`;
    const csvContent = meta + [header, ...rows].map(r => r.join(',')).join('\n');

    const bom = '\uFEFF'; // UTF-8 BOM for Excel
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `競馬EV分析_${raceDate}_${raceName}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('CSVをエクスポートしました', 'success');
}

// ── Race Search ───────────────────────────────────────────────

const MOCK_RACES = [
    {
        name: '第93回 日本ダービー (G1)',
        date: '2026-05-31',
        venue: '中央競馬場（東京）',
        distance: '2400m 芝',
        horses: [
            { name: 'イクイノックス', aiProb: '35.0', odds: '2.1' },
            { name: 'ドウデュース', aiProb: '18.0', odds: '4.5' },
            { name: 'ジャスティンパレス', aiProb: '14.0', odds: '6.0' },
            { name: 'タイトルホルダー', aiProb: '9.0', odds: '11.0' },
            { name: 'リバティアイランド', aiProb: '6.0', odds: '18.0' },
            { name: 'スターズオンアース', aiProb: '5.0', odds: '22.0' }
        ]
    },
    {
        name: '第173回 天皇賞（春） (G1)',
        date: '2026-05-03',
        venue: '京都競馬場',
        distance: '3200m 芝',
        horses: [
            { name: 'タイトルホルダー', aiProb: '28.0', odds: '3.0' },
            { name: 'テーオーロイヤル', aiProb: '20.0', odds: '4.2' },
            { name: 'サリエラ', aiProb: '15.0', odds: '7.5' },
            { name: 'ドゥレッツァ', aiProb: '10.0', odds: '11.0' },
            { name: 'シルヴァーソニック', aiProb: '8.0', odds: '16.0' }
        ]
    },
    {
        name: '第67回 宝塚記念 (G1)',
        date: '2026-06-28',
        venue: '阪神競馬場',
        distance: '2200m 芝',
        horses: []
    },
    {
        name: '第45回 ジャパンカップ (G1)',
        date: '2025-11-30',
        venue: '中央競馬場（東京）',
        distance: '2400m 芝',
        horses: []
    }
];

function initSearch() {
    const input = document.getElementById('raceSearchInput');
    const dropdown = document.getElementById('raceSearchDropdown');

    if (!input || !dropdown) return;

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-input-wrapper')) {
            dropdown.classList.add('hidden');
        }
    });

    input.addEventListener('focus', () => renderSearch(input.value));
    input.addEventListener('input', (e) => renderSearch(e.target.value));

    function renderSearch(query) {
        const q = query.trim().toLowerCase();
        let results = MOCK_RACES;
        if (q) {
            results = MOCK_RACES.filter(r =>
                r.name.toLowerCase().includes(q) ||
                r.venue.includes(q) ||
                r.distance.includes(q)
            );
        }

        if (results.length === 0) {
            dropdown.innerHTML = '<div class="search-item"><div class="search-item-meta">該当するレースが見つかりません</div></div>';
            dropdown.classList.remove('hidden');
            return;
        }

        dropdown.innerHTML = results.map((r, i) => `
            <div class="search-item" data-index="${MOCK_RACES.indexOf(r)}">
                <div class="search-item-title">${escHtml(r.name)}</div>
                <div class="search-item-meta">📅 ${r.date} &nbsp;|&nbsp; 📍 ${r.venue} &nbsp;|&nbsp; 🏇 ${r.distance}</div>
            </div>
        `).join('');

        dropdown.querySelectorAll('.search-item').forEach(item => {
            item.addEventListener('click', () => {
                const idx = item.dataset.index;
                if (idx !== undefined) selectRace(MOCK_RACES[idx]);
                dropdown.classList.add('hidden');
                input.value = ''; // 選択後はクリア
            });
        });

        dropdown.classList.remove('hidden');
    }
}

function selectRace(race) {
    document.getElementById('raceName').value = race.name;
    document.getElementById('raceDate').value = race.date;

    const venueSelect = document.getElementById('raceVenue');
    let optionExists = Array.from(venueSelect.options).some(opt => opt.value === race.venue || opt.text === race.venue);
    if (!optionExists) {
        const opt = document.createElement('option');
        opt.value = opt.text = race.venue;
        venueSelect.add(opt);
    }
    Array.from(venueSelect.options).forEach(opt => {
        if (opt.value === race.venue || opt.text === race.venue) opt.selected = true;
    });

    document.getElementById('raceDistance').value = race.distance;

    // Load available horses or reset
    if (race.horses && race.horses.length > 0) {
        horses = [];
        race.horses.forEach((h, i) => {
            addHorse({ ...h, num: i + 1 });
        });
        while (horses.length < 5) addHorse();
    } else {
        horses = [];
        for (let i = 0; i < 5; i++) addHorse();
    }

    document.getElementById('resultsPanel').style.display = 'none';
    window._analyzedData = null;

    showToast(`「${race.name}」を選択しました`, 'success');
}

// ── Helpers ───────────────────────────────────────────────────

function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
