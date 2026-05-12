(() => {
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

  const tablist = document.querySelector(".program-switcher");
  if (tablist) {
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const panels = [...document.querySelectorAll('[role="tabpanel"]')];

    const select = (id) => {
      if (!id) return;
      tabs.forEach((t) => {
        const on = t.id === `tab-${id}`;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach((p) => {
        const active = p.id === `panel-${id}`;
        p.classList.toggle("is-active", active);
        p.setAttribute("aria-hidden", active ? "false" : "true");
      });
    };

    panels.forEach((p) => {
      p.setAttribute("aria-hidden", p.classList.contains("is-active") ? "false" : "true");
    });

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => select(tab.dataset.day));
      tab.addEventListener("keydown", (e) => {
        const i = tabs.indexOf(tab);
        if (e.key === "ArrowRight") {
          e.preventDefault();
          const next = tabs[(i + 1) % tabs.length];
          next.focus();
          select(next.dataset.day);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          const prev = tabs[(i - 1 + tabs.length) % tabs.length];
          prev.focus();
          select(prev.dataset.day);
        } else if (e.key === "Home") {
          e.preventDefault();
          const first = tabs[0];
          first.focus();
          select(first.dataset.day);
        } else if (e.key === "End") {
          e.preventDefault();
          const last = tabs[tabs.length - 1];
          last.focus();
          select(last.dataset.day);
        }
      });
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
          "Отправка заявки с сайта сейчас недоступна: форма ещё не подключена к сервису организаторов. Напишите на dm.martyshenko@gmail.com — команда форума ответит и подскажет формат участия.";
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

  initGoogleContact();

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
