/* NEXSELENT — navigation and page interactions */
(() => {
  "use strict";

  const menuBtn = document.getElementById("menuBtn");
  const drawer = document.getElementById("drawer");
  const main = document.querySelector("main");
  const footer = document.querySelector("footer");
  const header = document.getElementById("header");
  document.documentElement.classList.remove("no-js");

  const setDrawer = open => {
    if (!drawer || !menuBtn) return;
    if (!open) menuBtn.focus();
    drawer.classList.toggle("is-open", open);
    menuBtn.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    drawer.setAttribute("aria-hidden", String(!open));
    drawer.inert = !open;
    document.body.classList.toggle("is-locked", open);
    document.documentElement.classList.toggle("is-locked", open);
    if (main) main.inert = open;
    if (footer) footer.inert = open;
    const fabEl = document.getElementById("fab");
    if (fabEl) fabEl.inert = open;
    if (open) requestAnimationFrame(() => drawer.querySelector("a")?.focus());
  };

  menuBtn?.addEventListener("click", () => setDrawer(!drawer.classList.contains("is-open")));
  drawer?.querySelector(".drawer__bg")?.addEventListener("click", () => setDrawer(false));
  drawer?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setDrawer(false)));
  window.matchMedia("(min-width: 1081px)").addEventListener("change", event => {
    if (event.matches && drawer?.classList.contains("is-open")) setDrawer(false);
  });
  document.addEventListener("keydown", event => {
    if (!drawer?.classList.contains("is-open")) return;
    if (event.key === "Escape") setDrawer(false);
    if (event.key !== "Tab") return;
    const links = [...drawer.querySelectorAll("a[href]")];
    const focusable = [menuBtn, ...links];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const sections = [...document.querySelectorAll(".side-toc__list a")].map(link => ({
    link,
    section: document.getElementById(link.hash.slice(1))
  })).filter(item => item.section);
  let pending = false;
  const fab = document.getElementById("fab");
  const updatePagePosition = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 10);
    fab?.classList.toggle("is-shown", window.scrollY > 500);
    const threshold = (header?.offsetHeight || 0) + 24;
    let current = sections[0];
    sections.forEach(item => {
      if (item.section.getBoundingClientRect().top <= threshold) current = item;
    });
    sections.forEach(item => item.link.setAttribute("aria-current", String(item === current)));
    pending = false;
  };
  const requestUpdate = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(updatePagePosition);
  };
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
  updatePagePosition();

  const questions = [...document.querySelectorAll(".faq__item")];
  questions.forEach(question => question.addEventListener("toggle", () => {
    if (question.open) questions.forEach(other => {
      if (other !== question) other.open = false;
    });
  }));

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // 段落の最後の5文字は改行させない（最終行に「ます。」だけが残るのを防ぐ）。
  // 段落の中に別の行として置かれた注記（display:block の span など）は、別のまとまりとして扱う。
  // 英数字（電話・メール・社名）を含む末尾は、もともと分かれないので触らない。
  const isBlock = node => /block|flex|grid|list-item|table/.test(getComputedStyle(node).display);
  const keepTail = block => {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        for (let el = node.parentElement; el && el !== block; el = el.parentElement) {
          if (isBlock(el)) return NodeFilter.FILTER_REJECT;
        }
        return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    let last = null;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) last = node;
    if (!last || last.parentElement.closest(".nw")) return;
    // flex・grid の直下に足すと別の並びの要素になってしまうので、そこには足さない
    if (/flex|grid/.test(getComputedStyle(last.parentElement).display)) return;
    const text = last.nodeValue.replace(/\s+$/, "");
    if (text.length < 10) return;
    const tail = text.slice(-5);
    if (/[\sA-Za-z0-9@.\-]/.test(tail)) return;
    last.nodeValue = text.slice(0, -5);
    const keep = document.createElement("span");
    keep.className = "nw";
    keep.textContent = tail;
    last.after(keep);
  };
  document.querySelectorAll("main :is(p, li, dd)").forEach(el => {
    if (el.closest(".tp-chips, .breadcrumb, .tp-hero__note, .nw")) return;
    keepTail(el);
    el.querySelectorAll("span").forEach(span => { if (isBlock(span)) keepTail(span); });
  });
})();
