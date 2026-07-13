const STORAGE_KEY = 'kioku-desk-notes';
const seed = [
  { title: '週末に見たい映画を3本選ぶ', type: 'idea', tag: 'あとで', time: '8分前', done: false },
  { title: '金曜 19:00 友だちと中目黒でごはん', type: 'plan', tag: '予定', time: '32分前', done: false },
  { title: '新しいサービスの名前、もっと余白のある感じに', type: 'idea', tag: 'プロジェクト', time: '1時間前', done: false }
];
const icons = { idea: '💡', task: '☑', plan: '◷', note: '✎' };
let notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || seed;
let view = 'inbox';
const $ = (selector) => document.querySelector(selector);
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
const filteredNotes = () => {
  const query = $('#search-input').value.trim().toLowerCase();
  return notes.filter((note) => {
    const matchesView = view === 'inbox' ? notes.indexOf(note) < 3 : view === 'today' ? ['plan', 'task'].includes(note.type) : true;
    return matchesView && (!query || `${note.title} ${note.tag}`.toLowerCase().includes(query));
  });
};
function render() {
  const list = filteredNotes();
  $('#inbox-count').textContent = notes.length;
  $('#section-title').textContent = view === 'inbox' ? 'あとで整理する' : view === 'today' ? '今日の予定とタスク' : 'すべてのメモ';
  $('#section-subtitle').textContent = `${list.length}件`;
  $('#items').innerHTML = list.length ? list.map((note) => `<article class="item"><button class="check ${note.done ? 'checked' : ''}" data-id="${note.id}" aria-label="${note.done ? '未完了に戻す' : '完了にする'}">${note.done ? '✓' : ''}</button><div><p class="item-title ${note.done ? 'done' : ''}">${escapeHtml(note.title)}</p><div class="meta"><span>${icons[note.type]}</span><span class="tag">${escapeHtml(note.tag)}</span></div></div><span class="time">${note.time}</span></article>`).join('') : '<div class="empty">ここにはまだメモがありません</div>';
}
function escapeHtml(value) { return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
$('#capture-form').addEventListener('submit', (event) => { event.preventDefault(); const input = $('#capture-input'); const title = input.value.trim(); if (!title) return; const type = $('#capture-type').value; notes.unshift({ id: crypto.randomUUID(), title, type, tag: type === 'task' ? 'やること' : type === 'plan' ? '予定' : '未整理', time: 'たった今', done: false }); save(); input.value = ''; view = 'inbox'; document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.view === view)); render(); });
document.querySelector('.tabs').addEventListener('click', (event) => { const tab = event.target.closest('.tab'); if (!tab) return; view = tab.dataset.view; document.querySelectorAll('.tab').forEach((item) => item.classList.toggle('active', item === tab)); render(); });
$('#items').addEventListener('click', (event) => { const button = event.target.closest('.check'); if (!button) return; const note = notes.find((item) => item.id === button.dataset.id); if (note) { note.done = !note.done; save(); render(); } });
$('#search-toggle').addEventListener('click', () => { const row = $('#search-row'); row.hidden = !row.hidden; if (!row.hidden) $('#search-input').focus(); });
$('#search-close').addEventListener('click', () => { $('#search-row').hidden = true; $('#search-input').value = ''; render(); });
$('#search-input').addEventListener('input', render);
document.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key === '/') { event.preventDefault(); $('#capture-input').focus(); } });
if (!notes.every((note) => note.id)) { notes = notes.map((note) => ({ ...note, id: note.id || crypto.randomUUID() })); save(); }
render();
