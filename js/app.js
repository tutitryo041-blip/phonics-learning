/* 画面の うごき */
(function () {
  const P = window.Phonics;
  const $ = (id) => document.getElementById(id);
  let state = P.loadState();
  let answered = false;

  const KIND_LABEL = { new: 'あたらしい', miss: 'まえの ミス', review: 'ふくしゅう' };

  function save() {
    P.saveState(state);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ルールで だいじな もじに いろを つける
  function highlight(word, unitIdx) {
    const u = P.UNITS[unitIdx];
    if (!u || !u.focus) return esc(word);
    const re = new RegExp(u.focus, 'g');
    let out = '';
    let last = 0;
    let m;
    while ((m = re.exec(word)) !== null) {
      if (m[0] === '') {
        re.lastIndex++;
        continue;
      }
      out += esc(word.slice(last, m.index)) + '<mark>' + esc(m[0]) + '</mark>';
      last = m.index + m[0].length;
    }
    return out + esc(word.slice(last));
  }

  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => (s.hidden = s.id !== id));
    window.scrollTo(0, 0);
  }

  function ensureCurrent() {
    if (!state.current) {
      const plan = P.buildDay(state);
      state.current = {
        date: P.today(),
        units: plan.units,
        mode: plan.mode,
        counts: plan.counts,
        messages: plan.messages,
        questions: plan.questions,
        answers: [],
        ruleShown: false,
      };
      save();
    }
    return state.current;
  }

  /* ---------- ホーム ---------- */
  function renderHome() {
    const today = P.today();
    const last = state.sessions[state.sessions.length - 1];
    const doneToday = last && last.date === today && !state.current;
    $('home-day').textContent = `${P.dayNumber(state, today)}にちめ`;

    const msgs = $('home-messages');
    msgs.innerHTML = '';
    if (doneToday) {
      [`きょうの ${P.DAILY}もんは おわり！ ${last.accuracy}％ だったよ。`, P.describeNext(state), 'また あした やろうね。 もっと やりたい ときは もう1かい できるよ。'].forEach((t) => {
        const li = document.createElement('li');
        li.textContent = t;
        msgs.appendChild(li);
      });
      $('home-counts').textContent = '';
      $('btn-start').textContent = 'もう1かい やる';
    } else {
      const cur = ensureCurrent();
      cur.messages.forEach((t) => {
        const li = document.createElement('li');
        li.textContent = t;
        msgs.appendChild(li);
      });
      const c = cur.counts;
      $('home-counts').textContent = `あたらしい ${c.new}もん ・ まえの ミス ${c.miss}もん ・ ふくしゅう ${c.review}もん`;
      $('btn-start').textContent = cur.answers.length > 0 ? `つづきから（${cur.answers.length + 1}もんめ）` : 'はじめる';
    }

    const done = Math.min(state.unit, P.UNITS.length);
    $('home-bar').style.width = `${(done / P.UNITS.length) * 100}%`;
    $('home-progress').textContent =
      done >= P.UNITS.length
        ? `ぜんぶの ルール（${P.UNITS.length}こ）を クリア！`
        : `${P.UNITS.length}この ルールの うち ${done}こ クリア。 いまは「${P.UNITS[state.unit].title}」。`;
    show('home');
  }

  function start() {
    const cur = ensureCurrent();
    if (cur.units.length > 0 && !cur.ruleShown && cur.answers.length === 0) {
      renderRule(false);
    } else {
      renderQuiz();
    }
  }

  /* ---------- ルール ---------- */
  function ruleHTML(unitIdx) {
    const u = P.UNITS[unitIdx];
    const ex = u.words.slice(0, 3);
    return `
      <h2>${esc(u.title)}</h2>
      ${u.explain.map((t) => `<p>${esc(t)}</p>`).join('')}
      <div class="examples">
        ${ex.map((w) => `<div class="ex"><span class="ex-w" lang="en">${highlight(w.w, unitIdx)}</span><span class="ex-k">${esc(w.main)}</span></div>`).join('')}
      </div>`;
  }

  function renderRule(fromQuiz) {
    const cur = state.current;
    const isNew = cur.mode === 'start' || cur.mode === 'normal' || cur.mode === 'fast';
    $('rule-label').textContent = fromQuiz ? 'ルール' : isNew ? 'きょうの あたらしい ルール' : 'ルールを おもいだそう';
    $('rule-body').innerHTML = cur.units.map(ruleHTML).join('<hr>');
    $('btn-rule-ok').textContent = fromQuiz ? 'もんだいに もどる' : 'わかった！ もんだいへ';
    show('rule');
  }

  /* ---------- もんだい ---------- */
  function renderQuiz() {
    const cur = state.current;
    const i = cur.answers.length;
    if (i >= cur.questions.length) return finish();
    const q = cur.questions[i];
    $('quiz-num').textContent = `${i + 1} / ${cur.questions.length}`;
    $('quiz-kind').textContent = KIND_LABEL[q.kind] || '';
    $('quiz-kind').className = `badge ${q.kind}`;
    $('btn-show-rule').hidden = cur.units.length === 0;
    $('quiz-bar').style.width = `${(i / cur.questions.length) * 100}%`;
    $('quiz-word').innerHTML = highlight(q.w, q.unit);
    $('quiz-input').value = '';
    $('quiz-input').disabled = false;
    $('btn-answer').hidden = false;
    $('feedback').hidden = true;
    answered = false;
    show('quiz');
    $('quiz-input').focus();
  }

  function answer() {
    if (answered) return next();
    const cur = state.current;
    const q = cur.questions[cur.answers.length];
    const input = $('quiz-input').value;
    if (!P.normalize(input)) return;
    const word = P.WORDS[q.w];
    const ok = P.isCorrect(input, word);
    cur.answers.push({ w: q.w, kind: q.kind, answer: input, correct: ok });
    save();
    answered = true;

    $('quiz-input').disabled = true;
    $('btn-answer').hidden = true;
    $('feedback').hidden = false;
    $('feedback').className = `feedback ${ok ? 'ok' : 'ng'}`;
    $('fb-mark').textContent = ok ? '⭕ せいかい！' : '❌ ざんねん';
    const others = word.k.filter((k) => k !== P.normalize(input) && k !== word.main);
    if (ok) {
      $('fb-text').textContent = `${q.w} ＝ ${P.normalize(input)}`;
      $('fb-hint').textContent = others.length && P.normalize(input) !== word.main ? `「${word.main}」とも かけるよ。` : '';
    } else {
      $('fb-text').innerHTML = `${esc(q.w)} は「<strong>${esc(word.main)}</strong>」と よむよ。`;
      const near = P.nearMissHint(input, word);
      const unit = P.UNITS[word.unit];
      $('fb-hint').textContent = near || unit.hint;
    }
    $('btn-next').textContent = cur.answers.length >= cur.questions.length ? 'けっかを みる' : 'つぎへ';
    $('btn-next').focus();
  }

  function next() {
    renderQuiz();
  }

  /* ---------- けっか ---------- */
  function finish() {
    const cur = state.current;
    const result = { date: P.today(), units: cur.units, mode: cur.mode, answers: cur.answers };
    state = P.applyResult(state, result);
    save();
    const s = state.sessions[state.sessions.length - 1];

    $('res-score').textContent = `${s.correct} / ${s.total}（${s.accuracy}％）`;
    let msg;
    if (cur.units.length === 0) msg = 'ふくしゅう おつかれさま！';
    else if (s.passed) msg = s.accuracy === 100 ? 'ぜんもん せいかい！ ごうかく 🎉' : 'ごうかく！ 🎉 よく がんばったね。';
    else msg = `ごうかくは ${Math.round(P.PASS * 100)}％ から。 あと すこし！ つぎも いっしょに れんしゅうしよう。`;
    $('res-msg').textContent = msg;

    const wrong = cur.answers.filter((a) => !a.correct);
    $('res-missed').innerHTML = wrong.length
      ? `<p class="label">まちがえた たんご（つぎの かいに また でるよ）</p>
         <table class="missed"><tr><th>えいご</th><th>こたえ</th><th>あなたの こたえ</th></tr>
         ${wrong.map((a) => `<tr><td lang="en">${esc(a.w)}</td><td>${esc(P.WORDS[a.w].main)}</td><td>${esc(a.answer)}</td></tr>`).join('')}
         </table>`
      : '';
    $('res-next').textContent = P.describeNext(state);
    show('result');
  }

  /* ---------- りれき ---------- */
  function renderHistory() {
    const list = $('hist-list');
    if (state.sessions.length === 0) {
      list.innerHTML = '<p>まだ りれきが ないよ。</p>';
    } else {
      list.innerHTML = state.sessions
        .slice()
        .reverse()
        .map((s) => {
          const titles = s.units.length ? s.units.map((u) => P.UNITS[u].title).join(' ＋ ') : 'ふくしゅう';
          return `<div class="hist ${s.passed ? 'ok' : 'ng'}">
            <div class="hist-head"><span class="date">${esc(s.date)}</span><span class="acc">${s.accuracy}％ ${s.passed ? 'ごうかく' : ''}</span></div>
            <div class="hist-unit">${esc(titles)}</div>
            <div class="hist-miss">${s.missed.length ? 'ミス：' + s.missed.map(esc).join(', ') : 'ミス なし'}</div>
          </div>`;
        })
        .join('');
    }
    show('history');
  }

  function doExport() {
    const blob = new Blob([P.exportJSON(state)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `phonics-${P.today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function doImport(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        state = P.importJSON(reader.result);
        save();
        alert('よみこみました。');
        renderHistory();
      } catch (e) {
        alert('よみこめませんでした：' + e.message);
      }
    };
    reader.readAsText(file);
  }

  /* ---------- イベント ---------- */
  document.querySelectorAll('[data-go]').forEach((b) =>
    b.addEventListener('click', () => (b.dataset.go === 'history' ? renderHistory() : renderHome()))
  );
  $('btn-start').addEventListener('click', start);
  $('btn-rule-ok').addEventListener('click', () => {
    state.current.ruleShown = true;
    save();
    renderQuiz();
  });
  $('btn-show-rule').addEventListener('click', () => renderRule(true));
  $('quiz-form').addEventListener('submit', (e) => {
    e.preventDefault();
    answer();
  });
  // かな漢字変換中の Enter では こたえない
  $('quiz-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.isComposing || e.keyCode === 229)) e.preventDefault();
  });
  $('btn-next').addEventListener('click', next);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && answered && !$('quiz').hidden && document.activeElement !== $('btn-next')) {
      e.preventDefault();
      next();
    }
  });
  $('btn-export').addEventListener('click', doExport);
  $('file-import').addEventListener('change', (e) => e.target.files[0] && doImport(e.target.files[0]));
  $('btn-reset').addEventListener('click', () => {
    if (confirm('りれきを ぜんぶ けして、さいしょから はじめますか？（もとに もどせません）')) {
      state = P.newState();
      save();
      renderHome();
    }
  });

  renderHome();
})();
