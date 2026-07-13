(() => {
  const $ = (id) => document.getElementById(id);
  const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const esc = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const icons = { idea: '💡', task: '☑', plan: '◷', note: '✎' };
  let loaded = LifeStore.load(localStorage);
  let lifeData = loaded.data || LifeStore.emptyData();
  let deathDate = null;
  let familyDeaths = new Map();
  let activeLifeView = 'timer';
  let timerId = null;

  function recompute() {
    if (!lifeData.self) { deathDate = null; familyDeaths = new Map(); return; }
    const now = new Date();
    deathDate = TimeCalc.expectedDeathDate(lifeData.self, now);
    familyDeaths = new Map(lifeData.family.map((person) => [person.id, TimeCalc.expectedDeathDate(person, now)]));
  }
  function persist() { LifeStore.save(localStorage, lifeData); recompute(); renderLife(); }
  function formatCountdown(breakdown) { if (breakdown.expired) return '統計を超えて生きています'; return `${breakdown.years}年 ${breakdown.months}ヶ月 ${breakdown.days}日 ${String(breakdown.hours).padStart(2, '0')}:${String(breakdown.minutes).padStart(2, '0')}:${String(breakdown.seconds).padStart(2, '0')}`; }
  function currentToday() { return lifeData.today && lifeData.today.date === todayStr() ? lifeData.today : null; }
  function renderTimer() {
    if (!lifeData.self || !deathDate) return;
    const now = new Date();
    $('life-countdown').textContent = formatCountdown(TimeCalc.breakdown(now, deathDate));
    const progress = TimeCalc.progressPercent(lifeData.self.birthDate, deathDate, now);
    $('life-progress-bar').style.width = `${progress.toFixed(2)}%`;
    $('life-progress-text').textContent = `人生の ${progress.toFixed(1)}% を生きました`;
    const current = currentToday();
    $('life-today-form').hidden = !!current;
    $('life-today-set').hidden = !current;
    if (current) { $('life-today-text').textContent = current.text; $('life-today-done').checked = current.done; }
    const reflection = (lifeData.reflections || []).find((item) => item.date === todayStr());
    if (document.activeElement !== $('life-reflection-input')) $('life-reflection-input').value = reflection ? reflection.text : '';
  }
  function renderInsight() {
    if (!lifeData.self || !deathDate) return;
    $('life-insight-cards').innerHTML = Insight.build(lifeData.self, deathDate, new Date()).map((card) => `<article class="life-insight-card ${card.id === 'death-prob' ? 'is-highlight' : ''}"><p>${esc(card.label)}</p><strong>${esc(card.value)}</strong><small>${esc(card.sub)}</small></article>`).join('');
  }
  function renderFamily() {
    const list = $('life-family-list');
    if (!lifeData.self) { list.innerHTML = '<p class="life-muted">まず「わたし」を設定してください。</p>'; return; }
    list.innerHTML = lifeData.family.length ? lifeData.family.map((person) => { const end = familyDeaths.get(person.id); const remain = TimeCalc.breakdown(new Date(), end); const meets = TimeCalc.meetCount(deathDate, end, person.meetFrequency, new Date()); return `<article class="life-person"><div><strong>${esc(person.name)}</strong><p>残り ${remain.expired ? '—' : `${remain.years}年${remain.months}ヶ月`}</p></div><div class="life-meets">あと<strong>${meets.toLocaleString()}</strong>回</div><button type="button" class="life-delete" data-delete-family="${person.id}" aria-label="${esc(person.name)}を削除">×</button></article>`; }).join('') : '<p class="life-muted life-empty-state">大切な人を追加すると、あと何回会えるかが見えてきます。</p>';
  }
  function renderWishes() {
    const list = $('life-wish-list');
    const active = lifeData.wishes.filter((wish) => !wish.done);
    const done = lifeData.wishes.filter((wish) => wish.done);
    const item = (wish) => { const remain = lifeData.self && wish.targetAge ? TimeCalc.childRemainingDays(lifeData.self.birthDate, wish.targetAge, new Date()) : null; return `<article class="life-wish ${wish.done ? 'is-done' : ''}"><label><input type="checkbox" data-wish-id="${wish.id}" ${wish.done ? 'checked' : ''}><span>${esc(wish.title)}</span></label>${remain ? `<small>${remain.expired ? '期限を過ぎました' : `あと${remain.days.toLocaleString()}日`}</small>` : ''}<button type="button" class="life-delete" data-delete-wish="${wish.id}" aria-label="削除">×</button></article>`; };
    list.innerHTML = active.length || done.length ? [...active, ...done].map(item).join('') : '<p class="life-muted life-empty-state">最初のやりたいことを書いてみましょう。</p>';
  }
  function renderLife() {
    recompute();
    const hasProfile = !!lifeData.self;
    $('life-onboarding').hidden = hasProfile;
    $('life-panel-timer').hidden = !hasProfile || activeLifeView !== 'timer';
    $('life-panel-insight').hidden = !hasProfile || activeLifeView !== 'insight';
    $('life-panel-family').hidden = !hasProfile || activeLifeView !== 'family';
    $('life-panel-wishes').hidden = !hasProfile || activeLifeView !== 'wishes';
    if (!hasProfile) return;
    renderTimer();
    if (activeLifeView === 'insight') renderInsight();
    if (activeLifeView === 'family') renderFamily();
    if (activeLifeView === 'wishes') renderWishes();
  }
  document.querySelectorAll('.life-tab').forEach((tab) => tab.addEventListener('click', () => { activeLifeView = tab.dataset.lifeView; document.querySelectorAll('.life-tab').forEach((item) => item.classList.toggle('active', item === tab)); renderLife(); }));
  $('life-onboarding-form').addEventListener('submit', (event) => { event.preventDefault(); lifeData.self = { name: '', birthDate: $('life-birth').value, gender: $('life-gender').value, customLifespan: null }; persist(); });
  $('life-profile-button').addEventListener('click', () => { $('life-onboarding').hidden = false; $('life-panel-timer').hidden = true; $('life-birth').value = lifeData.self ? lifeData.self.birthDate : ''; $('life-gender').value = lifeData.self ? lifeData.self.gender : ''; });
  $('life-today-form').addEventListener('submit', (event) => { event.preventDefault(); const text = $('life-today-input').value.trim(); if (!text) return; lifeData.today = { date: todayStr(), text, done: false }; $('life-today-input').value = ''; persist(); });
  $('life-today-done').addEventListener('change', (event) => { if (lifeData.today) { lifeData.today.done = event.target.checked; persist(); } });
  $('life-today-clear').addEventListener('click', () => { lifeData.today = null; persist(); });
  $('life-reflection-form').addEventListener('submit', (event) => { event.preventDefault(); const text = $('life-reflection-input').value.trim(); if (!text) return; const date = todayStr(); const existing = (lifeData.reflections || []).find((item) => item.date === date); if (existing) existing.text = text; else lifeData.reflections.push({ date, q: 0, text }); persist(); });
  $('life-add-family').addEventListener('click', () => { $('life-family-form').hidden = false; $('life-family-name').focus(); });
  $('life-family-form').addEventListener('submit', (event) => { event.preventDefault(); lifeData.family.push({ id: LifeStore.newId(), name: $('life-family-name').value.trim(), birthDate: $('life-family-birth').value, gender: $('life-family-gender').value, relationship: 'other', meetFrequency: $('life-family-freq').value, customLifespan: null }); $('life-family-form').reset(); $('life-family-form').hidden = true; persist(); });
  $('life-family-list').addEventListener('click', (event) => { const id = event.target.dataset.deleteFamily; if (!id) return; lifeData.family = lifeData.family.filter((person) => person.id !== id); persist(); });
  $('life-wish-form').addEventListener('submit', (event) => { event.preventDefault(); const title = $('life-wish-title').value.trim(); if (!title) return; lifeData.wishes.push({ id: LifeStore.newId(), title, targetAge: $('life-wish-age').value ? Number($('life-wish-age').value) : null, createdAt: new Date().toISOString(), done: false, doneAt: null, pinned: false }); $('life-wish-form').reset(); persist(); });
  $('life-wish-list').addEventListener('click', (event) => { const wishId = event.target.dataset.wishId; const deleteId = event.target.dataset.deleteWish; if (wishId) { const wish = lifeData.wishes.find((item) => item.id === wishId); if (wish) { wish.done = event.target.checked; wish.doneAt = wish.done ? new Date().toISOString() : null; persist(); } } if (deleteId) { lifeData.wishes = lifeData.wishes.filter((wish) => wish.id !== deleteId); persist(); } });
  window.refreshLifeNative = renderLife;
  recompute();
  renderLife();
  timerId = setInterval(() => { if (lifeData.self && activeLifeView === 'timer') renderTimer(); }, 1000);
})();
