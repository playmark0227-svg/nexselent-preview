/* =========================================================
   NEXSELENT Inc. — interactions (light design)
========================================================= */
(() => {
  "use strict";

  document.documentElement.classList.remove("no-js");

  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduceNow = () => mq.matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- hero: per-char blur fade-up ---------- */
  let heroCharCount = 0;
  $$("[data-hero-chars]").forEach(el => {
    el.innerHTML = [...el.textContent]
      .map(ch => `<span style="--hd:${(0.25 + heroCharCount++ * 0.05).toFixed(3)}s">${ch}</span>`)
      .join("");
  });
  // release composite layers once each character's intro finishes
  $$("[data-hero-chars] span").forEach(sp => {
    sp.addEventListener("animationend", () => { sp.style.willChange = "auto"; }, { once: true });
  });

  // [data-split] catch lines: wrap contents so the blur fade-up has a target
  $$("[data-split] .ph-line").forEach(line => {
    line.innerHTML = `<span>${line.innerHTML}</span>`;
  });

  /* ---------- loader → hero in ---------- */
  const loader = $("#loader");
  const hero = $(".hero");
  const finishLoader = () => {
    if (!loader || loader.classList.contains("is-done")) return;
    loader.classList.add("is-done");
    hero && hero.classList.add("is-in");
  };
  if (reduceNow()) {
    finishLoader();
  } else {
    const t0 = performance.now();
    window.addEventListener("load", () => {
      setTimeout(finishLoader, Math.max(0, 900 - (performance.now() - t0)));
    });
    setTimeout(finishLoader, 2500); // hard cap if loading drags on
  }

  /* ---------- hero slideshow (calm crossfade, no video) ---------- */
  const slideBox = $("#heroSlides");
  if (slideBox) {
    const slides = $$(".hero__slide", slideBox);
    const dotsWrap = $("#heroDots");
    let idx = 0, timer = null, paused = false;
    const dots = slides.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `スライド${i + 1}を表示`);
      b.addEventListener("click", () => { go(i); restart(); });
      dotsWrap && dotsWrap.appendChild(b);
      return b;
    });
    const go = i => {
      idx = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle("is-active", n === idx));
      dots.forEach((d, n) => d.setAttribute("aria-current", String(n === idx)));
    };
    const restart = () => {
      if (timer) clearInterval(timer);
      if (!reduceNow() && !paused && slides.length > 1) timer = setInterval(() => go(idx + 1), 5000);
    };
    // WCAG 2.2.2: allow pausing the auto-advance on hover/focus
    const pause = () => { paused = true; if (timer) { clearInterval(timer); timer = null; } };
    const resume = () => { paused = false; restart(); };
    slideBox.addEventListener("mouseenter", pause);
    slideBox.addEventListener("mouseleave", resume);
    slideBox.addEventListener("focusin", pause);
    slideBox.addEventListener("focusout", resume);
    go(0);
    restart();
  }

  /* ---------- news category filter ---------- */
  const newsTabs = $("#newsTabs");
  if (newsTabs) {
    const cards = $$(".news-card");
    newsTabs.addEventListener("click", e => {
      const btn = e.target.closest("button[data-cat]");
      if (!btn) return;
      const cat = btn.dataset.cat;
      $$("button[data-cat]", newsTabs).forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
      cards.forEach(c => c.classList.toggle("is-hidden", cat !== "all" && c.dataset.cat !== cat));
    });
  }

  /* ---------- header shadow / floating LINE ---------- */
  const header = $("#header");
  const fab = $("#fab");
  const fabTel = $("#fabTel");
  const bar = $("#progressBar");
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    header && header.classList.toggle("is-scrolled", y > 10);
    fab && fab.classList.toggle("is-shown", y > 500);
    fabTel && fabTel.classList.toggle("is-shown", y > 500);
    if (bar) {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    }
    ticking = false;
  };
  const requestScrollUpdate = () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  };
  addEventListener("scroll", requestScrollUpdate, { passive: true });
  addEventListener("resize", requestScrollUpdate, { passive: true });
  onScroll();

  /* ---------- section headings: wrap label + split JP title ---------- */
  $$(".sec-head__en").forEach(el => {
    if (!el.querySelector("span")) el.innerHTML = `<span>${el.textContent}</span>`;
  });
  $$(".sec-head__jp").forEach(el => {
    if (el.querySelector(".ch")) return;
    el.innerHTML = [...el.textContent]
      .map((c, i) => c === " " ? c : `<span class="ch" style="--n:${i}">${c}</span>`)
      .join("");
  });


  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("is-shown");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.16, rootMargin: "0px 0px -30px 0px" });
  $$("[data-reveal], [data-split], .sec-head, .values__list li").forEach(el => io.observe(el));

  /* ---------- mobile drawer ---------- */
  const menuBtn = $("#menuBtn");
  const drawer = $("#drawer");
  const pageMain = $("main");
  const pageFooter = $("footer");
  const setDrawer = open => {
    if (!drawer || !menuBtn) return;
    if (!open && !drawer.classList.contains("is-open")) return;
    if (!open) menuBtn.focus(); // restore focus before hiding the dialog
    drawer.classList.toggle("is-open", open);
    menuBtn.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    drawer.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("is-locked", open);
    if (pageMain) pageMain.inert = open;
    if (pageFooter) pageFooter.inert = open;
    if (fab) fab.inert = open; // keep the floating buttons out of the modal's tab order
    if (fabTel) fabTel.inert = open;
    if (open) requestAnimationFrame(() => { const f = $(".drawer__link"); f && f.focus(); });
  };
  menuBtn && menuBtn.addEventListener("click", () => setDrawer(!drawer.classList.contains("is-open")));
  // close the drawer if the viewport crosses into desktop layout (hamburger disappears)
  const deskMq = window.matchMedia("(min-width: 1081px)");
  deskMq.addEventListener && deskMq.addEventListener("change", e => { if (e.matches) setDrawer(false); });
  $$(".drawer__link, .drawer__line").forEach(a => a.addEventListener("click", () => setDrawer(false)));
  const drawerBg = $(".drawer__bg");
  drawerBg && drawerBg.addEventListener("click", () => setDrawer(false));
  addEventListener("keydown", e => { if (e.key === "Escape") setDrawer(false); });

  /* ---------- FAQ: close others when opening one ---------- */
  const faqItems = $$(".faq__item");
  faqItems.forEach(d => {
    d.addEventListener("toggle", () => {
      if (d.open) faqItems.forEach(o => { if (o !== d) o.open = false; });
    });
  });

  /* ---------- contact form (demo) ---------- */
  const form = $("#contactForm");
  if (form) {
    const fName = $("#fName");
    const fMail = $("#fMail");
    const fAgree = $("#fAgree");
    const err = $("#formError");
    const done = $("#formDone");
    const setInvalid = (el, invalid) => {
      el.setAttribute("aria-invalid", String(invalid));
      if (invalid) el.setAttribute("aria-describedby", "formError");
      else el.removeAttribute("aria-describedby");
    };
    form.addEventListener("submit", e => {
      e.preventDefault();
      const name = fName.value.trim();
      const mail = fMail.value.trim();
      const okMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
      setInvalid(fName, !name);
      setInvalid(fMail, !mail || !okMail);
      const problems = [];
      if (!name) problems.push("お名前をご入力ください");
      if (!mail) problems.push("メールアドレスをご入力ください");
      else if (!okMail) problems.push("メールアドレスの形式をご確認ください");
      if (fAgree && !fAgree.checked) problems.push("プライバシーポリシーへの同意をお願いします");
      if (problems.length) {
        err.textContent = problems.join("。") + "。";
        (!name ? fName : (!mail || !okMail) ? fMail : fAgree).focus();
        return;
      }
      err.textContent = "";
      form.classList.add("is-done");
      $$("input, select, textarea, button", form).forEach(c => { c.disabled = true; });
      done && done.focus();
    });
  }

  /* ---------- footer year ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
