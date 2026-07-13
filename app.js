const STORAGE_KEY = 'kioku-desk-notes';
const seed = [
  { title: '週末に見たい映画を3本選ぶ', type: 'idea', tag: 'あとで', time: '8分前', done: false },
  { title: '金曜 19:00 友だちと中目黒でごはん', type: 'plan', tag: '予定', time: '32分前', done: false },
  { title: '新しいサービスの名前、もっと余白のある感じに', type: 'idea', tag: 'プロジェクト', time: '1時間前', done: false }
];
const icons = { idea: '💡', task: '☑', plan: '◷', note: '✎' };
let notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || seed;
let view = 'inbox';
let revisitIndex = 0;
let calendarDate = new Date();
let selectedDate = toISODate(new Date());
let lifeMode = false;
const $ = (selector) => document.querySelector(selector);
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
const now = new Date();
const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
function toISODate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function dateLabel(iso) { return new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(`${iso}T00:00:00`)); }
const filteredNotes = () => {
  const query = $('#search-input').value.trim().toLowerCase();
  return notes.filter((note) => {
    const matchesView = view === 'inbox' ? notes.indexOf(note) < 3 : view === 'today' ? ['plan', 'task'].includes(note.type) : true;
    return matchesView && (!query || `${note.title} ${note.tag}`.toLowerCase().includes(query));
  });
};
function render() {
  if (view === 'calendar') { renderCalendar(); return; }
  $('#notes-section').hidden = false; $('#calendar-view').hidden = true;
  const list = filteredNotes();
  $('#inbox-count').textContent = notes.length;
  $('#section-title').textContent = view === 'inbox' ? 'あとで整理する' : view === 'today' ? '今日の予定とタスク' : 'すべてのメモ';
  $('#section-subtitle').textContent = `${list.length}件`;
  const monthNotes = notes.filter((note) => note.monthKey === monthKey || !note.monthKey);
  $('#month-count').textContent = `${monthNotes.length}件`;
  $('#month-progress').style.width = `${Math.min(100, Math.max(8, monthNotes.length * 8))}%`;
  $('#streak-copy').textContent = monthNotes.length >= 7 ? 'いいペースです。記憶が育っています。' : monthNotes.length ? 'この調子で、今日もひとつ。' : 'まずはひとつ、今日の記録を。';
  const revisitNotes = notes.filter((note) => note.title && note.time !== 'たった今');
  if (revisitNotes.length) { const note = revisitNotes[revisitIndex % revisitNotes.length]; $('#revisit-text').textContent = `「${note.title}」`; $('#revisit-card').hidden = false; } else { $('#revisit-card').hidden = true; }
  $('#items').innerHTML = list.length ? list.map((note) => `<article class="item"><button class="check ${note.done ? 'checked' : ''}" data-id="${note.id}" aria-label="${note.done ? '未完了に戻す' : '完了にする'}">${note.done ? '✓' : ''}</button><div><p class="item-title ${note.done ? 'done' : ''}">${escapeHtml(note.title)}</p><div class="meta"><span>${icons[note.type]}</span><span class="tag">${escapeHtml(note.tag)}</span></div></div><span class="time">${note.time}</span></article>`).join('') : '<div class="empty">ここにはまだメモがありません</div>';
}
function renderCalendar() {
  $('#notes-section').hidden = true; $('#calendar-view').hidden = false;
  const year = calendarDate.getFullYear(); const month = calendarDate.getMonth();
  $('#calendar-title').textContent = new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long' }).format(calendarDate);
  const first = new Date(year, month, 1); const start = (first.getDay() + 6) % 7; const days = new Date(year, month + 1, 0).getDate();
  const cells = []; for (let i = 0; i < start; i += 1) cells.push('<div class="calendar-day is-empty"></div>');
  for (let day = 1; day <= days; day += 1) { const iso = toISODate(new Date(year, month, day)); const dayNotes = notes.filter((note) => note.date === iso); const isToday = iso === toISODate(new Date()); const isSelected = iso === selectedDate; cells.push(`<button type="button" class="calendar-day ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}" data-date="${iso}"><span>${day}</span>${dayNotes.length ? `<b>${dayNotes.length}</b><i>${icons[dayNotes[0].type]}</i>` : ''}</button>`); }
  $('#calendar-grid').innerHTML = cells.join('');
  const selectedNotes = notes.filter((note) => note.date === selectedDate);
  $('#calendar-detail').innerHTML = `<div class="calendar-detail-head"><span>${dateLabel(selectedDate)}</span><strong>${selectedNotes.length}件</strong></div>${selectedNotes.length ? selectedNotes.map((note) => `<div class="calendar-note"><span>${icons[note.type]}</span><span>${escapeHtml(note.title)}</span></div>`).join('') : '<p class="calendar-empty">この日の記録はまだありません</p>'}`;
}
function escapeHtml(value) { return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
$('#capture-form').addEventListener('submit', (event) => { event.preventDefault(); const input = $('#capture-input'); const title = input.value.trim(); if (!title) return; const type = $('#capture-type').value; notes.unshift({ id: crypto.randomUUID(), title, type, tag: type === 'task' ? 'やること' : type === 'plan' ? '予定' : '未整理', time: 'たった今', monthKey, date: $('#capture-date').value || toISODate(new Date()), done: false }); save(); input.value = ''; view = 'inbox'; document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.view === view)); render(); showSavedFeedback(); });
document.querySelector('.tabs').addEventListener('click', (event) => { const tab = event.target.closest('.tab'); if (!tab) return; view = tab.dataset.view; document.querySelectorAll('.tab').forEach((item) => item.classList.toggle('active', item === tab)); render(); });
$('#calendar-prev').addEventListener('click', () => { calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1); renderCalendar(); });
$('#calendar-next').addEventListener('click', () => { calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1); renderCalendar(); });
$('#calendar-grid').addEventListener('click', (event) => { const day = event.target.closest('[data-date]'); if (!day) return; selectedDate = day.dataset.date; renderCalendar(); });
$('#export-calendar').addEventListener('click', () => {
  const events = notes.filter((note) => note.type === 'plan' || note.tag === '予定');
  const header = ['Subject', 'Start Date', 'Start Time', 'End Date', 'End Time', 'All Day Event', 'Description'];
  const rows = events.map((note) => [note.title, note.date || toISODate(new Date()), '', note.date || toISODate(new Date()), '', 'True', `${note.tag} / 記憶デスク`]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `kioku-desk-calendar-${toISODate(new Date())}.csv`; link.click(); URL.revokeObjectURL(url);
  const button = $('#export-calendar'); button.textContent = `${events.length}件を書き出しました ✓`; setTimeout(() => { button.textContent = 'CSVを書き出す ↓'; }, 1800);
});
$('#items').addEventListener('click', (event) => { const button = event.target.closest('.check'); if (!button) return; const note = notes.find((item) => item.id === button.dataset.id); if (note) { note.done = !note.done; save(); render(); } });
$('#search-toggle').addEventListener('click', () => { const row = $('#search-row'); row.hidden = !row.hidden; if (!row.hidden) $('#search-input').focus(); });
$('#search-close').addEventListener('click', () => { $('#search-row').hidden = true; $('#search-input').value = ''; render(); });
$('#search-input').addEventListener('input', render);
$('#life-mode-toggle').addEventListener('click', () => { lifeMode = !lifeMode; const hideInMemory = ['.memory-hero', '.capture-panel', '.memory-overview', '#memory-workspace']; hideInMemory.forEach((selector) => { const element = $(selector); if (element) element.hidden = lifeMode; }); $('#life-mode').hidden = !lifeMode; $('#life-mode-toggle').textContent = lifeMode ? '記憶デスクへ' : '人生タイマー'; if (lifeMode && window.refreshLifeNative) window.refreshLifeNative(); });
document.querySelector('.prompt-row').addEventListener('click', (event) => { const chip = event.target.closest('.prompt-chip'); if (!chip) return; const input = $('#capture-input'); input.value = chip.dataset.prompt; input.focus(); });
$('#revisit-button').addEventListener('click', () => { revisitIndex += 1; render(); });
function showSavedFeedback() { const button = document.querySelector('.primary-button'); const original = button.innerHTML; button.innerHTML = '記録しました ✦'; button.classList.add('saved'); setTimeout(() => { button.innerHTML = original; button.classList.remove('saved'); }, 1400); }
const hour = new Date().getHours(); $('#daily-message').textContent = hour < 11 ? '朝のひらめきを残そう' : hour < 18 ? '今日の一瞬を残そう' : '今日の記憶をしまおう';
document.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key === '/') { event.preventDefault(); $('#capture-input').focus(); } });
if (!notes.every((note) => note.id && note.date)) { notes = notes.map((note) => ({ ...note, id: note.id || crypto.randomUUID(), date: note.date || toISODate(new Date()) })); save(); }
$('#capture-date').value = toISODate(new Date());
render();
