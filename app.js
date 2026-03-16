const SUPABASE_URL = "https://qeflnlfgumsyfkgrhzgb.supabase.co";
const SUPABASE_KEY = "sb_publishable_m01uu29KPm9SNGpqEFZ9_g_B_jBwNP_";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("window.supabase exists?", !!window.supabase);
console.log("Supabase client initialized", !!supabaseClient);

// ===== Storage =====
const STORAGE_KEY = "bb_watchlog_v1";

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function uid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function fmtDateTime(iso) {
  if (!iso) return "";
  // Date-only: YYYY-MM-DD — display without time
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-");
    return `${y}/${m}/${d}`;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n)=> String(n).padStart(2,"0");
  return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function computeResult(finalHome, finalAway, homeTeam, awayTeam) {
  const h = Number(finalHome);
  const a = Number(finalAway);
  if (!Number.isFinite(h) || !Number.isFinite(a)) return "";
  if (h > a) return `ホーム勝ち（${homeTeam || "HOME"}）`;
  if (h < a) return `アウェイ勝ち（${awayTeam || "AWAY"}）`;
  return "引き分け";
}

// ===== UI refs =====
const viewList = document.getElementById("viewList");
const viewDetail = document.getElementById("viewDetail");
const viewForm = document.getElementById("viewForm");
const viewQuickForm = document.getElementById("viewQuickForm");
const viewStats = document.getElementById("viewStats");
const viewAccount = document.getElementById("viewAccount");

const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const countPill = document.getElementById("countPill");
const qEl = document.getElementById("q");

const detailTitle = document.getElementById("detailTitle");
const detailMeta = document.getElementById("detailMeta");
const detailBody = document.getElementById("detailBody");

const formTitle = document.getElementById("formTitle");

// quick form fields
const qf_dateTime  = document.getElementById("qf_dateTime");
const qf_league    = document.getElementById("qf_league");
const qf_homeTeam  = document.getElementById("qf_homeTeam");
const qf_awayTeam  = document.getElementById("qf_awayTeam");
const qf_finalHome = document.getElementById("qf_finalHome");
const qf_finalAway = document.getElementById("qf_finalAway");
const qf_venue     = document.getElementById("qf_venue");
const qf_memo      = document.getElementById("qf_memo");

// form fields
const f_dateTime = document.getElementById("f_dateTime");
const f_league = document.getElementById("f_league");
const f_homeTeam = document.getElementById("f_homeTeam");
const f_awayTeam = document.getElementById("f_awayTeam");
const f_venue = document.getElementById("f_venue");
const f_seat = document.getElementById("f_seat");

const f_finalHome = document.getElementById("f_finalHome");
const f_finalAway = document.getElementById("f_finalAway");
const f_result = document.getElementById("f_result");

const f_flow = document.getElementById("f_flow");
const f_play = document.getElementById("f_play");
const f_mvp = document.getElementById("f_mvp");

const f_food = document.getElementById("f_food");
const f_event = document.getElementById("f_event");
const f_cheer = document.getElementById("f_cheer");
const f_note = document.getElementById("f_note");

// dynamic tables
const quartersBody = document.getElementById("quartersBody");
const playersBody = document.getElementById("playersBody");
const quartersContent = document.getElementById("quartersContent");
const quartersAddArea = document.getElementById("quartersAddArea");

// bottom dock (入力モード中は非表示)
const bottomDock = document.getElementById("bottomDock");

// auth refs
const authEmail = document.getElementById("authEmail");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const authStatus = document.getElementById("authStatus");
const btnStartAnonymous = document.getElementById("btnStartAnonymous");
const authHelp = document.getElementById("authHelp");

// ===== Nav management =====
function setNavActive(navId, ctaActive) {
  document.querySelectorAll(".navItem").forEach(el => el.classList.remove("active"));
  document.getElementById("btnPrimaryRecord").classList.toggle("active", !!ctaActive);
  if (navId) document.getElementById(navId).classList.add("active");
}

document.getElementById("btnNavRecords").addEventListener("click", () => {
  show("list"); setNavActive("btnNavRecords");
});
document.getElementById("btnNavSearch").addEventListener("click", () => {
  show("list"); setNavActive("btnNavRecords");
  setTimeout(() => { qEl.focus(); qEl.scrollIntoView({ behavior: "smooth", block: "center" }); }, 50);
});
document.getElementById("btnNavReview").addEventListener("click", () => {
  show("stats"); setNavActive("btnNavReview");
});
document.getElementById("btnNavAccount").addEventListener("click", () => {
  show("account"); setNavActive("btnNavAccount");
});
document.getElementById("btnPrimaryRecord").addEventListener("click", () => openQuickFormForNew());

// quick form buttons
document.getElementById("btnQuickCancel").addEventListener("click", () => show("list"));
document.getElementById("btnQuickCancelFooter").addEventListener("click", () => show("list"));
document.getElementById("btnQuickSave").addEventListener("click", () => onQuickSave().catch(console.error));

// buttons
document.getElementById("btnBack").addEventListener("click", () => show("list"));
document.getElementById("btnCancel").addEventListener("click", () => show("list"));
document.getElementById("btnSave").addEventListener("click", () => onSave().catch(console.error));
document.getElementById("btnEdit").addEventListener("click", () => openFormForEdit(currentId));
document.getElementById("btnDelete").addEventListener("click", () => onDelete(currentId).catch(console.error));
document.getElementById("btnAddOT").addEventListener("click", () => addQuarterRow(nextOTLabel()));
document.getElementById("btnShowQuarters").addEventListener("click", () => {
  quartersAddArea.classList.add("hide");
  quartersContent.classList.remove("hide");
});
document.getElementById("btnHideQuarters").addEventListener("click", () => {
  quartersContent.classList.add("hide");
  quartersAddArea.classList.remove("hide");
  resetQuarters();
});
document.getElementById("btnAddPlayer").addEventListener("click", () => addPlayerRow());
document.getElementById("btnExport").addEventListener("click", exportJSON);
document.getElementById("btnImport").addEventListener("click", importJSON);
document.getElementById("btnReset").addEventListener("click", resetAll);
btnLogin.addEventListener("click", onLogin);
btnLogout.addEventListener("click", onLogout);
btnStartAnonymous.addEventListener("click", onStartAnonymous);

document.getElementById("btnClearQ").addEventListener("click", () => {
  qEl.value = "";
  renderList();
});
qEl.addEventListener("input", renderList);

f_finalHome.addEventListener("input", () => {
  f_result.value = computeResult(f_finalHome.value, f_finalAway.value, f_homeTeam.value, f_awayTeam.value);
});
f_finalAway.addEventListener("input", () => {
  f_result.value = computeResult(f_finalHome.value, f_finalAway.value, f_homeTeam.value, f_awayTeam.value);
});
f_homeTeam.addEventListener("input", () => {
  f_result.value = computeResult(f_finalHome.value, f_finalAway.value, f_homeTeam.value, f_awayTeam.value);
});
f_awayTeam.addEventListener("input", () => {
  f_result.value = computeResult(f_finalHome.value, f_finalAway.value, f_homeTeam.value, f_awayTeam.value);
});

// ===== Supabase read =====
function rowToRecord(row) {
  return {
    id:         row.id,
    dateTime:   row.date_time,
    league:     row.league,
    homeTeam:   row.home_team,
    awayTeam:   row.away_team,
    venue:      row.venue,
    seat:       row.seat,
    finalHome:  row.final_home,
    finalAway:  row.final_away,
    result:     row.result,
    useQuarters: row.use_quarters,
    quarters:   row.quarters,
    players:    row.players,
    flow:       row.flow,
    play:       row.play,
    mvp:        row.mvp,
    food:       row.food,
    event:      row.event,
    cheer:      row.cheer,
    note:       row.note,
    createdAt:  row.created_at,
    updatedAt:  row.updated_at,
  };
}

async function loadRecordsFromSupabase() {
  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData.user;
  if (!user) return null;
  const { data, error } = await supabaseClient
    .from("watch_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("date_time", { ascending: false });
  if (error) { console.error(error); return null; }
  return data.map(rowToRecord);
}

async function refreshRecords() {
  const result = await loadRecordsFromSupabase();
  if (result !== null) {
    records = result;
  } else {
    records = loadRecords();
  }
  renderList();
}

function recordToRow(rec, userId) {
  return {
    user_id:      userId,
    date_time:    rec.dateTime || null,
    league:       rec.league || null,
    home_team:    rec.homeTeam || null,
    away_team:    rec.awayTeam || null,
    venue:        rec.venue || null,
    seat:         rec.seat || null,
    final_home:   rec.finalHome,
    final_away:   rec.finalAway,
    result:       rec.result || null,
    use_quarters: !!rec.useQuarters,
    quarters:     rec.quarters || [],
    players:      rec.players || [],
    flow:         rec.flow || null,
    play:         rec.play || null,
    mvp:          rec.mvp || null,
    food:         rec.food || null,
    event:        rec.event || null,
    cheer:        rec.cheer || null,
    note:         rec.note || null,
    updated_at:   new Date().toISOString(),
  };
}

async function saveRecordToSupabase(rec) {
  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData.user;
  if (!user) return null;
  const row = recordToRow(rec, user.id);
  let query;
  if (rec.id) {
    query = supabaseClient.from("watch_logs").update(row).eq("id", rec.id).eq("user_id", user.id).select().single();
  } else {
    query = supabaseClient.from("watch_logs").insert(row).select().single();
  }
  const { data, error } = await query;
  if (error) throw error;
  return rowToRecord(data);
}

// ===== State =====
let records = [];
let currentId = null;

// ===== Routing-ish =====
function show(which){
  viewList.classList.toggle("hide", which !== "list");
  viewDetail.classList.toggle("hide", which !== "detail");
  viewForm.classList.toggle("hide", which !== "form");
  viewQuickForm.classList.toggle("hide", which !== "quickForm");
  viewStats.classList.toggle("hide", which !== "stats");
  viewAccount.classList.toggle("hide", which !== "account");
  if (which === "list") renderList();

  // 入力モード（クイック記録 / 詳細フォーム）中はボトムナビを隠す
  const inputModes = ["form", "quickForm"];
  bottomDock.classList.toggle("hide", inputModes.includes(which));

  const navMap = { list: "btnNavRecords", detail: "btnNavRecords", stats: "btnNavReview", account: "btnNavAccount" };
  setNavActive(navMap[which] || null, which === "form" || which === "quickForm");
}

// ===== Quarters =====
function resetQuarters() {
  quartersBody.innerHTML = "";
  ["Q1","Q2","Q3","Q4"].forEach(q => addQuarterRow(q));
}
function nextOTLabel(){
  const labels = [...quartersBody.querySelectorAll("tr")].map(tr => tr.dataset.label);
  const otCount = labels.filter(x => x && x.startsWith("OT")).length;
  return "OT" + (otCount + 1);
}
function addQuarterRow(label, homeVal = "", awayVal = "", removable = false){
  const tr = document.createElement("tr");
  tr.dataset.label = label;

  tr.innerHTML = `
    <td><strong>${label}</strong></td>
    <td><input type="number" min="0" inputmode="numeric" placeholder="-" value="${homeVal ?? ""}"></td>
    <td><input type="number" min="0" inputmode="numeric" placeholder="-" value="${awayVal ?? ""}"></td>
    <td></td>
  `;
  const tdOps = tr.querySelector("td:last-child");

  if (label.startsWith("OT")) removable = true;

  if (removable){
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "削除";
    btn.addEventListener("click", () => tr.remove());
    tdOps.appendChild(btn);
  } else {
    tdOps.innerHTML = `<span class="small">固定</span>`;
  }
  quartersBody.appendChild(tr);
}
function readQuarters(){
  const rows = [...quartersBody.querySelectorAll("tr")];
  return rows.map(tr => {
    const [homeInput, awayInput] = tr.querySelectorAll("input");
    const home = homeInput.value === "" ? null : Number(homeInput.value);
    const away = awayInput.value === "" ? null : Number(awayInput.value);
    return { label: tr.dataset.label, home, away };
  });
}
function fillQuarters(qs){
  quartersBody.innerHTML = "";
  // ensure Q1-4 exist first
  const base = ["Q1","Q2","Q3","Q4"];
  const map = new Map((qs||[]).map(x => [x.label, x]));
  base.forEach(label => {
    const x = map.get(label) || {};
    addQuarterRow(label, x.home ?? "", x.away ?? "", false);
  });
  // append OTs if any
  (qs||[]).filter(x => x.label && x.label.startsWith("OT")).forEach(x => {
    addQuarterRow(x.label, x.home ?? "", x.away ?? "", true);
  });
}

// ===== Players =====
function resetPlayers(){
  playersBody.innerHTML = "";
  addPlayerRow();
}
function addPlayerRow(p = {}){
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" placeholder="例：#2 〇〇" value="${esc(p.name)}"></td>
    <td>
      <select>
        <option value="">-</option>
        <option value="home">ホーム</option>
        <option value="away">アウェイ</option>
        <option value="other">その他</option>
      </select>
    </td>
    <td><input type="number" min="0" inputmode="numeric" placeholder="-" value="${numOrEmpty(p.pts)}"></td>
    <td><input type="number" min="0" inputmode="numeric" placeholder="-" value="${numOrEmpty(p.reb)}"></td>
    <td><input type="number" min="0" inputmode="numeric" placeholder="-" value="${numOrEmpty(p.ast)}"></td>
    <td><input type="text" placeholder="例：ディフェンスが良かった" value="${esc(p.note)}"></td>
    <td></td>
  `;
  const sel = tr.querySelector("select");
  sel.value = p.team || "";
  const tdOps = tr.querySelector("td:last-child");
  const btn = document.createElement("button");
  btn.className = "btn";
  btn.textContent = "削除";
  btn.addEventListener("click", () => tr.remove());
  tdOps.appendChild(btn);
  playersBody.appendChild(tr);
}
function readPlayers(){
  const rows = [...playersBody.querySelectorAll("tr")];
  return rows.map(tr => {
    const inputs = tr.querySelectorAll("input");
    const sel = tr.querySelector("select");
    const name = inputs[0].value.trim();
    const team = sel.value;
    const pts = inputs[1].value === "" ? null : Number(inputs[1].value);
    const reb = inputs[2].value === "" ? null : Number(inputs[2].value);
    const ast = inputs[3].value === "" ? null : Number(inputs[3].value);
    const note = inputs[4].value.trim();
    return { name, team, pts, reb, ast, note };
  }).filter(p => p.name !== "" || p.note !== "" || p.pts != null || p.reb != null || p.ast != null);
}
function fillPlayers(ps){
  playersBody.innerHTML = "";
  (ps && ps.length ? ps : [{}]).forEach(p => addPlayerRow(p));
}

// ===== Suggestions =====
/**
 * records から指定フィールドのユニーク値を順序保持で返す
 * 将来フィルタ機能にも流用しやすいよう汎用化
 * @param {Array} records @param {string} key @returns {string[]}
 */
function getUniqueFieldValues(records, key) {
  const seen = new Set();
  return records
    .map(r => (r[key] || "").trim())
    .filter(v => v && !seen.has(v) && seen.add(v));
}

function getUniqueLeagues(records) {
  return getUniqueFieldValues(records, "league");
}
function getUniqueVenues(records) {
  return getUniqueFieldValues(records, "venue");
}
/** ホーム・アウェイ両方から重複なくチーム名を返す */
function getUniqueTeams(records) {
  const seen = new Set();
  const result = [];
  records.forEach(r => {
    [r.homeTeam, r.awayTeam].forEach(t => {
      const v = (t || "").trim();
      if (v && !seen.has(v)) { seen.add(v); result.push(v); }
    });
  });
  return result;
}

/**
 * 候補チップを containerId のコンテナに描画する
 * @param {string} containerId
 * @param {string[]} values
 * @param {HTMLInputElement} inputEl
 * @param {HTMLElement|null} [nextEl] チップタップ後にフォーカスする次の要素
 */
function renderSuggestions(containerId, values, inputEl, nextEl) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  values.slice(0, 12).forEach(val => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "qeChip";
    chip.textContent = val;
    chip.addEventListener("click", () => {
      inputEl.value = val;
      inputEl.dispatchEvent(new Event("input"));
      if (nextEl) setTimeout(() => nextEl.focus(), 40);
    });
    container.appendChild(chip);
  });
}

/** 入力ごとに候補を絞り込む（一度だけセット） */
function initSuggestionFilters() {
  const setup = (inputEl, sugId, valsFn, nextEl) => {
    inputEl.addEventListener("input", () => {
      const q = inputEl.value.trim().toLowerCase();
      const filtered = valsFn().filter(v => !q || v.toLowerCase().includes(q));
      renderSuggestions(sugId, filtered, inputEl, nextEl);
    });
  };
  setup(qf_league,   "sug_league",   () => getUniqueLeagues(records), qf_homeTeam);
  setup(qf_homeTeam, "sug_homeTeam", () => getUniqueTeams(records),   qf_awayTeam);
  setup(qf_awayTeam, "sug_awayTeam", () => getUniqueTeams(records),   qf_finalHome);
  setup(qf_venue,    "sug_venue",    () => getUniqueVenues(records),  qf_memo);
}

// ===== Quick Form =====
function openQuickFormForNew() {
  // 今日の日付を YYYY-MM-DD 形式で自動入力
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  qf_dateTime.value = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;

  qf_league.value    = "";
  qf_homeTeam.value  = "";
  qf_awayTeam.value  = "";
  qf_finalHome.value = "";
  qf_finalAway.value = "";
  qf_venue.value     = "";
  qf_memo.value      = "";

  // 過去入力から候補を初期描画
  renderSuggestions("sug_league",   getUniqueLeagues(records), qf_league,   qf_homeTeam);
  renderSuggestions("sug_homeTeam", getUniqueTeams(records),   qf_homeTeam, qf_awayTeam);
  renderSuggestions("sug_awayTeam", getUniqueTeams(records),   qf_awayTeam, qf_finalHome);
  renderSuggestions("sug_venue",    getUniqueVenues(records),  qf_venue,    qf_memo);

  show("quickForm");
  // 最初のフォーカスはホームチーム（日付ではない）
  setTimeout(() => qf_homeTeam.focus(), 80);
}

function readQuickForm() {
  const finalHome = qf_finalHome.value === "" ? null : Number(qf_finalHome.value);
  const finalAway = qf_finalAway.value === "" ? null : Number(qf_finalAway.value);
  const homeTeam  = qf_homeTeam.value.trim();
  const awayTeam  = qf_awayTeam.value.trim();
  return {
    id:          null,
    dateTime:    qf_dateTime.value,
    league:      qf_league.value.trim(),
    homeTeam,
    awayTeam,
    venue:       qf_venue.value.trim(),
    seat:        "",
    finalHome,
    finalAway,
    result:      computeResult(finalHome, finalAway, homeTeam, awayTeam),
    useQuarters: false,
    quarters:    [],
    players:     [],
    flow:        "",
    play:        "",
    mvp:         "",
    food:        "",
    event:       "",
    cheer:       "",
    note:        qf_memo.value.trim(),
    createdAt:   null,
    updatedAt:   null,
  };
}

async function onQuickSave() {
  const homeTeam = qf_homeTeam.value.trim();
  const awayTeam = qf_awayTeam.value.trim();
  const league   = qf_league.value.trim();

  if (!homeTeam && !awayTeam && !league) {
    alert("チーム名かリーグ名を入力してください。");
    return;
  }

  const rec = readQuickForm();
  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData.user;

  if (user) {
    try {
      const saved = await saveRecordToSupabase(rec);
      await refreshRecords();
      currentId = saved.id;
      openDetail(saved.id);
    } catch (e) {
      console.error(e);
      alert("保存に失敗しました: " + e.message);
    }
  } else {
    rec.id        = uid();
    rec.createdAt = new Date().toISOString();
    rec.updatedAt = rec.createdAt;
    records.unshift(rec);
    records.sort((a,b) => (b.dateTime || b.updatedAt || "").localeCompare(a.dateTime || a.updatedAt || ""));
    saveRecords(records);
    currentId = rec.id;
    openDetail(rec.id);
  }
}

// ===== CRUD =====
function openFormForNew(){
  currentId = null;
  formTitle.textContent = "新規記録";
  clearForm();
  show("form");
}

function openFormForEdit(id){
  const rec = records.find(r => r.id === id);
  if (!rec) return;
  currentId = id;
  formTitle.textContent = "編集";
  fillForm(rec);
  show("form");
}

function clearForm(){
  // defaults
  f_dateTime.value = "";
  f_league.value = "";
  f_homeTeam.value = "";
  f_awayTeam.value = "";
  f_venue.value = "";
  f_seat.value = "";
  f_finalHome.value = "";
  f_finalAway.value = "";
  f_result.value = "";
  f_flow.value = "";
  f_play.value = "";
  f_mvp.value = "";
  f_food.value = "";
  f_event.value = "";
  f_cheer.value = "";
  f_note.value = "";
  resetQuarters();
  resetPlayers();

  quartersContent.classList.add("hide");
  quartersAddArea.classList.remove("hide");
}

function fillForm(rec){
  f_dateTime.value = rec.dateTime || "";
  f_league.value = rec.league || "";
  f_homeTeam.value = rec.homeTeam || "";
  f_awayTeam.value = rec.awayTeam || "";
  f_venue.value = rec.venue || "";
  f_seat.value = rec.seat || "";

  f_finalHome.value = rec.finalHome ?? "";
  f_finalAway.value = rec.finalAway ?? "";
  f_result.value = rec.result || computeResult(rec.finalHome, rec.finalAway, rec.homeTeam, rec.awayTeam);

  fillQuarters(rec.quarters || []);
  const qs = rec.quarters || [];
  const hasQuarterScores = qs.some(x => x && (x.home != null || x.away != null));
  const showQ = rec.useQuarters ?? hasQuarterScores;
  quartersContent.classList.toggle("hide", !showQ);
  quartersAddArea.classList.toggle("hide", showQ);
  fillPlayers(rec.players || []);

  f_flow.value = rec.flow || "";
  f_play.value = rec.play || "";
  f_mvp.value = rec.mvp || "";

  f_food.value = rec.food || "";
  f_event.value = rec.event || "";
  f_cheer.value = rec.cheer || "";
  f_note.value = rec.note || "";
}

async function onSave(){
  if (f_finalHome.value === "" || f_finalAway.value === "") {
    alert("最終スコア（ホーム/アウェイ）は必須です。");
    return;
  }

  const rec = readForm();
  if (!rec.homeTeam && !rec.awayTeam && !rec.league && !rec.dateTime){
    alert("最低でも「日付 or リーグ or チーム名」を入れるのがおすすめ！");
  }

  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData.user;

  if (user) {
    // ===== Supabase 保存 =====
    if (currentId) rec.id = currentId;
    try {
      const saved = await saveRecordToSupabase(rec);
      await refreshRecords();
      currentId = saved.id;
      openDetail(saved.id);
    } catch (e) {
      console.error(e);
      alert("保存に失敗しました: " + e.message);
    }
  } else {
    // ===== localStorage 保存 =====
    if (currentId){
      const idx = records.findIndex(r => r.id === currentId);
      if (idx >= 0){
        rec.id = currentId;
        rec.updatedAt = new Date().toISOString();
        records[idx] = rec;
      }
    } else {
      rec.id = uid();
      rec.createdAt = new Date().toISOString();
      rec.updatedAt = rec.createdAt;
      records.unshift(rec);
    }

    // sort: dateTime desc if available, else updatedAt desc
    records.sort((a,b) => (b.dateTime || b.updatedAt || "").localeCompare(a.dateTime || a.updatedAt || ""));

    saveRecords(records);
    currentId = rec.id;
    openDetail(rec.id);
  }
}

function readForm(){
  const finalHome = f_finalHome.value === "" ? null : Number(f_finalHome.value);
  const finalAway = f_finalAway.value === "" ? null : Number(f_finalAway.value);
  const homeTeam = f_homeTeam.value.trim();
  const awayTeam = f_awayTeam.value.trim();
  const quartersVisible = !quartersContent.classList.contains("hide");
  const quarters = quartersVisible
    ? readQuarters().filter(x => x.home != null || x.away != null)
    : [];

  const rec = {
    id: null,
    dateTime: f_dateTime.value,
    league: f_league.value.trim(),
    homeTeam,
    awayTeam,
    venue: f_venue.value.trim(),
    seat: f_seat.value.trim(),

    finalHome,
    finalAway,
    result: computeResult(finalHome, finalAway, homeTeam, awayTeam),
    useQuarters: quartersVisible,
    quarters,
    players: readPlayers(),

    flow: f_flow.value.trim(),
    play: f_play.value.trim(),
    mvp: f_mvp.value.trim(),

    food: f_food.value.trim(),
    event: f_event.value.trim(),
    cheer: f_cheer.value.trim(),
    note: f_note.value.trim(),

    createdAt: null,
    updatedAt: null
  };
  return rec;
}

async function deleteRecordFromSupabase(id) {
  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData.user;
  if (!user) return false;
  const { error } = await supabaseClient.from("watch_logs").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  return true;
}

async function onDelete(id){
  const rec = records.find(r => r.id === id);
  if (!rec) return;
  if (!confirm("この記録を削除しますか？")) return;

  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData.user;

  try {
    if (user) {
      await deleteRecordFromSupabase(id);
    } else {
      records = records.filter(r => r.id !== id);
      saveRecords(records);
    }
  } catch (e) {
    console.error(e);
    alert("削除に失敗しました。");
    return;
  }

  await refreshRecords();
  currentId = null;
  show("list");
}

// ===== Render list/detail =====
function renderList(){
  const q = (qEl.value || "").trim().toLowerCase();
  const filtered = records.filter(r => {
    if (!q) return true;
    const blob = [
      r.league, r.homeTeam, r.awayTeam, r.venue, r.seat,
      r.flow, r.play, r.mvp, r.food, r.event, r.cheer, r.note
    ].join(" ").toLowerCase();
    return blob.includes(q);
  });

  countPill.textContent = `${filtered.length}件`;
  listEl.innerHTML = "";
  emptyEl.classList.toggle("hide", filtered.length !== 0);

  filtered.forEach(r => {
    const matchup = `${r.homeTeam || "HOME"} vs ${r.awayTeam || "AWAY"}`;
    const score = (r.finalHome != null && r.finalAway != null) ? `${r.finalHome} - ${r.finalAway}` : "—";
    const dt = fmtDateTime(r.dateTime) || "日付未設定";
    const venue = r.venue || "会場未設定";
    const league = r.league || "リーグ未設定";

    const dotClass = (r.finalHome == null || r.finalAway == null) ? "draw"
      : (r.finalHome > r.finalAway ? "win" : (r.finalHome < r.finalAway ? "lose" : "draw"));

    const card = document.createElement("div");
    card.className = "card";
    card.style.cursor = "pointer";
    card.innerHTML = `
      <div class="hd">
        <div class="title">
          <h2>${esc(matchup)}</h2>
          <div class="meta">${esc(dt)} ・ ${esc(league)}</div>
        </div>
        <span class="pill"><span class="dot ${dotClass}"></span>${esc(score)}</span>
      </div>
      <div class="bd">
        <div class="tag"><span class="dot" style="opacity:.35"></span><span>${esc(venue)}</span></div>
        ${r.mvp ? `<div class="small" style="margin-top:8px">MVP: ${esc(r.mvp)}</div>` : `<div class="small" style="margin-top:8px">メモ: 未入力</div>`}
      </div>
    `;
    card.addEventListener("click", () => openDetail(r.id));
    listEl.appendChild(card);
  });
}

function openDetail(id){
  const rec = records.find(r => r.id === id);
  if (!rec) return;
  currentId = id;

  const matchup = `${rec.homeTeam || "HOME"} vs ${rec.awayTeam || "AWAY"}`;
  const score = (rec.finalHome != null && rec.finalAway != null) ? `${rec.finalHome} - ${rec.finalAway}` : "—";
  detailTitle.textContent = matchup;
  detailMeta.textContent = `${fmtDateTime(rec.dateTime) || "日付未設定"} ・ ${rec.league || "リーグ未設定"} ・ ${score}`;

  detailBody.innerHTML = `
    ${kvGrid("基本情報", [
      ["会場", rec.venue || "—"],
      ["座席", rec.seat || "—"],
    ])}
    ${kvGrid("試合結果", [
      ["勝敗", rec.result || "—"],
      ["最終スコア", score],
    ])}
    ${quartersView(rec)}
    ${playersView(rec)}
    ${kvGrid("試合内容のメモ", [
      ["試合の展開", rec.flow || "—"],
      ["印象に残ったプレー", rec.play || "—"],
      ["自分の選ぶMVP", rec.mvp || "—"],
    ])}
    ${kvGrid("会場の雰囲気・体験", [
      ["アリーナグルメ", rec.food || "—"],
      ["演出・イベント", rec.event || "—"],
      ["応援の様子", rec.cheer || "—"],
      ["同行者・備考", rec.note || "—"],
    ])}
    <div class="hr"></div>
    <div class="small">更新: ${fmtDateTime(rec.updatedAt) || "—"}</div>
    <div class="detailAddMore">
      <div>
        <div class="detailAddMore-text">クオーター・選手・メモを追加できます</div>
        <div class="detailAddMore-sub">詳しく書くと振り返りに役立ちます</div>
      </div>
      <button class="btn primary" id="btnDetailAddMore">詳しく追記する</button>
    </div>
  `;

  document.getElementById("btnDetailAddMore").addEventListener("click", () => openFormForEdit(currentId));

  show("detail");
}

function kvGrid(title, items){
  const cells = items.map(([k,v]) => `
    <div class="kv">
      <div class="k">${esc(k)}</div>
      <div class="v">${esc(v)}</div>
    </div>
  `).join("");
  return `
    <div class="sectionTitle">${esc(title)}</div>
    <div class="kvs">${cells}</div>
    <div class="hr"></div>
  `;
}

function quartersView(rec){
  const qs = (rec.quarters || []).filter(x => x && x.label);
  const any = qs.some(x => x.home != null || x.away != null);
  if (!any) return "";
  const rows = qs.map(x => `
    <tr>
      <td><strong>${esc(x.label)}</strong></td>
      <td>${x.home == null ? "—" : esc(String(x.home))}</td>
      <td>${x.away == null ? "—" : esc(String(x.away))}</td>
    </tr>
  `).join("");
  return `
    <div class="sectionTitle">クォーター別得点</div>
    <table class="table">
      <thead><tr><th style="width:90px">Q</th><th>ホーム</th><th>アウェイ</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="hr"></div>
  `;
}

function playersView(rec){
  const ps = (rec.players || []);
  if (!ps.length) return "";
  const rows = ps.map(p => `
    <tr>
      <td>${esc(p.name || "—")}</td>
      <td>${esc(teamLabel(p.team))}</td>
      <td>${p.pts == null ? "—" : esc(String(p.pts))}</td>
      <td>${p.reb == null ? "—" : esc(String(p.reb))}</td>
      <td>${p.ast == null ? "—" : esc(String(p.ast))}</td>
      <td>${esc(p.note || "")}</td>
    </tr>
  `).join("");
  return `
    <div class="sectionTitle">注目選手のスタッツ</div>
    <table class="table">
      <thead><tr>
        <th>選手名</th><th style="width:120px">チーム</th>
        <th style="width:90px">PTS</th><th style="width:90px">REB</th><th style="width:90px">AST</th>
        <th>メモ</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="hr"></div>
  `;
}

function teamLabel(v){
  if (v === "home") return "ホーム";
  if (v === "away") return "アウェイ";
  if (v === "other") return "その他";
  return "—";
}

function esc(s){
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
function numOrEmpty(x){
  return (x == null || Number.isNaN(Number(x))) ? "" : String(x);
}

// ===== Export/Import =====
function exportJSON(){
  const data = JSON.stringify(records, null, 2);
  const blob = new Blob([data], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `basketball-watchlog-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importJSON(){
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const arr = JSON.parse(reader.result);
        if (!Array.isArray(arr)) throw new Error("not array");
        // merge by id
        const map = new Map(records.map(r => [r.id, r]));
        arr.forEach(r => {
          if (!r || typeof r !== "object") return;
          if (!r.id) r.id = uid();
          map.set(r.id, r);
        });
        records = [...map.values()];
        records.sort((a,b) => (b.dateTime || b.updatedAt || "").localeCompare(a.dateTime || a.updatedAt || ""));
        saveRecords(records);
        show("list");
        alert("インポートしました！");
      } catch(e){
        alert("読み込みに失敗しました（JSON形式を確認してね）");
      }
    };
    reader.readAsText(file, "utf-8");
  };
  input.click();
}

function resetAll(){
  if (!confirm("全データを削除して初期化します。よろしいですか？")) return;
  records = [];
  saveRecords(records);
  show("list");
}

// ===== Auth =====
function getAuthRedirectUrl() {
  return window.location.origin + window.location.pathname;
}

function isAnonymousUser(user) {
  return !!user && !user.email;
}

async function onStartAnonymous() {
  const { data, error } = await supabaseClient.auth.signInAnonymously();

  console.log("anonymous sign-in data:", data);
  console.log("anonymous sign-in error:", error);

  if (error) {
    alert(`登録なしの開始に失敗しました: ${error.message}`);
    return;
  }

  alert("登録なしで開始しました");
}

function setAuthUI(user, message = "") {
  if (!user) {
    authStatus.textContent = "未開始";
    btnLogin.textContent = "メールでログイン";
    btnStartAnonymous.classList.remove("hide");
    authEmail.classList.remove("hide");
    btnLogin.classList.remove("hide");
    btnLogout.classList.add("hide");
    authHelp.classList.remove("hide");
  } else if (isAnonymousUser(user)) {
    authStatus.textContent = "登録なしで利用中";
    btnLogin.textContent = "メールで引き継ぐ";
    btnStartAnonymous.classList.add("hide");
    authEmail.classList.remove("hide");
    btnLogin.classList.remove("hide");
    btnLogout.classList.remove("hide");
    authHelp.classList.remove("hide");
  } else {
    authStatus.textContent = message || ("ログイン中: " + (user.email || "メール不明"));
    btnLogin.textContent = "メールでログイン";
    btnStartAnonymous.classList.add("hide");
    authEmail.classList.add("hide");
    btnLogin.classList.add("hide");
    btnLogout.classList.remove("hide");
    authHelp.classList.remove("hide");
  }
}

async function initAuth() {
  const { data } = await supabaseClient.auth.getSession();
  setAuthUI(data.session ? data.session.user : null);

  supabaseClient.auth.onAuthStateChange((event, session) => {
    setAuthUI(session ? session.user : null);
    refreshRecords().catch(console.error);
  });

  await refreshRecords();
}

async function onLogin() {
  const email = authEmail.value.trim();
  if (!email) { alert("メールアドレスを入力してください。"); return; }

  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData.user;

  if (isAnonymousUser(user)) {
    // 匿名ユーザー → メールで引き継ぎ
    authStatus.textContent = "送信中…";
    const { error } = await supabaseClient.auth.updateUser(
      { email },
      { emailRedirectTo: getAuthRedirectUrl() }
    );
    if (error) {
      console.error(error);
      alert(`引き継ぎ用メールの送信に失敗しました: ${error.message}`);
      authStatus.textContent = "登録なしで利用中";
    } else {
      alert("確認メールを送りました。メール内のリンクを開くと、この記録を引き継げます。");
      authStatus.textContent = "登録なしで利用中";
    }
  } else {
    // 通常ログイン
    authStatus.textContent = "送信中…";
    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: getAuthRedirectUrl() }
    });
    if (error) {
      authStatus.textContent = "エラー: " + error.message;
    } else {
      authStatus.textContent = "確認メールを送りました。メールのリンクをクリックしてください。";
    }
  }
}

async function onLogout() {
  await supabaseClient.auth.signOut();
  setAuthUI(null);
}

// ===== Theme =====

// ---------------------------------------------------------------
// Color utilities（外部ライブラリなし）
// ---------------------------------------------------------------
function _hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) };
}
/** @param {string} hex @param {number} alpha @returns {string} */
function _hexToRgba(hex, alpha) {
  const { r, g, b } = _hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
/** 輝度で明暗判定 (>0.6 で "明るい") @param {string} hex @returns {boolean} */
function _isLight(hex) {
  const { r, g, b } = _hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}
/** @param {string} hex @param {number} ratio 0–1 @returns {string} */
function _darken(hex, ratio) {
  const { r, g, b } = _hexToRgb(hex);
  const d = c => Math.max(0, Math.round(c * (1 - ratio))).toString(16).padStart(2, "0");
  return `#${d(r)}${d(g)}${d(b)}`;
}

// ---------------------------------------------------------------
// ニュートラルベース定数（テーマによらず固定）
// ---------------------------------------------------------------
const BASE = Object.freeze({
  bg:          "#F5F5F3",
  surface:     "#FFFFFF",
  surface2:    "#F8F8F7",
  text:        "#1F2937",
  textMuted:   "#6B7280",
  border:      "#E4E4E7",
  neutralSoft: "#F0F0F2",
  shadowColor: "rgba(0,0,0,.07)",
});

// ---------------------------------------------------------------
// JSDoc 型定義
// ---------------------------------------------------------------
/**
 * @typedef {Object} ThemePalette
 * チームの公式カラーに近い生色。UI 変換前の値を持つ。
 * @property {string}  primary        - 主色（CTA・強調）
 * @property {string}  [primarySoft]  - primary の薄い版。省略時はニュートラル
 * @property {string}  [secondary]    - 補助色（バッジ・枠・テキスト）
 * @property {string}  [secondarySoft]
 * @property {string}  [tertiary]     - 第3色（限定アクセント。省略可）
 * @property {string}  [tertiarySoft]
 */

/**
 * @typedef {Object} ThemeRules
 * palette → UI token 変換時のヒント。
 * @property {boolean}               [secondaryIsLight]  - secondary が白/明るい系。soft をニュートラルへ逃がす
 * @property {boolean}               [tertiaryIsLight]   - tertiary が明るい系
 * @property {'primary'|'secondary'} [ctaColor]          - CTA の色源。省略時 primary
 * @property {'primary'|'secondary'} [navAccentColor]    - ナビ active の色源。省略時 primary
 * @property {'secondary'|'tertiary'}[chartAccent2]      - グラフ2色目の色源
 * @property {'secondary'|'tertiary'}[chartAccent3]      - グラフ3色目の色源
 */

/**
 * @typedef {Object} ThemeDefinition
 * チームテーマの完全な定義。生色＋変換ルール＋例外上書きを持つ。
 * @property {string}        id
 * @property {string}        name
 * @property {string}        shortName
 * @property {boolean}       [isDefault]
 * @property {string}        category      - "bleague" | "sample" など
 * @property {ThemePalette}  palette
 * @property {ThemeRules}    [rules]
 * @property {Partial<ResolvedThemeTokens>} [overrides]  - resolveTheme の結果を部分上書き
 */

/**
 * @typedef {Object} ResolvedThemeTokens
 * CSS 変数へ流し込む UI 役割色のセット。
 * -- ニュートラルベース
 * @property {string} bg           @property {string} surface      @property {string} surface2
 * @property {string} text         @property {string} textMuted    @property {string} border
 * @property {string} shadowColor
 * -- primary
 * @property {string} teamPrimary  @property {string} teamPrimaryHover
 * @property {string} teamPrimarySoft @property {string} teamPrimaryText @property {string} teamPrimaryGlow
 * -- secondary
 * @property {string} teamSecondary @property {string} teamSecondarySoft @property {string} teamSecondaryText
 * -- tertiary（定義がなければ secondary で代替）
 * @property {string} teamTertiary @property {string} teamTertiarySoft @property {string} teamTertiaryText
 * -- ナビ
 * @property {string} navActiveBg  @property {string} navActiveText @property {string} navInactiveText
 * -- CTA
 * @property {string} ctaBg        @property {string} ctaText       @property {string} ctaShadow
 * -- フォーム
 * @property {string} focusRing
 * -- バッジ
 * @property {string} badgeBg      @property {string} badgeText     @property {string} badgeBorder
 * -- チャート
 * @property {string} chart1       @property {string} chart2        @property {string} chart3
 */

// ---------------------------------------------------------------
// テーマ定義
// ---------------------------------------------------------------
/** @type {ThemeDefinition[]} */
const THEMES = [
  {
    id: "bleague-monochrome",
    name: "B.LEAGUE 白黒",
    shortName: "白黒",
    isDefault: true,
    category: "bleague",
    palette: {
      primary:     "#1A1A2E",
      primarySoft: "#E8E8EC",
      secondary:   "#6B7280",
    },
  },
];

/** @type {ThemeDefinition[]} */
const TEAM_THEME_PRESETS = [
  { id: "levanga-hokkaido",           name: "レバンガ北海道",                 shortName: "北海道",   category: "b-league", palette: { primary: "#8ec21f", secondary: "#000000" } },
  { id: "sendai-89ers",               name: "仙台89ERS",                      shortName: "仙台",     category: "b-league", palette: { primary: "#eae713", secondary: "#000000" }, rules: { primaryIsLight: true } },
  { id: "akita-northern-happinets",   name: "秋田ノーザンハピネッツ",         shortName: "秋田",     category: "b-league", palette: { primary: "#e30072", secondary: "#c38d21" } },
  { id: "ibaraki-robots",             name: "茨城ロボッツ",                   shortName: "茨城",     category: "b-league", palette: { primary: "#023894", secondary: "#ee8a00" } },
  { id: "utsunomiya-brex",            name: "宇都宮ブレックス",               shortName: "宇都宮",   category: "b-league", palette: { primary: "#ffd400", secondary: "#12315a" }, rules: { primaryIsLight: true } },
  { id: "gunma-crane-thunders",       name: "群馬クレインサンダーズ",         shortName: "群馬",     category: "b-league", palette: { primary: "#000000", secondary: "#ffe102", tertiary: "#e60013" } },
  { id: "koshigaya-alphas",           name: "越谷アルファーズ",               shortName: "越谷",     category: "b-league", palette: { primary: "#7e1b2f", secondary: "#c7b27d" } },
  { id: "altiri-chiba",               name: "アルティーリ千葉",               shortName: "A千葉",    category: "b-league", palette: { primary: "#030b1c", secondary: "#ffffff" }, rules: { secondaryIsLight: true } },
  { id: "chiba-jets",                 name: "千葉ジェッツ",                   shortName: "千葉J",    category: "b-league", palette: { primary: "#c8181d", secondary: "#dee1e1" }, rules: { secondaryIsLight: true } },
  { id: "alvark-tokyo",               name: "アルバルク東京",                 shortName: "A東京",    category: "b-league", palette: { primary: "#e60021", secondary: "#000000" } },
  { id: "sunrockers-shibuya",         name: "サンロッカーズ渋谷",             shortName: "渋谷",     category: "b-league", palette: { primary: "#fff100", secondary: "#743e94", tertiary: "#000000" }, rules: { primaryIsLight: true } },
  { id: "kawasaki-brave-thunders",    name: "川崎ブレイブサンダース",         shortName: "川崎",     category: "b-league", palette: { primary: "#8f0038", secondary: "#b58f26" } },
  { id: "yokohama-b-corsairs",        name: "横浜ビー・コルセアーズ",         shortName: "横浜BC",   category: "b-league", palette: { primary: "#00263A", secondary: "#A6192E", tertiary: "#83704C" } },
  { id: "toyama-grouses",             name: "富山グラウジーズ",               shortName: "富山",     category: "b-league", palette: { primary: "#d60d1a", secondary: "#000000" } },
  { id: "san-en-neophoenix",          name: "三遠ネオフェニックス",           shortName: "三遠",     category: "b-league", palette: { primary: "#e80013", secondary: "#fcd200", tertiary: "#000000" } },
  { id: "seahorses-mikawa",           name: "シーホース三河",                 shortName: "三河",     category: "b-league", palette: { primary: "#00469c", secondary: "#030303", tertiary: "#b39240" } },
  { id: "fighting-eagles-nagoya",     name: "ファイティングイーグルス名古屋", shortName: "FE名古屋", category: "b-league", palette: { primary: "#223f99", secondary: "#ed1f22" } },
  { id: "nagoya-diamond-dolphins",    name: "名古屋ダイヤモンドドルフィンズ", shortName: "名古屋D",  category: "b-league", palette: { primary: "#ed1a21", secondary: "#b8a469", tertiary: "#000000" } },
  { id: "shiga-lakes",                name: "滋賀レイクス",                   shortName: "滋賀",     category: "b-league", palette: { primary: "#015caa", secondary: "#000000", tertiary: "#fac000" } },
  { id: "kyoto-hannaryz",             name: "京都ハンナリーズ",               shortName: "京都",     category: "b-league", palette: { primary: "#0085a6", secondary: "#f2f2f2" }, rules: { secondaryIsLight: true } },
  { id: "osaka-evessa",               name: "大阪エヴェッサ",                 shortName: "大阪",     category: "b-league", palette: { primary: "#fc0301", secondary: "#c69933", tertiary: "#000000" } },
  { id: "shimane-susanoo-magic",      name: "島根スサノオマジック",           shortName: "島根",     category: "b-league", palette: { primary: "#066fb9", secondary: "#a6a6a1" } },
  { id: "hiroshima-dragonflies",      name: "広島ドラゴンフライズ",           shortName: "広島",     category: "b-league", palette: { primary: "#e84509", secondary: "#02adab" } },
  { id: "saga-ballooners",            name: "佐賀バルーナーズ",               shortName: "佐賀",     category: "b-league", palette: { primary: "#00a5cf", secondary: "#ed40a8" } },
  { id: "nagasaki-velca",             name: "長崎ヴェルカ",                   shortName: "長崎",     category: "b-league", palette: { primary: "#1d2d52", secondary: "#ffffff" }, rules: { secondaryIsLight: true } },
  { id: "ryukyu-golden-kings",        name: "琉球ゴールデンキングス",         shortName: "琉球",     category: "b-league", palette: { primary: "#d6bb72", secondary: "#003d66", tertiary: "#c41a1f" }, rules: { primaryIsLight: true } },
];

/** モノクローム先頭 → チームプリセット順の表示用リスト @type {ThemeDefinition[]} */
const ALL_THEMES = [...THEMES, ...TEAM_THEME_PRESETS];

const THEME_KEY = "bb_theme_id";
const THEME_ONBOARDING_KEY = "bb_theme_onboarding_seen";

let activeThemeId = localStorage.getItem(THEME_KEY) || "bleague-monochrome";

/** @param {string} id @returns {ThemeDefinition} */
function getThemeById(id) {
  return ALL_THEMES.find(t => t.id === id) || ALL_THEMES.find(t => t.isDefault) || ALL_THEMES[0];
}

// ---------------------------------------------------------------
/**
 * ThemeDefinition → ResolvedThemeTokens へ変換する。
 * 責務: palette を読む → rules で light 判定 → soft 色を決める
 *       → CTA / nav / badge / chart の役割色へ変換 → overrides で例外上書き
 * @param {ThemeDefinition} def
 * @returns {ResolvedThemeTokens}
 */
function resolveTheme(def) {
  const p = def.palette;
  const r = def.rules || {};

  const primary   = p.primary;
  const pSoft     = p.primarySoft   || BASE.neutralSoft;
  const secondary = p.secondary     || BASE.textMuted;
  const tertiary  = p.tertiary      || null;

  // secondary が白系の場合、soft はニュートラルへ逃がして UI 白飛びを防ぐ
  const sSoft = r.secondaryIsLight ? BASE.neutralSoft : (p.secondarySoft || BASE.neutralSoft);
  // tertiary が明るい系の場合も同様
  const tSoft = r.tertiaryIsLight  ? BASE.neutralSoft : (p.tertiarySoft  || BASE.neutralSoft);

  // CTA / nav の色源（rules で切り替え可能。省略時は primary）
  const ctaSrc  = r.ctaColor       === "secondary" ? secondary : primary;
  const navSrc  = r.navAccentColor === "secondary" ? secondary : primary;
  const navSSrc = r.navAccentColor === "secondary" ? sSoft     : pSoft;

  // テキスト色：輝度で自動判定
  const onPrimary   = _isLight(primary)   ? BASE.text : "#FFFFFF";
  const onSecondary = _isLight(secondary) ? BASE.text : "#FFFFFF";
  const onTertiary  = tertiary ? (_isLight(tertiary) ? BASE.text : "#FFFFFF") : BASE.text;
  const onCta       = _isLight(ctaSrc)    ? BASE.text : "#FFFFFF";

  /** @type {ResolvedThemeTokens} */
  const tokens = {
    // ニュートラルベース（テーマによらず固定）
    bg: BASE.bg, surface: BASE.surface, surface2: BASE.surface2,
    text: BASE.text, textMuted: BASE.textMuted, border: BASE.border,
    shadowColor: BASE.shadowColor,

    // primary
    teamPrimary:      primary,
    teamPrimaryHover: _darken(primary, 0.12),
    teamPrimarySoft:  pSoft,
    teamPrimaryText:  onPrimary,
    teamPrimaryGlow:  _hexToRgba(primary, 0.35),

    // secondary
    teamSecondary:     secondary,
    teamSecondarySoft: sSoft,
    teamSecondaryText: onSecondary,

    // tertiary（定義なし → secondary で代替。直接参照は最小限に）
    teamTertiary:     tertiary || secondary,
    teamTertiarySoft: tertiary ? tSoft : sSoft,
    teamTertiaryText: tertiary ? onTertiary : onSecondary,

    // ナビ
    navActiveBg:     navSSrc,
    navActiveText:   navSrc,
    navInactiveText: BASE.textMuted,

    // CTA
    ctaBg:    ctaSrc,
    ctaText:  onCta,
    ctaShadow: _hexToRgba(ctaSrc, 0.4),

    // フォーム
    focusRing: pSoft,

    // バッジ（white secondary の場合は border を濃くして識別性を確保）
    badgeBg:     sSoft,
    badgeText:   r.secondaryIsLight ? BASE.text : secondary,
    badgeBorder: r.secondaryIsLight ? BASE.border : secondary,

    // チャート
    chart1: primary,
    chart2: secondary,
    chart3: tertiary || BASE.textMuted,
  };

  // overrides を最後に上書き（テーマ固有の例外調整）
  if (def.overrides) Object.assign(tokens, def.overrides);

  return tokens;
}

// ---------------------------------------------------------------
/**
 * ResolvedThemeTokens を CSS 変数へ流し込む
 * @param {ResolvedThemeTokens} tokens
 */
function applyResolvedTheme(tokens) {
  const root = document.documentElement;
  const set  = (k, v) => { if (v != null) root.style.setProperty(k, v); };
  set("--bg",         tokens.bg);
  set("--surface",    tokens.surface);
  set("--surface-2",  tokens.surface2);
  set("--text",       tokens.text);
  set("--text-muted", tokens.textMuted);
  set("--border",     tokens.border);
  set("--team-primary",        tokens.teamPrimary);
  set("--team-primary-hover",  tokens.teamPrimaryHover);
  set("--team-primary-soft",   tokens.teamPrimarySoft);
  set("--on-team-primary",     tokens.teamPrimaryText);
  set("--team-primary-glow",   tokens.teamPrimaryGlow);
  set("--team-secondary",      tokens.teamSecondary);
  set("--team-secondary-soft", tokens.teamSecondarySoft);
  set("--on-team-secondary",   tokens.teamSecondaryText);
  set("--team-tertiary",       tokens.teamTertiary);
  set("--team-tertiary-soft",  tokens.teamTertiarySoft);
  set("--on-team-tertiary",    tokens.teamTertiaryText);
}

/**
 * ThemeDefinition または themeId を受け取り、解決・適用・UI 更新まで行う
 * @param {ThemeDefinition|string} themeOrId
 */
function applyTheme(themeOrId) {
  const def    = typeof themeOrId === "string" ? getThemeById(themeOrId) : themeOrId;
  const tokens = resolveTheme(def);
  applyResolvedTheme(tokens);
  activeThemeId = def.id;
  const nameEl = document.getElementById("currentThemeName");
  if (nameEl) nameEl.textContent = def.name;
}

// --- テーマシート ---
const themeOverlay  = document.getElementById("themeOverlay");
const themeSheetEl  = document.getElementById("themeSheet");
const themeListEl   = document.getElementById("themeList");

function renderThemeList(selectedId) {
  themeListEl.innerHTML = "";
  ALL_THEMES.forEach(t => {
    const btn = document.createElement("button");
    btn.className = "themeItem" + (t.id === selectedId ? " selected" : "");
    btn.dataset.id = t.id;
    const swatchColors = [t.palette.primary, t.palette.secondary, t.palette.tertiary].filter(Boolean);
    const swatchHtml = swatchColors.map(c => `<span style="background:${c}"></span>`).join("");
    btn.innerHTML = `
      <div class="themeItem-swatch">${swatchHtml}</div>
      <span class="themeItem-name">${t.name}</span>
      ${t.id === selectedId ? '<span class="themeItem-check">✓</span>' : ""}
    `;
    btn.addEventListener("click", () => {
      applyTheme(t);
      renderThemeList(t.id);
    });
    themeListEl.appendChild(btn);
  });
}

function openThemeSheet() {
  renderThemeList(activeThemeId);
  themeSheetEl.classList.add("open");
  themeOverlay.classList.add("open");
}

function closeThemeSheet() {
  localStorage.setItem(THEME_KEY, activeThemeId);
  themeSheetEl.classList.remove("open");
  themeOverlay.classList.remove("open");
}

document.getElementById("btnThemeLater").addEventListener("click", closeThemeSheet);
document.getElementById("btnThemeApply").addEventListener("click", closeThemeSheet);
document.getElementById("btnOpenThemeSheet").addEventListener("click", openThemeSheet);
themeOverlay.addEventListener("click", closeThemeSheet);

// --- 初期化 ---
function initTheme() {
  applyTheme(activeThemeId);
  if (!localStorage.getItem(THEME_ONBOARDING_KEY)) {
    localStorage.setItem(THEME_ONBOARDING_KEY, "1");
    setTimeout(() => openThemeSheet(), 800);
  }
}

/** Enter キーで次フィールドへ移動（クイック記録フォーム用） */
function initQuickFieldNav() {
  const fields = [
    qf_dateTime, qf_league, qf_homeTeam, qf_awayTeam,
    qf_finalHome, qf_finalAway, qf_venue, qf_memo,
  ];
  fields.forEach((el, i) => {
    el.addEventListener("keydown", e => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const next = fields[i + 1];
      if (next) next.focus();
    });
  });
}

// ===== Init =====
initTheme();
show("list");
initAuth();
initSuggestionFilters();
initQuickFieldNav();
