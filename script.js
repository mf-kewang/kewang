"use strict";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- Splash ---------- */
window.addEventListener("load", () => {
  setTimeout(() => $("#splash").classList.add("done"), 1500);
});

/* ---------- Theme ---------- */
const root = document.documentElement;
const savedTheme = (() => { try { return localStorage.getItem("theme"); } catch { return null; } })();
if (savedTheme) root.dataset.theme = savedTheme;
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
  movePill();
  $("#nav").classList.remove("open");

  const nextId = order[(order.indexOf(id) + 1) % order.length];
  const nextTitle = $("#" + nextId).dataset.title;
  nextBtn.firstChild.textContent = `Next: ${nextTitle} `;
  nextBtn.dataset.target = nextId;

  document.title = `${$("#" + id).dataset.title} | Mariam Fatima Kewang`;
  if (push) history.replaceState(null, "", "#" + id);
  scrollTo({ top: 0, behavior: "smooth" });
  if (id === "home") startTyping();
}

links.concat($$(".logo")).forEach((a) =>
  a.addEventListener("click", (e) => { e.preventDefault(); go(a.dataset.page); })
);
nextBtn.addEventListener("click", () => go(nextBtn.dataset.target));
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

/* ---------- Swinging ID badge (drag + spring physics) ---------- */
(function badge() {
  const zone = $("#badgeZone");
  const swing = $("#swing");
  const shine = $(".shine");
  let angle = 0, vel = 0, dragging = false;
  const MAX = 55; // degrees

  // photo fallback
  const img = $("#photoImg");
  const wrap = img.parentElement;
  const check = () => { if (!img.complete || img.naturalWidth === 0) wrap.classList.add("no-img"); };
  img.addEventListener("error", () => wrap.classList.add("no-img"));
  if (img.complete) check();

  function pointerAngle(e) {
    const r = zone.getBoundingClientRect();
    const hx = r.left + r.width / 2;
    const hy = r.top - 100; // hook position
    const a = Math.atan2(e.clientX - hx, e.clientY - hy) * (180 / Math.PI);
    return Math.max(-MAX, Math.min(MAX, -a * -1));
  }

  swing.addEventListener("pointerdown", (e) => {
    dragging = true;
    swing.classList.add("dragging");
    swing.setPointerCapture(e.pointerId);
    vel = 0;
  });
  swing.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const target = -pointerAngle(e);
    vel = (target - angle) * 0.6;
    angle = target;
  });
  const release = () => { dragging = false; swing.classList.remove("dragging"); };
  swing.addEventListener("pointerup", release);
  swing.addEventListener("pointercancel", release);

  // idle nudge so it feels alive
  setTimeout(() => (vel += 2.2), 2200);

  let last = performance.now();
  (function frame(now) {
    const dt = Math.min((now - last) / 16.67, 3);
    last = now;
    if (!dragging) {
      const gravity = -0.045 * angle;
      vel += gravity * dt;
      vel *= Math.pow(0.992, dt);
      angle += vel * dt;
    }
    swing.style.transform = `rotate(${angle}deg)`;
    shine.style.setProperty("--shine", `${angle * 8 - 20}%`);
    requestAnimationFrame(frame);
  })(last);

  // small push when hovering the badge
  swing.addEventListener("pointerenter", () => { if (Math.abs(vel) < 0.5) vel += 1.2; });
})();

/* ---------- 3D tilt on cards ---------- */
$$(".tilt").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(800px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-4px)`;
  });
  card.addEventListener("pointerleave", () => (card.style.transform = ""));
});

/* ---------- About: skills + facts ---------- */
const skillNotes = {
  Java: "Replace with a note about how you use Java.",
  HTML: "Replace with a note about how you use HTML.",
  CSS: "Replace with a note about how you use CSS.",
  JavaScript: "Replace with a note about how you use JavaScript.",
  "VS Code": "Replace with a note about how you use VS Code.",
};
$$(".tag-btn").forEach((b) =>
  b.addEventListener("click", () => {
    $$(".tag-btn").forEach((x) => x.classList.remove("on"));
    b.classList.add("on");
    $("#skillNote").textContent = skillNotes[b.textContent] || "";
  })
);

const facts = [
  "Add a fun fact about yourself here.",
  "Add another fun fact, like a hobby or favorite food.",
  "Add something you're currently learning.",
  "Add a goal you're working towards.",
];
let fi = -1;
$("#factBtn").addEventListener("click", () => {
  fi = (fi + 1) % facts.length;
  $("#factText").textContent = facts[fi];
  $("#factCount").textContent = `${fi + 1} / ${facts.length}`;
});

/* ---------- Certificates: filter + modal ---------- */
$$(".filter").forEach((f) =>
  f.addEventListener("click", () => {
    $$(".filter").forEach((x) => x.classList.remove("active"));
    f.classList.add("active");
    $$(".cert").forEach((c) =>
      c.classList.toggle("hide", f.dataset.filter !== "all" && c.dataset.cat !== f.dataset.filter)
    );
  })
);

const modal = $("#modal");
let lastFocus = null;
function closeModal() { modal.hidden = true; lastFocus && lastFocus.focus(); }
$$(".cert").forEach((c) =>
  c.addEventListener("click", () => {
    lastFocus = c;
    $("#modalTitle").textContent = c.dataset.title;
    $("#modalMeta").innerHTML = c.dataset.meta;
    $("#modalDesc").textContent = c.dataset.desc;
    modal.hidden = false;
    $("#modalClose").focus();
  })
);
$("#modalClose").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

/* ---------- Family: flip cards ---------- */
$$(".flip").forEach((f) => f.addEventListener("click", () => f.classList.toggle("flipped")));

/* ---------- Init ---------- */
$("#year").textContent = new Date().getFullYear();
go(location.hash.slice(1) || "home", false);
document.fonts && document.fonts.ready.then(movePill);