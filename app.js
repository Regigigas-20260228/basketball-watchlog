const SUPABASE_URL = "https://qeflnlfgumsyfkgrhzgb.supabase.co";
const SUPABASE_KEY = "sb_publishable_m01uu29KPm9SNGpqEFZ9_g_B_jBwNP_";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
  const full = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (full) return `${full[1]}/${full[2]}/${full[3]}`;
  const month = iso.match(/^(\d{4})-(\d{2})/);
  if (month) return `${month[1]}/${month[2]}`;
  return iso;
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
const viewHome = document.getElementById("viewHome");
const viewBest = document.getElementById("viewBest");
const viewStats = document.getElementById("viewStats");
const viewAccount = document.getElementById("viewAccount");

const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const countPill = document.getElementById("countPill");
const qEl = document.getElementById("q");
const listSortEl     = document.getElementById("listSort");
const filterResultEl = document.getElementById("filterResult");
const filterVenueEl  = document.getElementById("filterVenue");
const filterTeamEl   = document.getElementById("filterTeam");

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

// qfd (クイックフォーム詳細) refs
const qfdDetailEl  = document.getElementById("qfdDetail");
const qfdToggleBtn = document.getElementById("btnQfdToggle");
const qfdQContent  = document.getElementById("qfd_quartersContent");
const qfdQAddArea  = document.getElementById("qfd_quartersAddArea");
const qfdQBody     = document.getElementById("qfd_quartersBody");
const qfdPBody     = document.getElementById("qfd_playersBody");

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
function setNavActive(navId) {
  document.querySelectorAll(".navItem").forEach(el => el.classList.remove("active"));
  if (navId) document.getElementById(navId).classList.add("active");
}

document.getElementById("btnPrimaryRecord").addEventListener("click", () => openQuickFormForNew());
document.getElementById("btnNavHome").addEventListener("click", () => {
  show("home"); setNavActive("btnNavHome");
});
document.getElementById("btnNavBest").addEventListener("click", () => {
  show("best"); setNavActive("btnNavBest");
});
document.getElementById("btnNavReview").addEventListener("click", () => {
  show("stats"); setNavActive("btnNavReview");
});
document.getElementById("btnNavAccount").addEventListener("click", () => {
  show("account"); setNavActive("btnNavAccount");
});

// quick form buttons
document.getElementById("btnQuickCancel").addEventListener("click", () => show("list"));
document.getElementById("btnQuickCancelFooter").addEventListener("click", () => show("list"));
document.getElementById("btnQuickSave").addEventListener("click", () => onQuickSave().catch(console.error));

// buttons
document.getElementById("btnBack").addEventListener("click", () => show("home"));
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
  listSortEl.value     = "desc";
  filterResultEl.value = "";
  filterVenueEl.value  = "";
  filterTeamEl.value   = "";
  renderList();
});
qEl.addEventListener("input", renderList);
listSortEl.addEventListener("change", renderList);
filterResultEl.addEventListener("change", renderList);
filterVenueEl.addEventListener("change", renderList);
filterTeamEl.addEventListener("change", renderList);

function updateFResult() {
  f_result.value = computeResult(f_finalHome.value, f_finalAway.value, f_homeTeam.value, f_awayTeam.value);
}
[f_finalHome, f_finalAway, f_homeTeam, f_awayTeam].forEach(el => el.addEventListener("input", updateFResult));

// ===== Supabase read =====
function rowToRecord(row) {
  return {
    id:           row.id,
    dateTime:     row.date_time,
    league:       row.league,
    homeTeam:     row.home_team,
    awayTeam:     row.away_team,
    venue:        row.venue,
    seat:         row.seat,
    finalHome:    row.final_home,
    finalAway:    row.final_away,
    result:       row.result,
    supportedSide: row.supported_side || "",
    supportedTeam: row.supported_team || "",
    useQuarters:  row.use_quarters,
    quarters:     row.quarters,
    players:      row.players,
    flow:         row.flow,
    play:         row.play,
    mvp:          row.mvp,
    food:         row.food,
    event:        row.event,
    cheer:        row.cheer,
    note:         row.note,
    createdAt:    row.created_at,
    updatedAt:    row.updated_at,
  };
}

async function loadRecordsFromSupabase() {
  const user = await getSupabaseUser();
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
  renderHome();
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
    result:         rec.result || null,
    supported_side: rec.supportedSide || null,
    supported_team: rec.supportedTeam || null,
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
  const user = await getSupabaseUser();
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

/** Supabase の現在ユーザーを返す。未認証なら null */
async function getSupabaseUser() {
  const { data } = await supabaseClient.auth.getUser();
  return data.user;
}

// ===== State =====
let records = [];
let currentId = null;
// 応援側ラジオの手動変更フラグ（自動選択による上書きを防ぐ）
let qfSupportedSideManuallySet = false;
let fSupportedSideManuallySet  = false;

// ===== Routing-ish =====
function show(which){
  viewHome.classList.toggle("hide", which !== "home");
  viewList.classList.toggle("hide", which !== "list");
  viewDetail.classList.toggle("hide", which !== "detail");
  viewForm.classList.toggle("hide", which !== "form");
  viewQuickForm.classList.toggle("hide", which !== "quickForm");
  viewBest.classList.toggle("hide", which !== "best");
  viewStats.classList.toggle("hide", which !== "stats");
  viewAccount.classList.toggle("hide", which !== "account");
  if (which === "home")  renderHome();
  if (which === "list")  renderList();
  if (which === "stats") renderStats();

  // 入力モード（クイック記録 / 詳細フォーム）中はボトムナビを隠す
  const inputModes = ["form", "quickForm"];
  bottomDock.classList.toggle("hide", inputModes.includes(which));

  // list・detail はホーム配下のサブ画面として扱う
  const navMap = { home: "btnNavHome", list: "btnNavHome", detail: "btnNavHome", best: "btnNavBest", stats: "btnNavReview", account: "btnNavAccount" };
  setNavActive(navMap[which] || null);
}

// ===== Quarters =====
/** tbody を受け取って行を追加する共通実装 */
function addQuarterRowTo(tbody, label, homeVal = "", awayVal = "", removable = false) {
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
  if (removable) {
    const btn = document.createElement("button");
    btn.className = "btn"; btn.textContent = "削除";
    btn.addEventListener("click", () => tr.remove());
    tdOps.appendChild(btn);
  } else {
    tdOps.innerHTML = `<span class="small">固定</span>`;
  }
  tbody.appendChild(tr);
}
function addQuarterRow(label, homeVal = "", awayVal = "", removable = false) {
  addQuarterRowTo(quartersBody, label, homeVal, awayVal, removable);
}
function resetQuarters() {
  quartersBody.innerHTML = "";
  ["Q1","Q2","Q3","Q4"].forEach(q => addQuarterRow(q));
}
function nextOTLabel(){
  const labels = [...quartersBody.querySelectorAll("tr")].map(tr => tr.dataset.label);
  const otCount = labels.filter(x => x && x.startsWith("OT")).length;
  return "OT" + (otCount + 1);
}
/** tbody からクオーターデータを読む共通実装 */
function readQuartersFrom(tbody) {
  return [...tbody.querySelectorAll("tr")].map(tr => {
    const [homeInput, awayInput] = tr.querySelectorAll("input");
    return {
      label: tr.dataset.label,
      home: homeInput.value === "" ? null : Number(homeInput.value),
      away: awayInput.value === "" ? null : Number(awayInput.value),
    };
  });
}
function readQuarters() { return readQuartersFrom(quartersBody); }
function fillQuarters(qs){
  quartersBody.innerHTML = "";
  const base = ["Q1","Q2","Q3","Q4"];
  const map = new Map((qs||[]).map(x => [x.label, x]));
  base.forEach(label => {
    const x = map.get(label) || {};
    addQuarterRow(label, x.home ?? "", x.away ?? "", false);
  });
  (qs||[]).filter(x => x.label && x.label.startsWith("OT")).forEach(x => {
    addQuarterRow(x.label, x.home ?? "", x.away ?? "", true);
  });
}

// ===== Players =====
/** tbody を受け取って行を追加する共通実装 */
let _pcId = 0;
function addPlayerRowTo(container, p = {}) {
  const id = ++_pcId;
  const team = p.team || "";
  const card = document.createElement("div");
  card.className = "playerCard";
  card.innerHTML = `
    <div class="playerCard-top">
      <input class="pc-name" type="text" placeholder="例：#2 選手名" value="${esc(p.name || "")}">
      <button type="button" class="playerCard-del" aria-label="削除">✕</button>
    </div>
    <div class="playerCard-team">
      <span class="playerCard-teamLabel">チーム</span>
      <label class="pcTeamOpt"><input type="radio" name="pteam${id}" value="home"  ${team === "home"  ? "checked" : ""}><span>ホーム</span></label>
      <label class="pcTeamOpt"><input type="radio" name="pteam${id}" value="away"  ${team === "away"  ? "checked" : ""}><span>アウェイ</span></label>
      <label class="pcTeamOpt"><input type="radio" name="pteam${id}" value="other" ${team === "other" ? "checked" : ""}><span>その他</span></label>
      <label class="pcTeamOpt"><input type="radio" name="pteam${id}" value=""      ${!team            ? "checked" : ""}><span>-</span></label>
    </div>
    <div class="playerCard-stats">
      <div class="pcStatCol"><span class="pcStatLabel">PTS</span><input class="pc-pts" type="number" min="0" inputmode="numeric" placeholder="-" value="${numOrEmpty(p.pts)}"></div>
      <div class="pcStatCol"><span class="pcStatLabel">REB</span><input class="pc-reb" type="number" min="0" inputmode="numeric" placeholder="-" value="${numOrEmpty(p.reb)}"></div>
      <div class="pcStatCol"><span class="pcStatLabel">AST</span><input class="pc-ast" type="number" min="0" inputmode="numeric" placeholder="-" value="${numOrEmpty(p.ast)}"></div>
    </div>
    <div class="playerCard-note">
      <input class="pc-note" type="text" placeholder="メモ（例：ディフェンスが良かった）" value="${esc(p.note || "")}">
    </div>
  `;
  card.querySelector(".playerCard-del").addEventListener("click", () => card.remove());
  container.appendChild(card);
}
function addPlayerRow(p = {}) { addPlayerRowTo(playersBody, p); }
function resetPlayers(){
  playersBody.innerHTML = "";
  addPlayerRow();
}
/** カードコンテナから選手データを読む共通実装 */
function readPlayersFrom(container) {
  return [...container.querySelectorAll(".playerCard")].map(card => {
    const teamEl = card.querySelector('input[type="radio"]:checked');
    const pts = card.querySelector(".pc-pts").value;
    const reb = card.querySelector(".pc-reb").value;
    const ast = card.querySelector(".pc-ast").value;
    return {
      name: card.querySelector(".pc-name").value.trim(),
      team: teamEl ? teamEl.value : "",
      pts:  pts === "" ? null : Number(pts),
      reb:  reb === "" ? null : Number(reb),
      ast:  ast === "" ? null : Number(ast),
      note: card.querySelector(".pc-note").value.trim(),
    };
  }).filter(p => p.name !== "" || p.note !== "" || p.pts != null || p.reb != null || p.ast != null);
}
function readPlayers() { return readPlayersFrom(playersBody); }
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
function getUniqueFieldValues(recs, key) {
  const seen = new Set();
  return recs
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
 * @param {Function|null} [onSelect] チップ選択後に明示的に呼ぶコールバック
 */
function renderSuggestions(containerId, values, inputEl, nextEl, onSelect) {
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
      if (onSelect) onSelect();
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
  // クイック記録フォーム
  setup(qf_league,   "sug_league",   () => getUniqueLeagues(records), qf_homeTeam);
  setup(qf_homeTeam, "sug_homeTeam", () => getUniqueTeams(records),   qf_awayTeam);
  setup(qf_awayTeam, "sug_awayTeam", () => getUniqueTeams(records),   qf_finalHome);
  setup(qf_venue,    "sug_venue",    () => getUniqueVenues(records),  qf_memo);
  // 編集フォーム
  setup(f_league,   "sug_f_league",   () => getUniqueLeagues(records), f_homeTeam);
  setup(f_homeTeam, "sug_f_homeTeam", () => getUniqueTeams(records),   f_awayTeam);
  setup(f_awayTeam, "sug_f_awayTeam", () => getUniqueTeams(records),   null);
  setup(f_venue,    "sug_f_venue",    () => getUniqueVenues(records),  null);
}

/** 詳細トグル・クオーター・選手ボタンの初期化（クイック記録フォーム用） */
function initQfdDetail() {
  qfdToggleBtn.addEventListener("click", () => {
    const nowOpen = qfdDetailEl.classList.contains("hide");
    qfdDetailEl.classList.toggle("hide", !nowOpen);
    qfdToggleBtn.textContent = nowOpen ? "－ 詳細入力を閉じる" : "＋ 詳細に記録する";
  });

  document.getElementById("btnQfdShowQuarters").addEventListener("click", () => {
    qfdQAddArea.classList.add("hide");
    qfdQContent.classList.remove("hide");
  });
  document.getElementById("btnQfdHideQuarters").addEventListener("click", () => {
    qfdQContent.classList.add("hide");
    qfdQAddArea.classList.remove("hide");
    qfdQBody.innerHTML = "";
  });
  document.getElementById("btnQfdAddOT").addEventListener("click", () => {
    const labels = [...qfdQBody.querySelectorAll("tr")].map(tr => tr.dataset.label);
    const n = labels.filter(x => x && x.startsWith("OT")).length;
    addQuarterRowTo(qfdQBody, "OT" + (n + 1));
  });
  document.getElementById("btnQfdAddPlayer").addEventListener("click", () => {
    addPlayerRowTo(qfdPBody);
  });
}

/** クイックフォーム詳細セクションを初期状態に戻す */
function resetQfdSection() {
  qfdDetailEl.classList.add("hide");
  qfdToggleBtn.textContent = "＋ 詳細に記録する";
  qfdQContent.classList.add("hide");
  qfdQAddArea.classList.remove("hide");
  qfdQBody.innerHTML = "";
  ["Q1","Q2","Q3","Q4"].forEach(q => addQuarterRowTo(qfdQBody, q));
  qfdPBody.innerHTML = "";
  addPlayerRowTo(qfdPBody);
  ["qfd_seat","qfd_flow","qfd_play","qfd_mvp","qfd_food","qfd_event","qfd_cheer"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

// ===== Quick Form =====
function openQuickFormForNew() {
  // 今日の日付を YYYY-MM-DD 形式で自動入力
  const now = new Date();
  qf_dateTime.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;

  qf_league.value    = "";
  qf_homeTeam.value  = "";
  qf_awayTeam.value  = "";
  qf_finalHome.value = "";
  qf_finalAway.value = "";
  qf_venue.value     = "";
  qf_memo.value      = "";

  // 過去入力から候補を初期描画
  renderSuggestions("sug_league",   getUniqueLeagues(records), qf_league,   qf_homeTeam);
  renderSuggestions("sug_homeTeam", getUniqueTeams(records),   qf_homeTeam, qf_awayTeam,   updateQfSupportedSide);
  renderSuggestions("sug_awayTeam", getUniqueTeams(records),   qf_awayTeam, qf_finalHome,  updateQfSupportedSide);
  renderSuggestions("sug_venue",    getUniqueVenues(records),  qf_venue,    qf_memo);

  // 応援側: フラグをリセット（チーム名入力後に自動選択が働くようにする）
  qfSupportedSideManuallySet = false;
  setQfSupportedSide("");

  // 詳細セクションをリセット・折りたたむ
  resetQfdSection();

  show("quickForm");
  // 最初のフォーカスはホームチーム（日付ではない）
  setTimeout(() => qf_homeTeam.focus(), 80);
}

const setQfSupportedSide = (v) => setRadioValue("qf_supportedSide", v);
const getQfSupportedSide = ()  => getRadioValue("qf_supportedSide");

function readQuickForm() {
  const finalHome = qf_finalHome.value === "" ? null : Number(qf_finalHome.value);
  const finalAway = qf_finalAway.value === "" ? null : Number(qf_finalAway.value);
  const homeTeam  = qf_homeTeam.value.trim();
  const awayTeam  = qf_awayTeam.value.trim();
  const supportedSide = getQfSupportedSide();

  // 詳細セクションが開いているときだけ詳細フィールドを読む
  const detailEl = document.getElementById("qfdDetail");
  const detailOpen = detailEl && !detailEl.classList.contains("hide");
  const qfdQContent = document.getElementById("qfd_quartersContent");
  const qfdQVisible = detailOpen && qfdQContent && !qfdQContent.classList.contains("hide");
  const qfdQBody = document.getElementById("qfd_quartersBody");
  const qfdPBody = document.getElementById("qfd_playersBody");

  return {
    id:            null,
    dateTime:      qf_dateTime.value,
    league:        qf_league.value.trim(),
    homeTeam,
    awayTeam,
    venue:         qf_venue.value.trim(),
    seat:          detailOpen ? document.getElementById("qfd_seat").value.trim()  : "",
    finalHome,
    finalAway,
    result:        computeResult(finalHome, finalAway, homeTeam, awayTeam),
    supportedSide,
    supportedTeam: supportedSide === "home" ? homeTeam : (supportedSide === "away" ? awayTeam : ""),
    useQuarters:   qfdQVisible,
    quarters:      qfdQVisible ? readQuartersFrom(qfdQBody).filter(x => x.home != null || x.away != null) : [],
    players:       detailOpen  ? readPlayersFrom(qfdPBody)  : [],
    flow:          detailOpen  ? document.getElementById("qfd_flow").value.trim()  : "",
    play:          detailOpen  ? document.getElementById("qfd_play").value.trim()  : "",
    mvp:           detailOpen  ? document.getElementById("qfd_mvp").value.trim()   : "",
    food:          detailOpen  ? document.getElementById("qfd_food").value.trim()  : "",
    event:         detailOpen  ? document.getElementById("qfd_event").value.trim() : "",
    cheer:         detailOpen  ? document.getElementById("qfd_cheer").value.trim() : "",
    note:          qf_memo.value.trim(),
    createdAt:     null,
    updatedAt:     null,
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
  const user = await getSupabaseUser();

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
    sortByDateTime(records);
    saveRecords(records);
    currentId = rec.id;
    openDetail(rec.id);
  }
}

/** dateTime → updatedAt フォールバックで降順ソート（破壊的） */
function sortByDateTime(arr) {
  arr.sort((a, b) => (b.dateTime || b.updatedAt || "").localeCompare(a.dateTime || a.updatedAt || ""));
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
  // 過去入力候補を初期描画
  renderSuggestions("sug_f_league",   getUniqueLeagues(records), f_league,   f_homeTeam);
  renderSuggestions("sug_f_homeTeam", getUniqueTeams(records),   f_homeTeam, f_awayTeam, updateFSupportedSide);
  renderSuggestions("sug_f_awayTeam", getUniqueTeams(records),   f_awayTeam, null,       updateFSupportedSide);
  renderSuggestions("sug_f_venue",    getUniqueVenues(records),  f_venue,    null);
  show("form");
}

function clearForm(){
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
  setFSupportedSide("");
  fSupportedSideManuallySet = false;
  resetQuarters();
  resetPlayers();

  quartersContent.classList.add("hide");
  quartersAddArea.classList.remove("hide");
}

function fillForm(rec){
  // type="date" には YYYY-MM-DD が必要。それ以外の形式はそのままセット（空になるだけ）
  f_dateTime.value = (rec.dateTime || "").slice(0, 10);
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

  // 応援していた側（既存データを尊重し、以降の自動上書きを抑制）
  setFSupportedSide(rec.supportedSide || "");
  fSupportedSideManuallySet = true;
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

  const user = await getSupabaseUser();

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
    sortByDateTime(records);

    saveRecords(records);
    currentId = rec.id;
    openDetail(rec.id);
  }
}

/** ラジオグループの選択値を読む */
function getRadioValue(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : "";
}
/** ラジオグループに値をセットする */
function setRadioValue(name, value) {
  document.querySelectorAll(`input[name="${name}"]`).forEach(el => { el.checked = el.value === value; });
}

const getFSupportedSide  = () => getRadioValue("f_supportedSide");
const setFSupportedSide  = (v) => setRadioValue("f_supportedSide", v);

function readForm(){
  const finalHome = f_finalHome.value === "" ? null : Number(f_finalHome.value);
  const finalAway = f_finalAway.value === "" ? null : Number(f_finalAway.value);
  const homeTeam = f_homeTeam.value.trim();
  const awayTeam = f_awayTeam.value.trim();
  const quartersVisible = !quartersContent.classList.contains("hide");
  const quarters = quartersVisible
    ? readQuarters().filter(x => x.home != null || x.away != null)
    : [];
  const supportedSide = getFSupportedSide();

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

    supportedSide,
    supportedTeam: supportedSide === "home" ? homeTeam : (supportedSide === "away" ? awayTeam : ""),

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
  const user = await getSupabaseUser();
  if (!user) return false;
  const { error } = await supabaseClient.from("watch_logs").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  return true;
}

async function onDelete(id){
  const rec = records.find(r => r.id === id);
  if (!rec) return;
  if (!confirm("この記録を削除しますか？")) return;

  const user = await getSupabaseUser();

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
  show("home");
}

// ===== Numeric input helpers =====

/** 全角数字を半角に変換し、数字以外を除去する */
function normalizeNumericInput(el) {
  el.addEventListener("input", () => {
    const normalized = el.value
      .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFF10 + 0x30))
      .replace(/[^0-9]/g, "");
    if (normalized !== el.value) el.value = normalized;
  });
}

// ===== List helpers =====

/** スコアと応援サイドから結果カテゴリを返す: "win" | "loss" | "draw" | "" */
function getResultCategory(r) {
  const h = r.finalHome != null ? Number(r.finalHome) : null;
  const a = r.finalAway != null ? Number(r.finalAway) : null;
  if (h === null || a === null || isNaN(h) || isNaN(a)) return "";
  if (h === a) return "draw";
  const homeWins = h > a;
  if (r.supportedSide === "home") return homeWins ? "win" : "loss";
  if (r.supportedSide === "away") return homeWins ? "loss" : "win";
  return "undecided"; // 応援側未設定 → 勝敗未判定
}

/** select の options を動的に更新（現在値を保持） */
function populateFilterOptions(selectEl, values, placeholder) {
  const current = selectEl.value;
  selectEl.innerHTML = `<option value="">${placeholder}</option>`;
  values.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    if (v === current) opt.selected = true;
    selectEl.appendChild(opt);
  });
}

// ===== Stats helpers =====

function getStatsSummary(recs) {
  return { total: recs.length };
}

function getCheeringStats(recs) {
  const supported = recs.filter(r => r.supportedSide === "home" || r.supportedSide === "away");
  let wins = 0, losses = 0, draws = 0;
  supported.forEach(r => {
    const h = r.finalHome, a = r.finalAway;
    if (h == null || a == null) return;
    const mySide = r.supportedSide === "home" ? h : a;
    const oppSide = r.supportedSide === "home" ? a : h;
    if (mySide > oppSide) wins++;
    else if (mySide < oppSide) losses++;
    else draws++;
  });
  const withScore = wins + losses + draws;
  const winRate = withScore > 0 ? Math.round(wins / withScore * 100) : null;
  return { total: supported.length, wins, losses, draws, winRate };
}

function getTopTeams(recs, limit = 3) {
  const counts = {};
  recs.forEach(r => {
    [r.homeTeam, r.awayTeam].forEach(t => {
      if (t) counts[t] = (counts[t] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function getTopVenues(recs, limit = 3) {
  const counts = {};
  recs.forEach(r => { if (r.venue) counts[r.venue] = (counts[r.venue] || 0) + 1; });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function getLeagueBreakdown(recs) {
  const counts = {};
  recs.forEach(r => {
    const l = r.league || "未設定";
    counts[l] = (counts[l] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

function getMonthlyCounts(recs) {
  const counts = {};
  recs.forEach(r => {
    if (!r.dateTime) return;
    const m = r.dateTime.slice(0, 7); // YYYY-MM
    counts[m] = (counts[m] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, count }));
}

function getRecentRecords(recs, limit = 3) {
  return [...recs]
    .sort((a, b) => (b.dateTime || b.updatedAt || "").localeCompare(a.dateTime || a.updatedAt || ""))
    .slice(0, limit);
}

// ===== Stats render =====

function renderStats() {
  const body = document.getElementById("statsBody");
  if (!body) return;

  if (records.length === 0) {
    body.innerHTML = `
      <div class="card">
        <div class="hd"><div class="title"><h2>振り返り</h2></div></div>
        <div class="bd">
          <p class="statsEmpty">記録が増えると、ここで振り返れるようになります</p>
        </div>
      </div>`;
    return;
  }

  const summary   = getStatsSummary(records);
  const cheering  = getCheeringStats(records);
  const teams     = getTopTeams(records);
  const venues    = getTopVenues(records);
  const leagues   = getLeagueBreakdown(records);
  const monthly   = getMonthlyCounts(records);
  const recent    = getRecentRecords(records);

  // --- 応援勝率 ---
  const cheeringHtml = cheering.total === 0
    ? `<div class="statsNote">応援していたチームを記録すると、応援時の勝率も見られます</div>`
    : `
      <div class="statsNumGrid">
        <div class="statsNum">
          <span class="statsNum-value">${cheering.total}</span>
          <span class="statsNum-label">応援した試合</span>
        </div>
        <div class="statsNum">
          <span class="statsNum-value">${cheering.winRate != null ? cheering.winRate + "%" : "—"}</span>
          <span class="statsNum-label">応援時の勝率</span>
        </div>
        <div class="statsNum statsNum--wide">
          <span class="statsNum-value">${cheering.wins}勝 ${cheering.losses}敗${cheering.draws > 0 ? ` ${cheering.draws}分` : ""}</span>
          <span class="statsNum-label">応援戦績</span>
        </div>
      </div>`;

  // --- ランキング行ビルダー ---
  const maxTeam   = teams[0]  ? teams[0].count  : 1;
  const maxVenue  = venues[0] ? venues[0].count : 1;
  const maxLeague = leagues[0] ? leagues[0].count : 1;
  const maxMonth  = monthly.length ? Math.max(...monthly.map(m => m.count)) : 1;

  const rankRow = (label, count, max) => `
    <div class="statsRankItem">
      <span class="statsRankName">${esc(label)}</span>
      <div class="statsRankBar">
        <div class="statsRankBarFill" style="width:${Math.round(count/max*100)}%"></div>
      </div>
      <span class="statsRankCount">${count}</span>
    </div>`;

  const teamsHtml   = teams.length   ? teams.map(t => rankRow(t.name, t.count, maxTeam)).join("")     : `<p class="statsNote">データなし</p>`;
  const venuesHtml  = venues.length  ? venues.map(v => rankRow(v.name, v.count, maxVenue)).join("")   : `<p class="statsNote">データなし</p>`;
  const leaguesHtml = leagues.length ? leagues.map(l => rankRow(l.name, l.count, maxLeague)).join("") : `<p class="statsNote">データなし</p>`;

  // --- 月別 ---
  const monthlyHtml = monthly.length ? monthly.map(m => {
    const [y, mo] = m.month.split("-");
    return rankRow(`${y}年${parseInt(mo)}月`, m.count, maxMonth);
  }).join("") : `<p class="statsNote">データなし</p>`;

  // --- 最近の記録 ---
  const recentHtml = recent.map(r => {
    const matchup = `${r.homeTeam || "HOME"} vs ${r.awayTeam || "AWAY"}`;
    const score = (r.finalHome != null && r.finalAway != null) ? `${r.finalHome}–${r.finalAway}` : "—";
    const dt = fmtDateTime(r.dateTime) || "日付未設定";
    return `
      <div class="statsRecentItem" data-id="${r.id}" style="cursor:pointer">
        <div class="statsRecentMain">${esc(matchup)}</div>
        <div class="statsRecentSub">${esc(dt)} ・ ${esc(score)}</div>
      </div>`;
  }).join("");

  body.innerHTML = `
    <div class="card">
      <div class="hd"><div class="title"><h2>サマリー</h2><div class="meta">観戦の記録をまとめて振り返る</div></div></div>
      <div class="bd">
        <div class="statsNumGrid">
          <div class="statsNum statsNum--accent">
            <span class="statsNum-value">${summary.total}</span>
            <span class="statsNum-label">総観戦数</span>
          </div>
        </div>
        <div class="hr"></div>
        ${cheeringHtml}
      </div>
    </div>

    <div class="card">
      <div class="hd"><div class="title"><h2>よく見たチーム</h2></div></div>
      <div class="bd statsRankList">${teamsHtml}</div>
    </div>

    <div class="card">
      <div class="hd"><div class="title"><h2>よく行った会場</h2></div></div>
      <div class="bd statsRankList">${venuesHtml}</div>
    </div>

    <div class="card">
      <div class="hd"><div class="title"><h2>リーグ別</h2></div></div>
      <div class="bd statsRankList">${leaguesHtml}</div>
    </div>

    <div class="card">
      <div class="hd"><div class="title"><h2>月別観戦数</h2></div></div>
      <div class="bd statsRankList">${monthlyHtml}</div>
    </div>

    <div class="card">
      <div class="hd"><div class="title"><h2>最近の記録</h2></div></div>
      <div class="bd statsRecentList" id="statsRecentList">${recentHtml}</div>
    </div>`;

  // 最近の記録タップで詳細へ
  body.querySelectorAll(".statsRecentItem[data-id]").forEach(el => {
    el.addEventListener("click", () => {
      currentId = el.dataset.id;
      openDetail(el.dataset.id);
    });
  });
}

// ===== Home helpers =====

/** 直近の観戦傾向を人に読めるテキストで最大2件返す */
function buildHighlights(recs) {
  if (!recs.length) return [];
  const items = [];

  // 直近の応援試合の勝敗
  const recentSupported = getRecentRecords(recs, 5)
    .filter(r => (r.supportedSide === "home" || r.supportedSide === "away") && r.finalHome != null && r.finalAway != null);
  if (recentSupported.length >= 2) {
    let wins = 0, losses = 0;
    recentSupported.forEach(r => {
      const mine = r.supportedSide === "home" ? r.finalHome : r.finalAway;
      const opp  = r.supportedSide === "home" ? r.finalAway : r.finalHome;
      if (mine > opp) wins++;
      else if (mine < opp) losses++;
    });
    const n = wins + losses;
    if (n > 0) items.push(`直近 ${n} 試合で ${wins} 勝 ${losses} 敗`);
  }

  // 最もよく行った会場
  const top = getTopVenues(recs, 1);
  if (top.length) items.push(`よく行った会場：${top[0].name}（${top[0].count} 回）`);

  return items.slice(0, 2);
}

// ===== Home render =====

function renderHome() {
  const body = document.getElementById("homeBody");
  if (!body) return;

  const latest = getRecentRecords(records, 1)[0] || null;

  // ── Hero card ──────────────────────────────────────────────
  let heroHtml;
  if (!latest) {
    heroHtml = `
      <div class="card homeHero emptyHeroCard">
        <div class="homeHero-emptyTitle">まだ観戦記録がありません</div>
        <div class="homeHero-emptySub">最初の1試合を記録してみましょう</div>
        <button class="btn primary primaryButton" id="btnHomeRecord">＋ 記録する</button>
      </div>`;
  } else {
    const homeTeam = latest.homeTeam || "HOME";
    const awayTeam = latest.awayTeam || "AWAY";
    const hasScore = latest.finalHome != null && latest.finalAway != null;
    const score    = hasScore ? `${latest.finalHome} - ${latest.finalAway}` : "—";
    const dt       = fmtDateTime(latest.dateTime) || "日付未設定";
    const meta     = [dt, latest.league].filter(Boolean).join(" · ");
    const supportedHome = latest.supportedSide === "home";
    const supportedAway = latest.supportedSide === "away";
    const homeLabelHtml = `<span class="homeHero-sideLabel${supportedHome ? " homeHero-sideLabel--on" : ""}">${supportedHome ? '<span class="homeHero-supportMark">★</span> ' : ""}HOME</span>`;
    const awayLabelHtml = `<span class="homeHero-sideLabel${supportedAway ? " homeHero-sideLabel--on" : ""}">${supportedAway ? '<span class="homeHero-supportMark">★</span> ' : ""}AWAY</span>`;
    const resultCat = getResultCategory(latest); // "win"|"loss"|"draw"|"undecided"|""
    const outcomeMap = { win: "WIN", loss: "LOSE", draw: "DRAW" };
    const outcomeLabel = (supportedHome || supportedAway) ? (outcomeMap[resultCat] || "") : "";
    const outcomeHtml = outcomeLabel
      ? `<div class="homeHero-outcome homeHero-outcome--${resultCat}">${outcomeLabel}</div>`
      : "";
    const venueHtml = latest.venue
      ? `<span class="homeHero-venueText">📍 ${esc(latest.venue)}</span>`
      : "";
    const subHtml = venueHtml
      ? `<div class="homeHero-subRow">${venueHtml}</div>`
      : "";
    heroHtml = `
      <div class="card homeHero">
        <div class="homeHero-eyebrow">${esc(meta)}</div>
        <div class="homeHero-arena">
          <div class="homeHero-side homeHero-side--home">
            ${homeLabelHtml}
            <div class="homeHero-teamName">${esc(homeTeam)}</div>
          </div>
          <div class="homeHero-scoreShelf">
            <span class="homeHero-score">${esc(score)}</span>
          </div>
          ${outcomeHtml}
          <div class="homeHero-side homeHero-side--away">
            ${awayLabelHtml}
            <div class="homeHero-teamName">${esc(awayTeam)}</div>
          </div>
        </div>
        ${subHtml}
        ${latest.note ? `<div class="homeHero-memo">${esc(latest.note)}</div>` : ""}
        <div class="homeHero-actions">
          <button class="btn homeHero-btnPrimary homeHero-btn" data-action="detail" data-id="${latest.id}">詳細を見る</button>
          <button class="homeHero-btnEdit homeHero-btn" data-action="edit" data-id="${latest.id}">追記・編集</button>
        </div>
      </div>`;
  }

  // ── Summary 2×2 ────────────────────────────────────────────
  const thisYear        = String(new Date().getFullYear());
  const thisYearCount   = records.filter(r => r.dateTime && r.dateTime.startsWith(thisYear)).length;
  const uniqueVenuesCnt = new Set(records.map(r => r.venue).filter(Boolean)).size;
  const cheering        = getCheeringStats(records);
  const winRateText     = cheering.winRate != null ? `${cheering.winRate}%` : "—";

  const summaryHtml = `
    <div class="card" style="padding:0;overflow:hidden">
      <div class="homeSummaryGrid">
        <div class="homeSummaryItem">
          <span class="homeSummaryItem-val">${records.length}</span>
          <span class="homeSummaryItem-label">通算観戦数</span>
        </div>
        <div class="homeSummaryItem">
          <span class="homeSummaryItem-val">${thisYearCount}</span>
          <span class="homeSummaryItem-label">${thisYear}年の観戦</span>
        </div>
        <div class="homeSummaryItem">
          <span class="homeSummaryItem-val">${uniqueVenuesCnt}</span>
          <span class="homeSummaryItem-label">行った会場数</span>
        </div>
        <div class="homeSummaryItem">
          <span class="homeSummaryItem-val">${winRateText}</span>
          <span class="homeSummaryItem-label">現地勝率</span>
        </div>
      </div>
    </div>`;

  // ── 最近の記録（ヒーロー除く直近2〜3件） ──────────────────────
  // ヒーローに最新1件を表示しているため、リストは2番目以降を最大3件表示する
  const recentRecs = latest ? getRecentRecords(records, 4).slice(1) : [];
  const recentItemsHtml = recentRecs.map(r => {
    const matchup = `${r.homeTeam || "HOME"} vs ${r.awayTeam || "AWAY"}`;
    const score   = r.finalHome != null && r.finalAway != null ? `${r.finalHome}–${r.finalAway}` : "—";
    const dt      = fmtDateTime(r.dateTime) || "日付未設定";
    return `
      <div class="homeRecentItem" data-id="${r.id}">
        <div class="homeRecentItem-main">${esc(matchup)}</div>
        <div class="homeRecentItem-sub">${esc(dt)} · ${esc(score)}</div>
      </div>`;
  }).join("");

  const recentHtml = recentRecs.length === 0 ? "" : `
    <div class="card" style="padding:0">
      <div class="sectionCard__header">
        <span class="homeSectionHd-title">最近の記録</span>
        <button class="homeSectionHd-more" id="btnHomeViewAll">すべて見る →</button>
      </div>
      <div class="sectionCard__body">
        ${recentItemsHtml}
      </div>
    </div>`;

  // ── マイベスト ────────────────────────────────────────────────
  const bestHtml = `
    <div class="card" style="padding:0">
      <div class="sectionCard__header">
        <span class="homeSectionHd-title">マイベスト</span>
        <button class="homeSectionHd-more" id="btnHomeViewBest">もっと見る →</button>
      </div>
      <div class="sectionCard__body">
        <div class="homeEmptyBlock">
          <p class="homeEmptyBlock-note">まだマイベストがありません</p>
          <button class="homeEmptyBlock-create" id="btnHomeBestCreate">最初のランキングを作る →</button>
        </div>
      </div>
    </div>`;

  // ── 振り返りハイライト ──────────────────────────────────────
  const highlights = buildHighlights(records);
  const highlightsHtml = highlights.length === 0 ? "" : `
    <div class="card" style="padding:0">
      <div class="sectionCard__header">
        <span class="homeSectionHd-title">振り返りハイライト</span>
        <button class="homeSectionHd-more" id="btnHomeViewStats">詳しく見る →</button>
      </div>
      <div class="sectionCard__body">
        <div class="homeHighlightList">
          ${highlights.map(h => `<div class="homeHighlightItem">${esc(h)}</div>`).join("")}
        </div>
      </div>
    </div>`;

  body.innerHTML = `
    ${heroHtml}
    ${summaryHtml}
    ${recentHtml}
    ${bestHtml}
    ${highlightsHtml}
  `;

  // イベント配線
  body.querySelectorAll(".homeRecentItem[data-id]").forEach(el => {
    el.addEventListener("click", () => openDetail(el.dataset.id));
  });
  body.querySelectorAll(".homeHero-btn[data-action]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      if (btn.dataset.action === "detail") openDetail(btn.dataset.id);
      else openFormForEdit(btn.dataset.id);
    });
  });

  const btnRecord   = body.querySelector("#btnHomeRecord");
  if (btnRecord)   btnRecord.addEventListener("click", () => openQuickFormForNew());

  const btnViewAll  = body.querySelector("#btnHomeViewAll");
  if (btnViewAll)  btnViewAll.addEventListener("click", () => show("list"));

  const btnViewBest = body.querySelector("#btnHomeViewBest");
  if (btnViewBest) btnViewBest.addEventListener("click", () => { show("best"); setNavActive("btnNavBest"); });

  const btnBestCreate = body.querySelector("#btnHomeBestCreate");
  if (btnBestCreate) btnBestCreate.addEventListener("click", () => { show("best"); setNavActive("btnNavBest"); });

  const btnViewStats = body.querySelector("#btnHomeViewStats");
  if (btnViewStats) btnViewStats.addEventListener("click", () => { show("stats"); setNavActive("btnNavReview"); });
}

// ===== Render list/detail =====
function renderList(){
  // フィルター用ドロップダウンを最新データで更新（現在値を保持）
  populateFilterOptions(filterVenueEl, getUniqueVenues(records), "会場: すべて");
  populateFilterOptions(filterTeamEl,  getUniqueTeams(records),  "チーム: すべて");

  const q       = (qEl.value || "").trim().toLowerCase();
  const sortDir = listSortEl.value;        // "desc" | "asc"
  const fResult = filterResultEl.value;   // "" | "win" | "loss" | "draw"
  const fVenue  = filterVenueEl.value;    // "" | venue string
  const fTeam   = filterTeamEl.value;     // "" | team string

  let filtered = records.filter(r => {
    if (q) {
      const blob = [
        r.league, r.homeTeam, r.awayTeam, r.venue, r.seat,
        r.flow, r.play, r.mvp, r.food, r.event, r.cheer, r.note
      ].join(" ").toLowerCase();
      if (!blob.includes(q)) return false;
    }
    if (fResult && getResultCategory(r) !== fResult) return false;
    if (fVenue  && r.venue    !== fVenue) return false;
    if (fTeam   && r.homeTeam !== fTeam && r.awayTeam !== fTeam) return false;
    return true;
  });

  filtered.sort((a, b) => {
    const da = a.dateTime || a.updatedAt || "";
    const db = b.dateTime || b.updatedAt || "";
    return sortDir === "asc" ? da.localeCompare(db) : db.localeCompare(da);
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

    const resultCat = getResultCategory(r);
    const dotClass  = resultCat === "win" ? "win" : resultCat === "loss" ? "lose" : "draw";

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
        ${r.mvp ? `<div class="small" style="margin-top:8px">MVP: ${esc(r.mvp)}</div>` : ""}
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

  const homeTeam = rec.homeTeam || "HOME";
  const awayTeam = rec.awayTeam || "AWAY";
  const hasScore = rec.finalHome != null && rec.finalAway != null;
  const scoreHtml = hasScore
    ? `${esc(String(rec.finalHome))}<span class="detailHero-sep"> - </span>${esc(String(rec.finalAway))}`
    : `—<span class="detailHero-sep"> - </span>—`;

  let resultBadge = "";
  if (rec.result === "win")       resultBadge = `<span class="detailHero-result win">勝利</span>`;
  else if (rec.result === "loss") resultBadge = `<span class="detailHero-result loss">敗戦</span>`;
  else if (rec.result === "draw") resultBadge = `<span class="detailHero-result draw">引き分け</span>`;

  const chips = [
    rec.dateTime ? fmtDateTime(rec.dateTime) : "日付未設定",
    rec.league || null,
  ].filter(Boolean).map(c => `<span class="detailHero-chip">${esc(c)}</span>`).join("");

  const supportedLabel = rec.supportedSide === "home"
    ? `${homeTeam}を応援`
    : rec.supportedSide === "away"
    ? `${awayTeam}を応援`
    : "";

  detailBody.innerHTML = `
    <div class="detailHero">
      <div class="detailHero-teams">
        <div class="detailHero-team home">${esc(homeTeam)}</div>
        <div class="detailHero-scoreCenter">
          <div class="detailHero-score">${scoreHtml}</div>
          ${resultBadge}
        </div>
        <div class="detailHero-team away">${esc(awayTeam)}</div>
      </div>
      <div class="detailHero-chips">
        ${chips}
        ${supportedLabel ? `<span class="detailHero-supported">★ ${esc(supportedLabel)}</span>` : ""}
      </div>
    </div>
    ${detailSection("基本情報", [
      ["会場", rec.venue || "—"],
      ["座席", rec.seat || "—"],
    ])}
    ${quartersView(rec)}
    ${playersView(rec)}
    ${detailSection("試合内容", [
      ["展開", rec.flow || "—"],
      ["印象プレー", rec.play || "—"],
      ["MVP", rec.mvp || "—"],
    ])}
    ${detailSection("観戦体験", [
      ["グルメ", rec.food || "—"],
      ["演出・イベント", rec.event || "—"],
      ["応援の様子", rec.cheer || "—"],
      ["同行者・備考", rec.note || "—"],
    ])}
    <div class="detailFooter">
      <div class="detailFooter-updated">更新: ${fmtDateTime(rec.updatedAt) || "—"}</div>
      <div class="detailAddMore">
        <div>
          <div class="detailAddMore-text">クオーター・選手・メモを追加できます</div>
          <div class="detailAddMore-sub">詳しく書くと振り返りに役立ちます</div>
        </div>
        <button class="btn primary" id="btnDetailAddMore">詳しく追記する</button>
      </div>
    </div>
  `;

  document.getElementById("btnDetailAddMore").addEventListener("click", () => openFormForEdit(currentId));

  show("detail");
}

function detailSection(title, items) {
  const rows = items.map(([k, v]) => `
    <div class="detailRow">
      <div class="detailRow-key">${esc(k)}</div>
      <div class="detailRow-val">${esc(v)}</div>
    </div>
  `).join("");
  return `
    <div class="detailBlock">
      <div class="detailBlock-title">${esc(title)}</div>
      ${rows}
    </div>
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
    <div class="detailBlock">
      <div class="detailBlock-title">クォーター別得点</div>
      <table class="table">
        <thead><tr><th style="width:90px">Q</th><th>ホーム</th><th>アウェイ</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
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
    <div class="detailBlock">
      <div class="detailBlock-title">注目選手のスタッツ</div>
      <table class="table">
        <thead><tr>
          <th>選手名</th><th style="width:80px">チーム</th>
          <th style="width:52px">PTS</th><th style="width:52px">REB</th><th style="width:52px">AST</th>
          <th>メモ</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
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
        sortByDateTime(records);
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
  const { error } = await supabaseClient.auth.signInAnonymously();

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

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    setAuthUI(session ? session.user : null);
    refreshRecords().catch(console.error);
  });

  await refreshRecords();
}

async function onLogin() {
  const email = authEmail.value.trim();
  if (!email) { alert("メールアドレスを入力してください。"); return; }

  const user = await getSupabaseUser();

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
  { id: "lime-black",          name: "ライム×ブラック",                 shortName: "ライム",     category: "color-preset", palette: { primary: "#8ec21f", secondary: "#000000" } },
  { id: "lemon-black",         name: "レモン×ブラック",                 shortName: "レモン",     category: "color-preset", palette: { primary: "#eae713", secondary: "#000000" }, rules: { primaryIsLight: true } },
  { id: "magenta-gold",        name: "マゼンタ×ゴールド",               shortName: "マゼンタ",   category: "color-preset", palette: { primary: "#e30072", secondary: "#c38d21" } },
  { id: "navy-orange",         name: "ネイビー×オレンジ",               shortName: "ネイビーO",  category: "color-preset", palette: { primary: "#023894", secondary: "#ee8a00" } },
  { id: "gold-navy",           name: "ゴールド×ネイビー",               shortName: "ゴールド",   category: "color-preset", palette: { primary: "#ffd400", secondary: "#12315a" }, rules: { primaryIsLight: true } },
  { id: "black-yellow-red",    name: "ブラック×イエロー×レッド",        shortName: "BYR",        category: "color-preset", palette: { primary: "#000000", secondary: "#ffe102", tertiary: "#e60013" } },
  { id: "burgundy-tan",        name: "バーガンディ×タン",               shortName: "バーガンディ",category: "color-preset", palette: { primary: "#7e1b2f", secondary: "#c7b27d" } },
  { id: "midnight-white",      name: "ミッドナイト×ホワイト",           shortName: "ミッドナイト",category: "color-preset", palette: { primary: "#030b1c", secondary: "#ffffff" }, rules: { secondaryIsLight: true } },
  { id: "red-silver",          name: "レッド×シルバー",                 shortName: "レッドS",    category: "color-preset", palette: { primary: "#c8181d", secondary: "#dee1e1" }, rules: { secondaryIsLight: true } },
  { id: "scarlet-black",       name: "スカーレット×ブラック",           shortName: "スカーレット",category: "color-preset", palette: { primary: "#e60021", secondary: "#000000" } },
  { id: "yellow-purple",       name: "イエロー×パープル",               shortName: "YP",         category: "color-preset", palette: { primary: "#fff100", secondary: "#743e94", tertiary: "#000000" }, rules: { primaryIsLight: true } },
  { id: "wine-gold",           name: "ワイン×ゴールド",                 shortName: "ワイン",     category: "color-preset", palette: { primary: "#8f0038", secondary: "#b58f26" } },
  { id: "dark-navy-crimson",   name: "ダークネイビー×クリムゾン",       shortName: "DN×CR",      category: "color-preset", palette: { primary: "#00263A", secondary: "#A6192E", tertiary: "#83704C" } },
  { id: "crimson-black",       name: "クリムゾン×ブラック",             shortName: "クリムゾン", category: "color-preset", palette: { primary: "#d60d1a", secondary: "#000000" } },
  { id: "red-yellow-black",    name: "レッド×イエロー×ブラック",        shortName: "RYB",        category: "color-preset", palette: { primary: "#e80013", secondary: "#fcd200", tertiary: "#000000" } },
  { id: "royal-blue-gold",     name: "ロイヤルブルー×ゴールド",         shortName: "ロイヤル",   category: "color-preset", palette: { primary: "#00469c", secondary: "#030303", tertiary: "#b39240" } },
  { id: "cobalt-red",          name: "コバルト×レッド",                 shortName: "コバルト",   category: "color-preset", palette: { primary: "#223f99", secondary: "#ed1f22" } },
  { id: "coral-gold",          name: "コーラル×ゴールド",               shortName: "コーラル",   category: "color-preset", palette: { primary: "#ed1a21", secondary: "#b8a469", tertiary: "#000000" } },
  { id: "ocean-amber",         name: "オーシャン×アンバー",             shortName: "オーシャン", category: "color-preset", palette: { primary: "#015caa", secondary: "#000000", tertiary: "#fac000" } },
  { id: "teal-white",          name: "ティール×ホワイト",               shortName: "ティール",   category: "color-preset", palette: { primary: "#0085a6", secondary: "#f2f2f2" }, rules: { secondaryIsLight: true } },
  { id: "flame-gold",          name: "フレーム×ゴールド",               shortName: "フレーム",   category: "color-preset", palette: { primary: "#fc0301", secondary: "#c69933", tertiary: "#000000" } },
  { id: "sky-gray",            name: "スカイ×グレー",                   shortName: "スカイ",     category: "color-preset", palette: { primary: "#066fb9", secondary: "#a6a6a1" } },
  { id: "orange-teal",         name: "オレンジ×ティール",               shortName: "OT",         category: "color-preset", palette: { primary: "#e84509", secondary: "#02adab" } },
  { id: "azure-pink",          name: "アジュール×ピンク",               shortName: "アジュール", category: "color-preset", palette: { primary: "#00a5cf", secondary: "#ed40a8" } },
  { id: "deep-navy-white",     name: "ディープネイビー×ホワイト",       shortName: "DN×W",       category: "color-preset", palette: { primary: "#1d2d52", secondary: "#ffffff" }, rules: { secondaryIsLight: true } },
  { id: "champagne-navy",      name: "シャンパン×ネイビー",             shortName: "シャンパン", category: "color-preset", palette: { primary: "#d6bb72", secondary: "#003d66", tertiary: "#c41a1f" }, rules: { primaryIsLight: true } },
];

/** モノクローム先頭 → チームプリセット順の表示用リスト @type {ThemeDefinition[]} */
const ALL_THEMES = [...THEMES, ...TEAM_THEME_PRESETS];

const THEME_KEY = "bb_theme_id";
const THEME_ONBOARDING_KEY = "bb_theme_onboarding_seen";
const FAVORITE_TEAM_KEY = "bb_favorite_team_name";

let activeThemeId = localStorage.getItem(THEME_KEY) || "bleague-monochrome";

function loadFavoriteTeamName() {
  return localStorage.getItem(FAVORITE_TEAM_KEY) || "";
}
function saveFavoriteTeamName(name) {
  localStorage.setItem(FAVORITE_TEAM_KEY, name.trim());
}

/** favoriteTeamName と home/away を照合して初期応援側を返す */
function detectSupportedSide(homeTeam, awayTeam) {
  const fav = loadFavoriteTeamName().toLowerCase();
  if (!fav) return "";
  if (homeTeam.trim().toLowerCase() === fav) return "home";
  if (awayTeam.trim().toLowerCase() === fav) return "away";
  return "";
}

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
      // IME 変換確定中は移動しない（日本語入力でのEnter誤移動を防ぐ）
      if (e.isComposing) return;
      e.preventDefault();
      const next = fields[i + 1];
      if (next) next.focus();
    });
  });
}

/** 推しチーム設定UIの初期化 */
function initFavoriteTeam() {
  const input = document.getElementById("favoriteTeamNameInput");
  const btn   = document.getElementById("btnSaveFavoriteTeam");
  if (!input || !btn) return;
  input.value = loadFavoriteTeamName();
  btn.addEventListener("click", () => {
    saveFavoriteTeamName(input.value);
    btn.textContent = "保存しました";
    setTimeout(() => { btn.textContent = "保存"; }, 1500);
  });
}

/** クイック記録フォーム: 手動変更済みでなければ応援側を再判定してセット */
function updateQfSupportedSide() {
  if (qfSupportedSideManuallySet) return;
  const side = detectSupportedSide(qf_homeTeam.value.trim(), qf_awayTeam.value.trim());
  setQfSupportedSide(side);
}

/** 編集フォーム: 手動変更済みでなければ応援側を再判定してセット */
function updateFSupportedSide() {
  if (fSupportedSideManuallySet) return;
  const side = detectSupportedSide(f_homeTeam.value.trim(), f_awayTeam.value.trim());
  setFSupportedSide(side);
}

/** チーム名変更時に応援側を自動再評価する（イベント登録） */
function initSupportedSideAutoDetect() {
  // change（フォーカスアウト）と input（チップ選択 dispatch 含む）両方を拾う
  qf_homeTeam.addEventListener("change", updateQfSupportedSide);
  qf_homeTeam.addEventListener("input",  updateQfSupportedSide);
  qf_awayTeam.addEventListener("change", updateQfSupportedSide);
  qf_awayTeam.addEventListener("input",  updateQfSupportedSide);

  // 手動変更を検知してフラグを立てる
  document.querySelectorAll('input[name="qf_supportedSide"]').forEach(r => {
    r.addEventListener("change", () => { qfSupportedSideManuallySet = true; });
  });

  f_homeTeam.addEventListener("change", updateFSupportedSide);
  f_homeTeam.addEventListener("input",  updateFSupportedSide);
  f_awayTeam.addEventListener("change", updateFSupportedSide);
  f_awayTeam.addEventListener("input",  updateFSupportedSide);

  document.querySelectorAll('input[name="f_supportedSide"]').forEach(r => {
    r.addEventListener("change", () => { fSupportedSideManuallySet = true; });
  });
}

// ===== Init =====
// 数字入力欄の半角正規化
[qf_finalHome, qf_finalAway, f_finalHome, f_finalAway].forEach(normalizeNumericInput);

initTheme();
show("home");
initAuth();
initSuggestionFilters();
initQuickFieldNav();
initQfdDetail();
initFavoriteTeam();
initSupportedSideAutoDetect();
