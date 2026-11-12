"use strict";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- Splash ---------- */
window.addEventListener("load", () => {
  setTimeout(() => $("#splash").classList.add("done"), 1500);
});

/* ---------- Theme (dark by default) ---------- */
const root = document.documentElement;
const savedTheme = (() => { try { return localStorage.getItem("theme"); } catch { return null; } })();
root.dataset.theme = savedTheme || "dark";
$("#themeToggle").addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch {}
});

/* ---------- Cursor glow ---------- */
const glow = $("#glow");
let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; });
(function loopGlow() {
  gx += (tx - gx) * 0.08;
  gy += (ty - gy) * 0.08;
  glow.style.left = gx + "px";
  glow.style.top = gy + "px";
  requestAnimationFrame(loopGlow);
})();

/* ---------- Page navigation ---------- */
const pages = $$(".page");
const links = $$(".nav-link");
const order = pages.map((p) => p.id);
const nextBtn = $("#nextBtn");
const backBtn = $("#backBtn");
const pill = $("#navPill");
let current = "home";

function movePill() {
  const active = $(".nav-link.active");
  if (!active) return;
  pill.style.width = active.offsetWidth + "px";
  pill.style.transform = `translateX(${active.offsetLeft}px)`;
}

function go(id, push = true) {
  if (!order.includes(id)) id = "home";
  current = id;
  pages.forEach((p) => p.classList.toggle("active", p.id === id));
  links.forEach((l) => l.classList.toggle("active", l.dataset.page === id));
  document.body.classList.toggle("on-home", id === "home");
  movePill();
  $("#nav").classList.remove("open");

  const i = order.indexOf(id);
  const nextId = order[(i + 1) % order.length];
  nextBtn.firstChild.textContent = `Next: ${$("#" + nextId).dataset.title} `;
  nextBtn.dataset.target = nextId;

  // Back button: goes to the previous tab, disabled on Home
  backBtn.dataset.target = order[Math.max(i - 1, 0)];
  backBtn.disabled = i === 0;

  document.title = `${$("#" + id).dataset.title} | Mariam Fatima Kewang`;
  if (push) history.replaceState(null, "", "#" + id);
  scrollTo({ top: 0, behavior: "smooth" });
  if (id === "home") startTyping();
}

links.concat($$(".logo")).forEach((a) =>
  a.addEventListener("click", (e) => { e.preventDefault(); go(a.dataset.page); })
);
$$("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));
nextBtn.addEventListener("click", () => go(nextBtn.dataset.target));
backBtn.addEventListener("click", () => { if (!backBtn.disabled) go(backBtn.dataset.target); });
addEventListener("hashchange", () => go(location.hash.slice(1), false));
addEventListener("resize", movePill);
addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea") || !$("#modal").hidden) return;
  const i = order.indexOf(current);
  if (e.key === "ArrowRight") go(order[Math.min(i + 1, order.length - 1)]);
  if (e.key === "ArrowLeft") go(order[Math.max(i - 1, 0)]);
});
$("#menuBtn").addEventListener("click", () => $("#nav").classList.toggle("open"));

/* ---------- Typing effect ---------- */
const roles = ["curious learner", "aspiring developer", "problem solver", "creative thinker"];
let typingToken = 0;
function startTyping() {
  const token = ++typingToken;
  const el = $("#typed");
  let r = 0, c = 0, deleting = false;
  (function tick() {
    if (token !== typingToken) return;
    const word = roles[r];
    c += deleting ? -1 : 1;
    el.textContent = word.slice(0, c);
    let delay = deleting ? 40 : 85;
    if (!deleting && c === word.length) { deleting = true; delay = 1400; }
    else if (deleting && c === 0) { deleting = false; r = (r + 1) % roles.length; delay = 350; }
    setTimeout(tick, delay);
  })();
}

/* ---------- Home photo: fallback + gentle parallax ---------- */
(function homePhoto() {
  const panel = $("#homePhoto");
  const frame = $("#photoFrame");
  const img = $("#photoImg");

  const check = () => { if (!img.complete || img.naturalWidth === 0) panel.classList.add("no-img"); };
  img.addEventListener("error", () => panel.classList.add("no-img"));
  if (img.complete) check();

  panel.addEventListener("pointermove", (e) => {
    const r = panel.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    frame.style.transform = `translate(${-x * 22}px, ${-y * 16}px)`;
  });
  panel.addEventListener("pointerleave", () => (frame.style.transform = ""));
})();

/* ---------- Achievements: click an item to see its picture ---------- */
const modal = $("#modal");
let lastFocus = null;
function closeModal() { modal.hidden = true; lastFocus && lastFocus.focus(); }

$$(".ach-item").forEach((c) =>
  c.addEventListener("click", () => {
    lastFocus = c;
    $("#modalTitle").textContent = c.dataset.title;
    $("#modalMeta").innerHTML = c.dataset.meta;
    $("#modalDesc").textContent = c.dataset.desc;

    // show the picture if it loads, otherwise hide the image slot
    const mImg = $("#modalImg");
    mImg.hidden = true;
    if (c.dataset.img) {
      mImg.onload = () => (mImg.hidden = false);
      mImg.onerror = () => (mImg.hidden = true);
      mImg.alt = c.dataset.title;
      mImg.src = c.dataset.img;
    }

    modal.hidden = false;
    $("#modalClose").focus();
  })
);
$("#modalClose").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });


/* ---------- Achievements: hover peek (bigger picture beside the item) ---------- */
(function peek() {
  const box = document.createElement("div");
  box.className = "peek";
  box.innerHTML = '<img alt="" />';
  document.body.appendChild(box);
  const pi = box.firstChild;
  const hide = () => box.classList.remove("show");
  $$(".ach-item").forEach((c) => {
    if (!c.dataset.img) return;
    c.addEventListener("pointerenter", () => {
      pi.onload = () => {
        const r = c.getBoundingClientRect();
        const w = box.offsetWidth, h = box.offsetHeight;
        let x = r.right + 12;
        if (x + w > innerWidth - 8) x = Math.max(8, r.left - w - 12);
        const y = Math.min(Math.max(8, r.top + r.height / 2 - h / 2), innerHeight - h - 8);
        box.style.left = x + "px"; box.style.top = y + "px";
        box.classList.add("show");
      };
      pi.onerror = hide;
      pi.src = c.dataset.img;
    });
    c.addEventListener("pointerleave", hide);
    c.addEventListener("click", hide);
  });
})();

/* ---------- Init ---------- */
$("#year").textContent = new Date().getFullYear();
go(location.hash.slice(1) || "home", false);
document.fonts && document.fonts.ready.then(movePill);
