/* global window, document, localStorage */
(() => {
  const LS_VOTES = "gog2026_interest_v1";

  /** @typedef {{ id: string, day: 1 | 2, venue: 'main' | 'small' | 'kubsu', start: string, end?: string|null, format?: string, title: string, speaker?: string, block?: boolean, tbd?: boolean, noVote?: boolean, progress?: boolean, tags?: string[], hidden?: boolean }} Slot */

  const D = window.GORY_I_GOROD_2026_DATA;
  if (!D) console.error('gory-i-gorod: подключите data.js перед main.js');

  const EVENT = D.EVENT;
  const DAY_ISO = { 1: EVENT.day1date, 2: EVENT.day2date };
  const DATA_SPEAKERS = D.SPEAKERS;
  const PROGRAM = D.PROGRAM;
  const PROGRAM_EXTRA = D.PROGRAM_EXTRA;

  const speakerById = Object.fromEntries(DATA_SPEAKERS.map((s) => [s.id, s]));

  /** @type {Slot[]} */
  const SLOTS = [];

  function hallToVenue(hall) {
    if (hall === 'Малый зал') return 'small';
    if (hall === 'КубГУ') return 'kubsu';
    return 'main';
  }

  function parseTimeRange(timeStr) {
    if (!timeStr) return { start: '09:00', end: null };
    if (/после/i.test(String(timeStr))) return { start: '18:00', end: '21:00' };
    const s = String(timeStr).trim();
    const m = s.match(/^(\d{1,2}:\d{2})\s*[\u2013\u2014-]\s*(\d{1,2}:\d{2})$/);
    if (m) return { start: m[1], end: m[2] };
    return { start: s, end: null };
  }

  function formatTypeLabel(type) {
    const m = {
      service: '',
      opening: 'Торжественное открытие',
      closing: 'Торжественное закрытие',
      plenary: 'Пленарная сессия',
      solo: 'Доклад',
      discussion: 'Дискуссия',
      qa: 'Вопрос-ответ',
      interview: 'Интервью',
    };
    return m[type] || '';
  }

  function formatSpeakerLineFromItem(item) {
    if (item.speakerIds && item.speakerIds.length) {
      return item.speakerIds
        .map((id) => {
          const sp = speakerById[id];
          if (!sp) return `**${id}**`;
          const on = sp.online ? ' (онлайн)' : '';
          return `**${sp.name}**${on} — ${sp.role}`;
        })
        .join(' · ');
    }
    if (item.speakers && item.speakers.length) return item.speakers.join(' · ');
    return '';
  }

  function shouldNoVote(item) {
    if (['service', 'opening', 'closing'].includes(item.type)) return true;
    if (item.topic === 'TBD' && !(item.speakerIds && item.speakerIds.length)) return true;
    if (item.type === 'qa' && !(item.speakerIds && item.speakerIds.length)) return true;
    return false;
  }

  function shouldProgress(item) {
    if (shouldNoVote(item)) return false;
    if (item.block && !(item.speakerIds && item.speakerIds.length)) {
      return item.type === 'discussion' || item.type === 'plenary';
    }
    return ['solo', 'plenary', 'discussion', 'qa', 'interview'].includes(item.type);
  }

  function deriveTags(item) {
    if (!(item.speakerIds && item.speakerIds.length)) return undefined;
    return [item.type].filter(Boolean);
  }

  function pushProgramRows(rows) {
    let prevBlock = null;
    for (const item of rows) {
      const venue = hallToVenue(item.hall);
      const { start, end } = parseTimeRange(item.time);

      if (item.block) {
        if (item.block !== prevBlock) {
          SLOTS.push({
            id: `${item.id}__block`,
            day: /** @type {1|2} */ (item.day),
            venue,
            start,
            end: null,
            format: '',
            title: item.block,
            block: true,
            noVote: true,
            progress: false,
          });
          prevBlock = item.block;
        }
      } else {
        prevBlock = null;
      }

      const spLine = formatSpeakerLineFromItem(item);
      let formatStr = '';
      if (item.type === 'service') {
        if (item.topic.includes('Регистрация')) formatStr = `Регистрация (${item.hall})`;
        else if (item.topic.includes('Кофе')) formatStr = `Кофе-брейк (${item.hall})`;
        else formatStr = item.hall;
      } else if (item.type === 'opening') formatStr = 'Торжественное открытие';
      else if (item.type === 'closing') formatStr = item.day === 2 ? 'Торжественное закрытие' : '';
      else {
        const tl = formatTypeLabel(item.type);
        formatStr = [tl, item.hall].filter(Boolean).join(' · ');
      }

      SLOTS.push({
        id: item.id,
        day: /** @type {1|2} */ (item.day),
        venue,
        start,
        end,
        format: formatStr,
        title: item.topic,
        speaker: spLine || undefined,
        block: false,
        tbd: item.topic === 'TBD',
        noVote: shouldNoVote(item),
        progress: shouldProgress(item),
        tags: deriveTags(item),
      });
    }
  }

  function pushExtraRows() {
    for (const ex of PROGRAM_EXTRA) {
      const venue = hallToVenue(ex.hall);
      const { start, end } = parseTimeRange(ex.time);
      const item = {
        speakerIds: ex.speakerIds,
        speakers: ex.speakers,
      };
      const spLine = formatSpeakerLineFromItem(item);
      SLOTS.push({
        id: ex.id,
        day: /** @type {1|2} */ (ex.day),
        venue,
        start,
        end,
        format: `${ex.format} · ${ex.hall}`,
        title: ex.topic,
        speaker: spLine || (ex.speakers ? ex.speakers.join(' · ') : undefined),
        noVote: false,
        progress: true,
        tags: ['параллель'],
      });
    }
  }

  pushProgramRows(PROGRAM);
  pushExtraRows();

  function topicForSpeakerId(spId) {
    const hit =
      PROGRAM.find((p) => (p.speakerIds || []).includes(spId)) ||
      PROGRAM_EXTRA.find((p) => (p.speakerIds || []).includes(spId));
    return hit ? hit.topic : '—';
  }

  function collectSlotIdsForSpeaker(sp) {
    const ids = [];
    const tail = sp.name.split(/\s+/).pop() || sp.name;
    const head = sp.name.split(/\s+/)[0] || '';
    for (const sl of SLOTS) {
      if (String(sl.id).endsWith('__block')) continue;
      const p = PROGRAM.find((x) => x.id === sl.id) || PROGRAM_EXTRA.find((x) => x.id === sl.id);
      if (!p) continue;
      if ((p.speakerIds || []).includes(sp.id)) {
        ids.push(sl.id);
        continue;
      }
      for (const line of p.speakers || []) {
        if (line.includes(tail) || line.includes(head)) {
          ids.push(sl.id);
          break;
        }
      }
    }
    return [...new Set(ids)];
  }

  /** @type {Speaker[]} */
  const SPEAKERS = DATA_SPEAKERS.map((sp) => ({
    key: sp.id,
    name: sp.name,
    role: sp.role,
    topic: topicForSpeakerId(sp.id),
    slotIds: collectSlotIdsForSpeaker(sp),
    times: `${sp.day === 1 ? 'День 1' : 'День 2'}, ${sp.time}`,
  }));

  const VISIBLE_SLOTS = SLOTS.filter((s) => !s.hidden);

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  /** @returns {number} ms */
  function atLocal(dStr, hhmm, dayAdj = 0) {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date(`${dStr}T${pad2(h)}:${pad2(m)}:00`);
    return d.getTime();
  }

  /** Календарная фаза форума по локальному времени устройства (дни 16–17 мая 2026). */
  function localForumPhase(ts = Date.now()) {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    if (y < 2026 || (y === 2026 && m < 5) || (y === 2026 && m === 5 && day < 16)) return "pre";
    if (y > 2026 || (y === 2026 && m > 5) || (y === 2026 && m === 5 && day > 17)) return "post";
    if (day === 16) return "d1";
    if (day === 17) return "d2";
    return "post";
  }

  function slotStartMs(sl) {
    return atLocal(DAY_ISO[sl.day], sl.start);
  }

  function slotEndMs(sl) {
    if (!sl.end) return slotStartMs(sl);
    const [eh, em] = sl.end.split(":").map(Number);
    const [sh, sm] = sl.start.split(":").map(Number);
    let endMs = atLocal(DAY_ISO[sl.day], sl.end);
    const startMs = slotStartMs(sl);
    if (endMs < startMs) endMs += 86400000;
    if (eh === sh && em === sm) return startMs;
    return endMs;
  }

  function votesMap() {
    try {
      return JSON.parse(localStorage.getItem(LS_VOTES) || "{}") || {};
    } catch {
      return {};
    }
  }

  function setVotesMap(m) {
    localStorage.setItem(LS_VOTES, JSON.stringify(m));
  }

  function slotVoteCount(slotId, m) {
    return Number(m[slotId] || 0);
  }

  function speakerTotals(m) {
    const totals = {};
    SPEAKERS.forEach((s) => {
      totals[s.key] = s.slotIds.reduce((acc, sid) => acc + slotVoteCount(sid, m), 0);
    });
    return totals;
  }

  function tagTotalsFromVotes(m) {
    const tally = {};
    VISIBLE_SLOTS.forEach((sl) => {
      const v = slotVoteCount(sl.id, m);
      if (!v || !sl.tags) return;
      sl.tags.forEach((t) => {
        tally[t] = (tally[t] || 0) + v;
      });
    });
    return tally;
  }

  function formatNowClock() {
    const d = new Date();
    return d.toLocaleString("ru-RU", {
      weekday: "short",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const venueOrder = /** @type {const} */ ({ main: 0, small: 1, kubsu: 2 });

  /** @returns {{ now: Slot|null, next: Slot|null, untilNextMin: number|null }} */
  function liveNowNext() {
    const t = Date.now();
    const pri = (v) => venueOrder[v] ?? 99;
    const sorted = [...VISIBLE_SLOTS].sort(
      (a, b) => slotStartMs(a) - slotStartMs(b) || pri(a.venue) - pri(b.venue)
    );

    const active = sorted.filter((sl) => {
      const a = slotStartMs(sl);
      const b = slotEndMs(sl);
      return t >= a && t < b && !sl.block;
    });
    active.sort((a, b) => pri(a.venue) - pri(b.venue) || slotStartMs(a) - slotStartMs(b));
    const now = active.length ? active[0] : null;

    /** @returns {Slot[]} */
    const startsFrom = (ms) =>
      sorted
        .filter((sl) => !sl.block && slotStartMs(sl) >= ms)
        .sort((a, b) => slotStartMs(a) - slotStartMs(b) || pri(a.venue) - pri(b.venue));

    let next = null;
    let untilNextMin = null;
    if (now) {
      const after = startsFrom(slotEndMs(now));
      next = after.find((sl) => sl.id !== now.id) || after[0] || null;
    } else {
      next = sorted.find((sl) => !sl.block && t < slotStartMs(sl)) || null;
    }
    if (next) untilNextMin = Math.max(0, Math.round((slotStartMs(next) - t) / 60000));
    return { now, next, untilNextMin };
  }

  /** Progress: главный зал, текущий календарный день программы или выбранный день если вне диапазона */
  function dayProgress(day, nowMs = Date.now()) {
    const iso = DAY_ISO[day];
    const dayStart = atLocal(iso, "08:00");
    const dayEnd = atLocal(iso, "22:05");
    if (nowMs < dayStart || nowMs > dayEnd) return { passed: null, remaining: null, label: "Вне времени форума" };
    const mainSlots = VISIBLE_SLOTS.filter(
      (s) => s.day === day && s.venue === "main" && s.progress === true && !s.block
    );
    const counts = [];
    mainSlots.forEach((s) => {
      const end = slotEndMs(s);
      if (nowMs >= end) counts.push({ s, state: "passed" });
      else counts.push({ s, state: "remaining" });
    });
    const passed = counts.filter((c) => c.state === "passed").length;
    const remaining = counts.filter((c) => c.state === "remaining").length;
    return { passed, remaining, label: `${passed} прошло · ${remaining} впереди · всего блоков содержания: ${counts.length}` };
  }

  function heatColors(pctMax) {
    if (pctMax >= 66) return "var(--heat-high)";
    if (pctMax >= 33) return "var(--heat-mid)";
    return "var(--heat-low)";
  }

  /** ---------- Rendering ---------- */

  let state = {
    venue: /** @type {'main'|'small'|'kubsu'} */ ("main"),
    day: /** @type {0|1|2} */ (0),
    query: "",
  };

  function matchFilter(sl) {
    if (state.venue !== sl.venue) return false;
    if (state.day === 1 || state.day === 2) {
      if (sl.day !== state.day) return false;
    }
    const q = state.query.trim().toLowerCase();
    if (q) {
      const hay = `${sl.title} ${sl.speaker || ""} ${sl.format || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }

  function renderProgram(root) {
    if (!root) return;
    const cards = VISIBLE_SLOTS.filter(matchFilter);
    root.innerHTML = cards
      .map((sl) => {
        const isBlock = Boolean(sl.block);
        const time = sl.end ? `${sl.start}–${sl.end}` : sl.start;
        const m = votesMap();
        const cnt = slotVoteCount(sl.id, m);
        const voteBtn =
          sl.noVote || isBlock
            ? ""
            : `<button type="button" class="vote-btn" data-slot="${sl.id}" aria-label="Интересно">👍 Интересно <span class="vote-n">${cnt}</span></button>`;
        const fmt = sl.format ? `<span class="slot-format">${escapeHtml(sl.format)}</span>` : "";
        const sp = sl.speaker ? `<p class="slot-sp">${inlineBoldToHtml(sl.speaker)}</p>` : "";
        const tbd = sl.tbd ? '<span class="badge badge--tbd">TBD</span>' : "";
        return `
<article class="slot-card${isBlock ? " slot-card--block" : ""}" id="slot-${sl.id}">
  <div class="slot-card__head">
    <span class="slot-time">${escapeHtml(time)}</span>
    <div class="slot-badges">${fmt}${tbd}</div>
  </div>
  <h3 class="slot-title">${escapeHtml(sl.title)}</h3>
  ${sp}
  <div class="slot-actions">${voteBtn}</div>
</article>`;
      })
      .join("");
    root.querySelectorAll(".vote-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sid = btn.getAttribute("data-slot");
        const vm = votesMap();
        vm[sid] = (vm[sid] || 0) + 1;
        setVotesMap(vm);
        btn.querySelector(".vote-n").textContent = String(vm[sid]);
        syncAiAndHeatmap();
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Данные слотов используют **Имя** как в промпте — превращаем в <strong> без сырого HTML. */
  function inlineBoldToHtml(s) {
    if (!s) return "";
    return String(s)
      .split(/(\*\*[^*]+\*\*)/g)
      .map((part) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
          return `<strong>${escapeHtml(part.slice(2, -2))}</strong>`;
        }
        return escapeHtml(part);
      })
      .join("");
  }

  function renderSpeakers(root) {
    if (!root) return;
    root.innerHTML = SPEAKERS.map((sp) => {
      const initials = sp.name
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase();
      const links = [...new Set(sp.slotIds)]
        .map((id) => {
          const sl = VISIBLE_SLOTS.find((x) => x.id === id);
          if (!sl) return "";
          const day = sl.day === 1 ? "16 мая" : "17 мая";
          return `<a href="#slot-${id}">${escapeHtml(day)} · ${escapeHtml(sl.start)}</a>`;
        })
        .filter(Boolean)
        .join(" · ");
      return `
<article class="sp-card" data-spk="${sp.key}">
  <div class="sp-avatar" aria-hidden="true">${escapeHtml(initials)}</div>
  <h3 class="sp-name">${escapeHtml(sp.name)}</h3>
  <p class="sp-role">${escapeHtml(sp.role)}</p>
  <p class="sp-topic">${escapeHtml(sp.topic)}</p>
  <div class="sp-links">${links}</div>
</article>`;
    }).join("");
  }

  function renderAiPulse(el) {
    if (!el) return;
    const m = votesMap();
    const totals = speakerTotals(m);
    const top = [...SPEAKERS]
      .map((s) => ({ s, n: totals[s.key] }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 5);
    const { now, next, untilNextMin } = liveNowNext();

    let progressHeading = "";
    let progressLabel = "";
    if (now) {
      progressHeading = now.day === 1 ? "16 мая" : "17 мая";
      progressLabel = dayProgress(now.day).label;
    } else {
      const phase = localForumPhase();
      if (phase === "pre") {
        progressHeading = "16–17 мая 2026";
        progressLabel = "Форум проходит **16 и 17 мая** — здесь появится прогресс по главному залу в эти дни.";
      } else if (phase === "post") {
        progressHeading = "16–17 мая 2026";
        progressLabel = "Форум завершён. Спасибо за участие!";
      } else if (phase === "d1") {
        progressHeading = "16 мая";
        progressLabel = dayProgress(1).label;
      } else {
        progressHeading = "17 мая";
        progressLabel = dayProgress(2).label;
      }
    }

    const tagTot = tagTotalsFromVotes(m);
    const hotTag = Object.entries(tagTot).sort((a, b) => b[1] - a[1])[0];

    const hottestSlot = [...VISIBLE_SLOTS].reduce(
      (best, sl) => {
        const v = slotVoteCount(sl.id, m);
        if (!best || v > best.v) return { sl, v };
        return best;
      },
      /** @type {{sl: Slot, v: number}|null} */ (null)
    );

    el.innerHTML = `
<section class="pulse-block">
  <h3>Сейчас на устройстве</h3>
  <p class="pulse-clock">${escapeHtml(formatNowClock())}</p>
</section>
<section class="pulse-block">
  <h3>Слот программы</h3>
  <p class="pulse-now">${now ? `<strong>Сейчас:</strong> ${escapeHtml(now.title)}${now.speaker ? ` — ${inlineBoldToHtml(now.speaker)}` : ""}` : '<span class="muted">Нет активного слота по расписанию</span>'}</p>
  <p class="pulse-next">${
    next
      ? `<strong>Следующее через ${untilNextMin != null ? untilNextMin : "…"} мин.:</strong> ${escapeHtml(next.title)}`
      : '<span class="muted">На сегодня после текущего нет элементов или форум завершён</span>'
  }</p>
</section>
<section class="pulse-block">
  <h3>Прогресс дня (Главный зал)</h3>
  <p class="muted">Правило: блоки содержания (без пауз регистрация/еда/перерывы) текущего дня · форум <strong>16–17 мая 2026</strong></p>
  <p><strong>${escapeHtml(progressHeading)}:</strong> ${inlineBoldToHtml(progressLabel)}</p>
</section>
<section class="pulse-block">
  <h3>Топ‑5 по «Интересно»</h3>
  <ol class="pulse-top">${top.map((x) => `<li><strong>${escapeHtml(x.s.name)}</strong> — ${x.n}</li>`).join("")}</ol>
</section>
<section class="pulse-block">
  <h3>«Горячая тема» по тегам</h3>
  <p>${
    hotTag
      ? `Тег <strong>#${escapeHtml(hotTag[0])}</strong> — суммарно меток голосования: ${hotTag[1]}`
      : '<span class="muted">Ещё нет голосов — нажимайте «Интересно» у сессий</span>'
  }</p>
  ${
    hottestSlot && hottestSlot.v > 0
      ? `<p><strong>Самый «горячий» слот:</strong> ${escapeHtml(hottestSlot.sl.title)} (${hottestSlot.v})</p>`
      : ""
  }
</section>`;
  }

  function renderHeatmap(root) {
    if (!root) return;
    const m = votesMap();
    const totals = speakerTotals(m);
    const max = Math.max(1, ...Object.values(totals));
    const rows = [...SPEAKERS]
      .map((s) => ({ s, n: totals[s.key], pct: Math.round((100 * totals[s.key]) / max) }))
      .sort((a, b) => b.n - a.n);

    root.innerHTML = `
<div class="heat-legend"><span>Золото (макс.)</span><span>Средний</span><span>Низкий</span></div>
<ul class="heat-list">${rows
      .map(
        ({ s, pct }) =>
          `<li><span>${escapeHtml(s.name)}</span><span class="heat-bar" title="${pct}%"><i style="width:${pct}%;background:${heatColors(
            pct
          )}"></i></span><span>${pct}%</span></li>`
      )
      .join("")}
</ul>`;
  }

  function syncAiAndHeatmap() {
    renderAiPulse(document.querySelector("[data-ai-pulse]"));
    renderHeatmap(document.querySelector("[data-heatmap-root]"));
  }

  /** ---------- Tabs / hooks ---------- */

  document.querySelectorAll("[data-vtab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = /** @type {'main'|'small'|'kubsu'} */ (btn.getAttribute("data-vtab"));
      state.venue = v;
      document.querySelectorAll("[data-vtab]").forEach((b) => {
        const on = b.getAttribute("data-vtab") === v;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      renderProgram(document.querySelector("[data-program-root]"));
    });
  });

  document.querySelectorAll("[data-day-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = Number(btn.getAttribute("data-day-filter")) || 0;
      state.day = /** @type {0|1|2} */ (d);
      document.querySelectorAll("[data-day-filter]").forEach((b) => {
        const on = Number(b.getAttribute("data-day-filter") || "0") === state.day;
        b.classList.toggle("is-active", on);
      });
      renderProgram(document.querySelector("[data-program-root]"));
    });
  });

  const searchInput = document.querySelector("[data-program-search]");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      state.query = searchInput.value || "";
      renderProgram(document.querySelector("[data-program-root]"));
    });
  }

  function initGoogleContact() {
    const cfg = window.GOOGLE_FORM_CONFIG || {};
    const embedRaw = (cfg.embedUrl || "").trim();
    const form = document.querySelector("#contact-form");
    const host = document.querySelector("#google-form-embed-host");
    const hint = document.querySelector("#form-hint-native");
    const status = document.querySelector("#form-status");

    let usedEmbed = false;
    if (host && embedRaw) {
      try {
        const u = new URL(embedRaw);
        if (u.hostname === "docs.google.com" && u.pathname.includes("/forms/")) {
          u.searchParams.set("embedded", "true");
          const iframe = document.createElement("iframe");
          iframe.className = "google-form-iframe";
          iframe.title = "Заявка на участие";
          iframe.src = u.href;
          iframe.loading = "lazy";
          iframe.referrerPolicy = "no-referrer-when-downgrade";
          host.replaceChildren(iframe);
          host.removeAttribute("hidden");
          if (form) {
            form.setAttribute("hidden", "");
            form.setAttribute("aria-hidden", "true");
          }
          if (hint) hint.setAttribute("hidden", "");
          usedEmbed = true;
        }
      } catch {
        usedEmbed = false;
      }
    }

    if (!usedEmbed) {
      if (host) {
        host.setAttribute("hidden", "");
        host.replaceChildren();
      }
      if (form) {
        form.removeAttribute("hidden");
        form.removeAttribute("aria-hidden");
      }
      if (hint) hint.removeAttribute("hidden");
    }

    if (usedEmbed || !form || !status) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nameEl = form.querySelector("#c-name");
      const emailEl = form.querySelector("#c-email");
      const msgEl = form.querySelector("#c-msg");
      const name = nameEl?.value?.trim() ?? "";
      const email = emailEl?.value?.trim() ?? "";
      const message = msgEl?.value?.trim() ?? "";

      const googleReady =
        cfg &&
        typeof cfg.formAction === "string" &&
        /^https:\/\/docs\.google\.com\/forms\//.test(cfg.formAction) &&
        cfg.entryName &&
        cfg.entryEmail &&
        cfg.entryMessage;

      status.textContent = "";

      if (!googleReady) {
        status.textContent =
          "Отправка заявки с сайта сейчас недоступна: форма ещё не подключена к сервису организаторов. Напишите на dm.martyshenko@gmail.com — команда форума ответится и подскажет формат участия.";
        return;
      }

      if (!email || !message) {
        status.textContent = "Заполните обязательные поля: эл. почта и сообщение.";
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const body = new URLSearchParams();
        body.set(cfg.entryName, name);
        body.set(cfg.entryEmail, email);
        body.set(cfg.entryMessage, message);
        body.set("fvv", "1");

        await fetch(cfg.formAction, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        });

        status.textContent =
          "Спасибо! Заявка отправлена. Данные появятся в таблице ответов Google Формы; мы свяжемся с вами по указанной почте.";
        form.reset();
      } catch {
        status.textContent =
          "Не удалось отправить форму. Проверьте интернет или напишите на dm.martyshenko@gmail.com.";
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  const navToggle = document.querySelector(".btn-nav-toggle");
  const navMobile = document.querySelector(".nav-mobile");
  const closeMobileNav = () => {
    if (!navMobile || !navToggle) return;
    navMobile.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Открыть меню");
  };

  if (navToggle && navMobile) {
    navToggle.addEventListener("click", () => {
      const open = navMobile.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    });
    navMobile.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMobileNav));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navMobile.classList.contains("is-open")) {
        e.preventDefault();
        closeMobileNav();
        navToggle.focus();
      }
    });
  }

  renderProgram(document.querySelector("[data-program-root]"));
  renderSpeakers(document.querySelector("[data-speakers-root]"));
  renderAiPulse(document.querySelector("[data-ai-pulse]"));
  renderHeatmap(document.querySelector("[data-heatmap-root]"));
  initGoogleContact();

  setInterval(() => {
    renderAiPulse(document.querySelector("[data-ai-pulse]"));
  }, 30000);

  const navLinks = [...document.querySelectorAll("[data-nav]")];
  const seen = new Set();
  const sections = [];
  navLinks.forEach((a) => {
    const id = a.getAttribute("data-nav");
    const el = id && document.getElementById(id);
    if (el && id && !seen.has(id)) {
      seen.add(id);
      sections.push({ id, el });
    }
  });

  const setActiveNav = (id) => {
    navLinks.forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("data-nav") === id);
    });
  };

  if (sections.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveNav(visible.target.id);
      },
      { rootMargin: "-28% 0px -55% 0px", threshold: [0, 0.1, 0.25, 0.5] }
    );
    sections.forEach(({ el }) => io.observe(el));
  }

  const toTop = document.querySelector(".to-top");
  if (toTop) {
    const toggleTop = () => {
      toTop.classList.toggle("is-visible", window.scrollY > 520);
    };
    toggleTop();
    window.addEventListener("scroll", toggleTop, { passive: true });
  }
})();
