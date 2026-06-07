:root {
  --bg: #070b12;
  --card: rgba(13, 20, 32, .92);
  --card2: rgba(17, 31, 50, .86);
  --text: #eef6ff;
  --muted: #9db0c8;
  --line: rgba(255,255,255,.1);
  --accent: #66f2b3;
  --accent2: #68a7ff;
  --danger: #ff7474;
}

* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(circle at 20% 10%, rgba(102,242,179,.18), transparent 32%),
    radial-gradient(circle at 90% 20%, rgba(104,167,255,.18), transparent 30%),
    linear-gradient(135deg, #070b12, #101827 60%, #05070c);
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--line);
  background: rgba(7, 11, 18, .86);
  backdrop-filter: blur(14px);
}

.topbar strong { display: block; font-size: 18px; }
.topbar span { display: block; color: var(--muted); font-size: 12px; margin-top: 2px; }
nav { display: flex; flex-wrap: wrap; gap: 8px; }

button {
  border: 0;
  border-radius: 12px;
  padding: 11px 14px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  color: #031011;
  font-weight: 800;
  cursor: pointer;
}

button.secondary, button.ghost {
  background: rgba(255,255,255,.08);
  color: var(--text);
  border: 1px solid var(--line);
}

button:hover { filter: brightness(1.08); }

.wrap {
  width: min(1120px, calc(100% - 24px));
  margin: 24px auto;
}

.page { display: none; }
.page.active { display: block; }
.grid2 {
  display: none;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.grid2.active { display: grid; }

.card {
  border: 1px solid var(--line);
  border-radius: 22px;
  padding: 22px;
  background: var(--card);
  box-shadow: 0 20px 60px rgba(0,0,0,.28);
}

.hero { min-height: 64vh; display: none; place-items: center; }
.hero.active { display: grid; }
.hero-card { max-width: 760px; text-align: center; }
h1 { font-size: clamp(36px, 7vw, 70px); line-height: .95; margin: 10px 0; }
h2, h3 { margin-top: 0; }
p { color: var(--muted); line-height: 1.55; }

.badge {
  display: inline-block;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(102,242,179,.1);
  color: var(--accent);
  border: 1px solid rgba(102,242,179,.22);
  font-weight: 800;
}

.notice {
  margin: 18px 0;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 16px;
  padding: 14px;
  background: rgba(255,255,255,.06);
  color: #d8e5ff;
}
.actions { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }

label { display: block; margin: 14px 0 6px; color: #dceaff; font-weight: 700; }
input, select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 13px 14px;
  background: rgba(255,255,255,.06);
  color: var(--text);
  outline: none;
}
input:focus, select:focus { border-color: rgba(102,242,179,.7); }
.card button { margin-top: 14px; width: 100%; }
code {
  display: block;
  padding: 12px;
  border-radius: 12px;
  background: rgba(0,0,0,.24);
  color: var(--accent);
  overflow-wrap: anywhere;
}
.soft { background: var(--card2); }
.danger { border-color: rgba(255,116,116,.32); background: rgba(80, 20, 25, .55); }
hr { border: 0; border-top: 1px solid var(--line); margin: 22px 0; }
.msg { min-height: 24px; font-weight: 700; }
.msg.ok { color: var(--accent); }
.msg.err { color: var(--danger); }

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
  margin-top: 14px;
}
.stat {
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: rgba(255,255,255,.05);
}
.stat span { display: block; color: var(--muted); font-size: 12px; margin-bottom: 4px; }
.stat strong { display: block; font-size: 20px; overflow-wrap: anywhere; }
.list { display: grid; gap: 8px; }
.item {
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 12px;
  background: rgba(255,255,255,.05);
}

@media (max-width: 760px) {
  .topbar { align-items: flex-start; flex-direction: column; }
  nav { width: 100%; }
  nav button { flex: 1; min-width: 110px; }
  .grid2.active { grid-template-columns: 1fr; }
}
