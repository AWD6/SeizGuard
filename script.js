/* ===== SeizGuard - ชักไม่ซ้ำ ===== */

const COMMON_AEDS = [
  { name: 'Phenytoin', thai: 'เฟนิโทอิน' },
  { name: 'Carbamazepine', thai: 'คาร์บามาซีพีน' },
  { name: 'Valproate (Depakine)', thai: 'วัลโปรเอต (ดีปาคีน)' },
  { name: 'Levetiracetam (Keppra)', thai: 'ลีเวไทราซีแทม (เคปปรา)' },
  { name: 'Lamotrigine', thai: 'ลาโมไทรจีน' },
  { name: 'Topiramate', thai: 'โทพิราเมท' },
  { name: 'Oxcarbazepine', thai: 'ออกซ์คาร์บาซีพีน' },
  { name: 'Gabapentin', thai: 'กาบาเพนติน' },
  { name: 'Phenobarbital', thai: 'ฟีโนบาร์บิทอล' },
];

const TIME_PRESETS = [
  { label: 'เช้า', time: '08:00' },
  { label: 'กลางวัน', time: '12:00' },
  { label: 'เย็น', time: '18:00' },
  { label: 'ก่อนนอน', time: '21:00' },
];

const SEIZURE_SYMPTOMS = [
  'เกร็งทั้งตัว','กระตุกแขนขา','เหม่อนิ่ง','ตาค้าง/กลอกตา',
  'หมดสติ','กัดลิ้น','อาเจียน','ปัสสาวะราด',
  'สับสนหลังชัก','ปวดศีรษะ','อ่อนแรงแขน/ขา','พูดไม่ได้ชั่วคราว',
];

const SIDE_EFFECTS = [
  'เวียนศีรษะ','มึนงง','ง่วงนอน','คลื่นไส้','อาเจียน','ผื่นผิวหนัง',
  'น้ำหนักเพิ่ม','ผมร่วง','เหงือกบวม','ตาพร่า/เห็นภาพซ้อน',
  'หงุดหงิด','นอนไม่หลับ','อ่อนเพลีย','เบื่ออาหาร','ท้องเสีย','มือสั่น',
];

const SEVERITY_DESCRIPTIONS = {
  1: {
    label: 'เล็กน้อยมาก',
    color: 'var(--success)',
    desc: 'อาการเพียงเล็กน้อย ไม่กระทบกิจวัตรประจำวัน เช่น รู้สึกชาเล็กน้อยชั่วคราว เหม่อนิ่งไม่กี่วินาที หรือผลข้างเคียงยาที่แทบไม่รู้สึก'
  },
  2: {
    label: 'เล็กน้อย',
    color: 'var(--success)',
    desc: 'อาการเล็กน้อย รบกวนเล็กน้อยแต่ยังทำกิจกรรมได้ตามปกติ เช่น กระตุกเฉพาะที่สั้นๆ มึนงงเล็กน้อย หรือรู้สึกง่วงเป็นบางเวลา'
  },
  3: {
    label: 'ปานกลาง',
    color: 'var(--warning)',
    desc: 'อาการปานกลาง กระทบการใช้ชีวิตบ้าง ต้องหยุดพักกิจกรรม เช่น อาการชักที่มีเกร็ง/กระตุกชัดเจนแต่ไม่นาน คลื่นไส้ต้องนอนพัก หรือเวียนศีรษะจนเดินไม่ถนัด'
  },
  4: {
    label: 'รุนแรง',
    color: 'var(--danger)',
    desc: 'อาการรุนแรง กระทบการใช้ชีวิตมาก ต้องการความช่วยเหลือ เช่น ชักนานกว่า 2-3 นาที สับสนหลังชักนาน หมดสติ ผลข้างเคียงรุนแรง (ผื่นลามทั้งตัว ตาเหลือง) ต้องไปพบแพทย์'
  },
  5: {
    label: 'รุนแรงมาก / ฉุกเฉิน',
    color: 'var(--danger)',
    desc: 'อาการรุนแรงมาก เป็นอันตรายต่อชีวิต ต้องเรียกรถฉุกเฉินทันที เช่น ชักนานเกิน 5 นาที (Status epilepticus) ชักซ้ำไม่หยุด หยุดหายใจ มีอาการ Stevens-Johnson Syndrome'
  }
};

const DAY_NAMES_TH = ['อา','จ','อ','พ','พฤ','ศ','ส'];
const MONTH_NAMES_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

let currentUser = null;
let selectedDate = new Date();
let selectedSeizureSeverity = 3;
let selectedSeizureSymptoms = [];
let selectedSideEffectSeverity = 2;
let selectedSideEffects = [];
let selectedSideEffectMedId = '';
let selectedTimes = ['08:00','21:00'];
let editingProfile = false;
let missedDoseStep = 'frequency';
let missedDoseFreq = 0;

function genId() { return Date.now().toString(36) + Math.random().toString(36).substr(2,9); }
function getDateStr(d) { return d.toISOString().split('T')[0]; }
function getTimeStr() { const n=new Date(); return n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0'); }

function userKey(key) { return `seizguard_${currentUser}_${key}`; }
function getData(key) { try { return JSON.parse(localStorage.getItem(userKey(key))) || []; } catch { return []; } }
function setData(key, val) { localStorage.setItem(userKey(key), JSON.stringify(val)); }
function getObj(key) { try { return JSON.parse(localStorage.getItem(userKey(key))); } catch { return null; } }
function setObj(key, val) { localStorage.setItem(userKey(key), JSON.stringify(val)); }

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

/* ===== AUTH ===== */
function handleLogin() {
  const u = document.getElementById('loginUsername').value.trim();
  const p = document.getElementById('loginPassword').value.trim();
  if (!u || !p) { showToast('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'); return; }
  const users = JSON.parse(localStorage.getItem('seizguard_users') || '{}');
  if (!users[u]) { showToast('ไม่พบผู้ใช้นี้ กรุณาลงทะเบียนก่อน'); return; }
  if (users[u] !== p) { showToast('รหัสผ่านไม่ถูกต้อง'); return; }
  currentUser = u;
  localStorage.setItem('seizguard_currentUser', u);
  enterApp();
}

function handleRegister() {
  const u = document.getElementById('loginUsername').value.trim();
  const p = document.getElementById('loginPassword').value.trim();
  if (!u || !p) { showToast('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'); return; }
  if (u.length < 3) { showToast('ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร'); return; }
  if (p.length < 4) { showToast('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร'); return; }
  const users = JSON.parse(localStorage.getItem('seizguard_users') || '{}');
  if (users[u]) { showToast('ชื่อผู้ใช้นี้ถูกใช้แล้ว'); return; }
  users[u] = p;
  localStorage.setItem('seizguard_users', JSON.stringify(users));
  currentUser = u;
  localStorage.setItem('seizguard_currentUser', u);
  showToast('ลงทะเบียนสำเร็จ!');
  enterApp();
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('seizguard_currentUser');
  document.getElementById('mainApp').classList.remove('active');
  document.getElementById('loginScreen').classList.add('active');
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
}

function enterApp() {
  document.getElementById('loginScreen').classList.remove('active');
  document.getElementById('mainApp').classList.add('active');
  showTab('home');
}

/* ===== TABS ===== */
function showTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));

  const tabMap = { home:'tabHome', learn:'tabLearn', assess:'tabAssess', profile:'tabProfile',
    missedDose:'tabMissedDose', learnDetail:'tabLearnDetail', medDetail:'tabMedDetail' };
  const btnMap = { home:'tabBtnHome', learn:'tabBtnLearn', assess:'tabBtnAssess', profile:'tabBtnProfile' };

  if (tabMap[tab]) document.getElementById(tabMap[tab]).classList.add('active');
  if (btnMap[tab]) document.getElementById(btnMap[tab]).classList.add('active');

  if (tab === 'home') renderHome();
  if (tab === 'learn') renderLearnTopics();
  if (tab === 'assess') renderAssess();
  if (tab === 'profile') renderProfile();
  if (tab === 'missedDose') renderMissedDose();
}

/* ===== HOME ===== */
function renderHome() {
  renderHeaderDate();
  renderWeekCalendar();
  generateDailyLogs();
  renderAdherence();
  renderMedList();
}

function renderHeaderDate() {
  const d = selectedDate;
  document.getElementById('headerDate').textContent =
    d.getDate() + ' ' + MONTH_NAMES_TH[d.getMonth()] + ' ' + (d.getFullYear()+543);
}

function renderWeekCalendar() {
  const container = document.getElementById('weekCalendar');
  const days = [];
  const start = new Date(selectedDate);
  start.setDate(start.getDate() - 3);
  for (let i=0;i<7;i++) { const d=new Date(start); d.setDate(d.getDate()+i); days.push(d); }
  const todayStr = getDateStr(new Date());
  const selStr = getDateStr(selectedDate);

  container.innerHTML = days.map(d => {
    const ds = getDateStr(d);
    const isSel = ds === selStr;
    const isToday = ds === todayStr && !isSel;
    return `<div class="day-item ${isSel?'selected':''} ${isToday?'today':''}" onclick="selectDate('${ds}')">
      <span class="day-name">${DAY_NAMES_TH[d.getDay()]}</span>
      <span class="day-num">${d.getDate()}</span>
    </div>`;
  }).join('');
}

function selectDate(ds) {
  selectedDate = new Date(ds + 'T00:00:00');
  renderHome();
}

function generateDailyLogs() {
  const ds = getDateStr(selectedDate);
  const meds = getData('medications');
  let logs = getData('medLogs');
  meds.forEach(med => {
    med.times.forEach(time => {
      const exists = logs.find(l => l.medicationId===med.id && l.scheduledTime===time && l.date===ds);
      if (!exists) {
        logs.push({ id:genId(), medicationId:med.id, scheduledTime:time, takenTime:null, status:'pending', date:ds });
      }
    });
  });
  setData('medLogs', logs);
}

function renderAdherence() {
  const logs = getData('medLogs');
  const now = new Date();
  const start = new Date(now); start.setDate(start.getDate()-7);
  const recent = logs.filter(l => { const d=new Date(l.date); return d>=start && d<=now; });
  const total = recent.length;
  const taken = recent.filter(l => l.status==='taken').length;
  const pct = total>0 ? Math.round(taken/total*100) : 0;

  document.getElementById('adherenceCard').innerHTML = `
    <div class="adherence-header"><i class="fas fa-chart-bar"></i><span>Adherence 7 วัน</span></div>
    <div class="adherence-bar"><div class="adherence-fill" style="width:${pct}%"></div></div>
    <div class="adherence-text">${taken}/${total} (${pct}%)</div>`;
}

function renderMedList() {
  const meds = getData('medications');
  const ds = getDateStr(selectedDate);
  const logs = getData('medLogs').filter(l => l.date === ds);
  const isToday = getDateStr(new Date()) === ds;

  document.getElementById('medSectionTitle').textContent = isToday ? 'ยาวันนี้' : 'ยาวันที่ ' + selectedDate.getDate();

  if (meds.length === 0) {
    document.getElementById('medList').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-pills"></i>
        <h3>ยังไม่มีรายการยา</h3>
        <p>กดปุ่ม + เพื่อเพิ่มรายการยากันชัก</p>
      </div>`;
    return;
  }

  document.getElementById('medList').innerHTML = logs.map(log => {
    const med = meds.find(m => m.id === log.medicationId);
    if (!med) return '';
    const isTaken = log.status === 'taken';
    const thaiName = getThaiName(med.name);
    return `<div class="med-card ${isTaken?'taken':''}" onclick="showMedDetail('${med.id}')">
      <div class="med-icon ${isTaken?'done':'pending'}">
        <i class="fas ${isTaken?'fa-check-circle':'fa-clock'}"></i>
      </div>
      <div class="med-info">
        <div class="med-name">${med.name}</div>
        ${thaiName ? `<div class="med-name-th">${thaiName}</div>` : ''}
        <div class="med-dosage">${med.dosage}</div>
        <div class="med-time-row">
          <i class="fas fa-clock"></i> ${log.scheduledTime}
          ${log.takenTime ? `<span class="taken-time">(กินเมื่อ ${log.takenTime})</span>` : ''}
        </div>
      </div>
      ${isTaken
        ? `<span class="taken-badge">กินแล้ว</span>`
        : `<button class="take-btn" onclick="event.stopPropagation();takePill('${log.id}')"><i class="fas fa-check"></i></button>`
      }
    </div>`;
  }).join('');
}

function getThaiName(engName) {
  const found = COMMON_AEDS.find(a => engName.toLowerCase().includes(a.name.split(' ')[0].toLowerCase()));
  return found ? found.thai : '';
}

function takePill(logId) {
  let logs = getData('medLogs');
  const idx = logs.findIndex(l => l.id === logId);
  if (idx !== -1) {
    logs[idx].status = 'taken';
    logs[idx].takenTime = getTimeStr();
    setData('medLogs', logs);
    renderHome();
    showToast('บันทึกการกินยาแล้ว');
  }
}

/* ===== ADD MEDICATION MODAL ===== */
function showAddMedModal() {
  document.getElementById('medName').value = '';
  document.getElementById('medDosage').value = '';
  document.getElementById('medPillCount').value = '';
  document.getElementById('medNotes').value = '';
  selectedTimes = ['08:00','21:00'];
  renderCommonMeds();
  renderTimeOptions();
  showModal('addMedModal');
}

function renderCommonMeds() {
  document.getElementById('commonMedsList').innerHTML = COMMON_AEDS.map(a =>
    `<button class="common-med-tag" onclick="document.getElementById('medName').value='${a.name}'">${a.name}<br><small style="font-size:10px;opacity:0.8">${a.thai}</small></button>`
  ).join('');
}

function renderTimeOptions() {
  document.getElementById('timeOptions').innerHTML = TIME_PRESETS.map(p => {
    const sel = selectedTimes.includes(p.time);
    return `<div class="time-option ${sel?'selected':''}" onclick="toggleTime('${p.time}')">
      <i class="fas ${sel?'fa-check-circle':'fa-circle'}"></i>
      ${p.label} (${p.time})
    </div>`;
  }).join('');
}

function toggleTime(time) {
  if (selectedTimes.includes(time)) selectedTimes = selectedTimes.filter(t=>t!==time);
  else selectedTimes.push(time);
  selectedTimes.sort();
  renderTimeOptions();
}

function saveNewMedication() {
  const name = document.getElementById('medName').value.trim();
  const dosage = document.getElementById('medDosage').value.trim() || 'ตามแพทย์สั่ง';
  const pillCount = parseInt(document.getElementById('medPillCount').value) || 0;
  const notes = document.getElementById('medNotes').value.trim();
  if (!name) { showToast('กรุณากรอกชื่อยา'); return; }
  if (selectedTimes.length === 0) { showToast('กรุณาเลือกเวลากินยาอย่างน้อย 1 เวลา'); return; }
  const meds = getData('medications');
  meds.push({ id:genId(), name, dosage, frequency:selectedTimes.length, times:selectedTimes, pillCount, notes });
  setData('medications', meds);
  closeModal('addMedModal');
  renderHome();
  showToast('เพิ่มรายการยาแล้ว');
}

/* ===== MED DETAIL ===== */
function showMedDetail(medId) {
  const meds = getData('medications');
  const med = meds.find(m => m.id === medId);
  if (!med) return;

  const thaiName = getThaiName(med.name);
  document.getElementById('medDetailTitle').textContent = med.name;
  document.getElementById('deleteMedBtn').onclick = () => {
    if (confirm('ต้องการลบ ' + med.name + ' หรือไม่?')) {
      const ms = getData('medications').filter(m => m.id !== medId);
      setData('medications', ms);
      showTab('home');
      showToast('ลบรายการยาแล้ว');
    }
  };

  const allLogs = getData('medLogs').filter(l => l.medicationId === medId).sort((a,b) => b.date.localeCompare(a.date)).slice(0,14);
  const takenCount = allLogs.filter(l => l.status==='taken').length;
  const totalCount = allLogs.length;
  const adherencePct = totalCount>0 ? Math.round(takenCount/totalCount*100) : 0;

  document.getElementById('medDetailContent').innerHTML = `
    <div class="detail-card">
      <div class="info-grid">
        <div class="info-item"><div class="info-label">ชื่อยา</div><div class="info-value">${med.name}</div>${thaiName?`<div style="font-size:13px;color:var(--text2);margin-top:2px">${thaiName}</div>`:''}</div>
        <div class="info-item"><div class="info-label">ขนาดยา</div><div class="info-value">${med.dosage}</div></div>
      </div>
      <div class="info-grid" style="margin-top:12px">
        <div class="info-item"><div class="info-label">จำนวนครั้ง/วัน</div><div class="info-value">${med.frequency} ครั้ง</div></div>
        ${med.pillCount>0?`<div class="info-item"><div class="info-label">จำนวนเม็ดที่ได้รับ</div><div class="info-value">${med.pillCount} เม็ด</div></div>`:''}
      </div>
    </div>
    <div class="detail-card">
      <h4>ตารางเวลากินยา</h4>
      ${med.times.map(t => `<div class="time-row"><div class="time-dot"><i class="fas fa-clock"></i></div><div class="time-text">${t}</div></div>`).join('')}
    </div>
    <div class="detail-card">
      <h4>สถิติการกินยา (14 วันล่าสุด)</h4>
      <div class="stats-row">
        <div class="stat-item"><div class="stat-num" style="color:var(--success)">${takenCount}</div><div class="stat-label">กินแล้ว</div></div>
        <div class="stat-item"><div class="stat-num" style="color:var(--danger)">${totalCount-takenCount}</div><div class="stat-label">ขาด/รอ</div></div>
        <div class="stat-item"><div class="stat-num" style="color:var(--primary)">${adherencePct}%</div><div class="stat-label">Adherence</div></div>
      </div>
      <div class="adherence-bar"><div class="adherence-fill" style="width:${adherencePct}%"></div></div>
    </div>
    <div class="detail-card">
      <h4>ประวัติล่าสุด</h4>
      ${allLogs.length===0?'<p style="text-align:center;color:var(--text3);padding:20px">ยังไม่มีประวัติ</p>':''}
      ${allLogs.slice(0,7).map(l => {
        const c = l.status==='taken'?'var(--success)':l.status==='missed'?'var(--danger)':'var(--warning)';
        const s = l.status==='taken'?'กินแล้ว':l.status==='missed'?'ขาด':'รอ';
        return `<div class="log-row"><div class="log-dot" style="background:${c}"></div><div class="log-row-date">${l.date}</div><div class="log-row-time">${l.scheduledTime}</div><div class="log-row-status" style="color:${c}">${s}</div></div>`;
      }).join('')}
    </div>
    ${med.notes?`<div class="detail-card"><h4>หมายเหตุ</h4><p style="font-size:14px;color:var(--text2);line-height:1.6">${med.notes}</p></div>`:''}`;

  showTab('medDetail');
}

/* ===== LEARN ===== */
const LEARN_TOPICS = [
  { id:'what-is-seizure', icon:'fa-bolt', color:'var(--accent)', bg:'var(--accent-soft)', title:'อาการชักคืออะไร', sub:'ความรู้พื้นฐาน, ชนิดของอาการชัก, สาเหตุ' },
  { id:'why-aeds', icon:'fa-pills', color:'var(--primary)', bg:'#E0F4F4', title:'ทำไมต้องกินยากันชัก', sub:'เหตุผล, ประโยชน์, กลุ่มผู้ป่วยที่ต้องใช้ยา' },
  { id:'tbi-criteria', icon:'fa-shield-halved', color:'#6366F1', bg:'#EEF2FF', title:'เกณฑ์การให้ยาหลัง Head Injury', sub:'Criteria, งานวิจัย, แนวทางปฏิบัติ' },
  { id:'side-effects', icon:'fa-exclamation-triangle', color:'var(--warning)', bg:'var(--warning-light)', title:'ผลข้างเคียงยากันชัก', sub:'อาการที่ควรสังเกต, เมื่อไหร่ควรพบแพทย์' },
  { id:'missed-dose-guide', icon:'fa-circle-question', color:'#EC4899', bg:'#FDF2F8', title:'ถ้าลืมกินยากันชักควรทำอย่างไร', sub:'คำแนะนำเมื่อลืมกินยา, หลักปฏิบัติ' },
  { id:'seizure-first-aid', icon:'fa-heart-pulse', color:'var(--danger)', bg:'var(--danger-light)', title:'การปฐมพยาบาลเมื่อมีอาการชัก', sub:'สิ่งที่ควรทำ/ไม่ควรทำ สำหรับผู้ดูแล' },
  { id:'self-observation', icon:'fa-eye', color:'#0EA5E9', bg:'#F0F9FF', title:'การสังเกตอาการตนเอง', sub:'สัญญาณเตือนก่อนชัก, การบันทึกอาการ' },
  { id:'research-evidence', icon:'fa-file-lines', color:'#8B5CF6', bg:'#F5F3FF', title:'หลักฐานเชิงประจักษ์และงานวิจัย', sub:'Systematic reviews, Practice guidelines' },
];

function renderLearnTopics() {
  document.getElementById('learnTopicsList').innerHTML = LEARN_TOPICS.map(t =>
    `<div class="topic-card" onclick="showLearnDetail('${t.id}')">
      <div class="topic-icon" style="background:${t.bg};color:${t.color}"><i class="fas ${t.icon}"></i></div>
      <div class="topic-info"><div class="topic-title">${t.title}</div><div class="topic-sub">${t.sub}</div></div>
      <i class="fas fa-chevron-right" style="color:var(--text3)"></i>
    </div>`
  ).join('') + `<div class="disclaimer-card"><i class="fas fa-info-circle"></i><p>ข้อมูลในหน้านี้จัดทำเพื่อการให้ความรู้ ไม่ใช่การวินิจฉัยหรือรักษาโรค กรุณาปรึกษาแพทย์สำหรับข้อมูลเฉพาะบุคคล</p></div>`;
}

/* ===== LEARN DETAIL CONTENT ===== */
const LEARN_CONTENT = {
  'what-is-seizure': { title:'อาการชักคืออะไร', sections:[
    { title:'อาการชักคืออะไร?', body:'อาการชัก (Seizure) คือภาวะที่เกิดจากกระแสไฟฟ้าในสมองทำงานผิดปกติอย่างฉับพลัน ส่งผลให้เกิดอาการต่างๆ เช่น กล้ามเนื้อเกร็งกระตุก หมดสติ ตาค้าง หรือพฤติกรรมผิดปกติชั่วคราว' },
    { title:'ชนิดของอาการชัก', body:'1. Generalized seizures: อาการชักทั้งตัว รวมถึง Tonic-clonic (เกร็งกระตุก), Absence (เหม่อ), Myoclonic (กระตุกสั้นๆ)\n\n2. Focal seizures: อาการชักเฉพาะที่ อาจมีหรือไม่มีการเปลี่ยนแปลงระดับความรู้สึกตัว\n\n3. Unknown onset: อาการชักที่ไม่ทราบจุดเริ่มต้น', ref:'Fisher RS, et al. ILAE official report: a practical clinical definition of epilepsy. Epilepsia. 2014;55(4):475-482.' },
    { title:'โรคลมชัก (Epilepsy) คืออะไร?', body:'โรคลมชักคือภาวะที่มีอาการชักซ้ำตั้งแต่ 2 ครั้งขึ้นไป โดยไม่มีสาเหตุกระตุ้นเฉพาะเจาะจง (unprovoked seizures) หรือมีอาการชักครั้งเดียวแต่มีความเสี่ยงสูงที่จะเกิดซ้ำ', ref:'International League Against Epilepsy (ILAE) Classification, 2017.' },
  ]},
  'why-aeds': { title:'ทำไมต้องกินยากันชัก', sections:[
    { title:'เหตุผลที่ต้องกินยากันชัก', body:'ยากันชัก (Antiepileptic Drugs: AEDs) ใช้เพื่อ:\n\n1. รักษาโรคลมชัก (Epilepsy) ป้องกันอาการชักซ้ำ\n2. ป้องกันอาการชักเฉียบพลันหลังบาดเจ็บที่ศีรษะ (Head injury/TBI) ในผู้ที่มีความเสี่ยงสูง\n3. ป้องกันอาการชักหลังผ่าตัดสมอง' },
    { title:'ประโยชน์ของการกินยาสม่ำเสมอ', body:'- ลดความถี่ของอาการชัก\n- ป้องกันภาวะชักต่อเนื่อง (Status epilepticus) ซึ่งเป็นอันตรายถึงชีวิต\n- ช่วยให้ดำเนินชีวิตประจำวันได้ปกติ\n- ลดความเสี่ยงการบาดเจ็บจากอาการชัก\n- ป้องกันความเสียหายต่อสมองจากการชักซ้ำ', ref:'Kwan P, et al. Early identification of refractory epilepsy. N Engl J Med. 2000;342(5):314-319.' },
    { title:'กลุ่มผู้ป่วยที่ใช้ยากันชัก', body:'- ผู้ที่ได้รับการวินิจฉัยว่าเป็นโรคลมชัก\n- ผู้ป่วย TBI/ภาวะสมองบาดเจ็บที่มีความเสี่ยงสูง\n- ผู้ป่วยหลังผ่าตัดสมอง\n- ผู้ป่วยที่อยู่ในระยะฟื้นฟูหลังอุบัติเหตุทางสมอง' },
  ]},
  'tbi-criteria': { title:'เกณฑ์การให้ยาหลัง Head Injury', sections:[
    { title:'เกณฑ์ความเสี่ยงสูงในการเกิดชักหลัง TBI', body:'ผู้ป่วยที่มีปัจจัยเสี่ยงต่อไปนี้ ควรได้รับยากันชักเพื่อป้องกัน:\n\n- Intracranial hemorrhage (เลือดออกในสมอง)\n- Depressed skull fracture (กะโหลกยุบ)\n- Penetrating brain injury (บาดเจ็บแบบทะลุ)\n- Prolonged loss of consciousness > 24 ชั่วโมง\n- GCS < 10\n- อายุ > 65 ปี\n- ประวัติเป็นโรคลมชักมาก่อน', ref:'Temkin NR, et al. A randomized, double-blind study of phenytoin for the prevention of post-traumatic seizures. N Engl J Med. 1990;323(8):497-502.' },
    { title:'Early vs Late Post-traumatic Seizures', body:'Early seizures: เกิดภายใน 7 วันหลังบาดเจ็บ\n- ยากันชักมีประสิทธิภาพในการป้องกัน early seizures\n- ลดการเกิดชักได้อย่างมีนัยสำคัญทางสถิติ\n\nLate seizures: เกิดหลัง 7 วัน\n- ยากันชักไม่ได้ลดการเกิด late seizures อย่างมีนัยสำคัญ\n- แนะนำให้ใช้ยาป้องกันเป็นเวลา 7 วัน (ในกลุ่มเสี่ยงสูง)', ref:'Chang BS, Lowenstein DH. Practice parameter: antiepileptic drug prophylaxis in severe traumatic brain injury. Neurology. 2003;60(1):10-16. (AAN Practice Parameter)' },
    { title:'แนวทางจาก Cochrane Systematic Review', body:'"การให้ยากันชักหลัง traumatic brain injury ช่วยลดการเกิดอาการชักภายใน 7 วันแรกในผู้ที่มีความเสี่ยงสูง แต่ไม่ลดการชักในระยะยาว"\n\nLevetiracetam และ Phenytoin มีประสิทธิภาพเทียบเคียงกันในการป้องกัน early seizures หลัง TBI', ref:'Thompson K, et al. Pharmacological treatments for preventing epilepsy following traumatic head injury. Cochrane Database Syst Rev. 2015.\n\nInaba K, et al. A prospective multicenter comparison of levetiracetam versus phenytoin for early posttraumatic seizure prophylaxis. J Trauma Acute Care Surg. 2013;74(3):766-771.' },
  ]},
  'side-effects': { title:'ผลข้างเคียงยากันชัก', sections:[
    { title:'ผลข้างเคียงที่พบได้บ่อย', body:'- เวียนศีรษะ / มึนงง\n- ง่วงนอน / อ่อนเพลีย\n- คลื่นไส้ / อาเจียน\n- ผื่นผิวหนัง\n- น้ำหนักเพิ่ม/ลด\n- การมองเห็นเปลี่ยนแปลง (เห็นภาพซ้อน)' },
    { title:'ผลข้างเคียงเฉพาะยา', body:'Phenytoin (เฟนิโทอิน): เหงือกบวม (gingival hyperplasia), ผมขึ้นมาก, สิว\n\nValproate (วัลโปรเอต): น้ำหนักเพิ่ม, ผมร่วง, ตับอักเสบ (พบน้อย), ตับอ่อนอักเสบ\n\nCarbamazepine (คาร์บามาซีพีน): ผื่นผิวหนัง, เม็ดเลือดขาวต่ำ, ภาวะโซเดียมในเลือดต่ำ\n\nLevetiracetam (ลีเวไทราซีแทม): อารมณ์แปรปรวน, หงุดหงิด, นอนไม่หลับ', ref:'Perucca P, Gilliam FG. Adverse effects of antiepileptic drugs. Lancet Neurol. 2012;11(9):792-802.' },
    { title:'เมื่อไหร่ควรพบแพทย์ทันที', body:'- ผื่นรุนแรง / Stevens-Johnson Syndrome\n- ปากเจ็บ แผลในปาก ไข้ (อาจเป็นสัญญาณเม็ดเลือดขาวต่ำ)\n- ตาเหลือง ตัวเหลือง (อาจเป็นสัญญาณตับอักเสบ)\n- เลือดออกผิดปกติ\n- อาการชักเพิ่มขึ้นหรือเปลี่ยนแปลง\n- พฤติกรรมหรืออารมณ์เปลี่ยนแปลงมาก' },
  ]},
  'missed-dose-guide': { title:'ถ้าลืมกินยากันชักควรทำอย่างไร', sections:[
    { title:'ถ้านึกได้ไม่นานหลังเวลาที่ควรกินยา', body:'ให้กินยาทันทีที่นึกได้ ไม่ต้องรอจนถึงมื้อถัดไป' },
    { title:'ถ้านึกได้ใกล้เวลามื้อถัดไป', body:'ให้ข้ามมื้อที่ลืม และกินมื้อต่อไปตามปกติ ไม่ต้องกินชดเชย' },
    { title:'ห้ามกินยาเป็น 2 เท่า', body:'ไม่ว่ากรณีใดก็ตาม ห้ามกินยาเป็น 2 เท่าเพื่อชดเชยมื้อที่ลืม เพราะอาจทำให้เกิดพิษจากยา (Drug toxicity) ได้' },
    { title:'หากลืมบ่อยหรือมีอาการผิดปกติ', body:'ควรปรึกษาแพทย์หรือพยาบาลทันที เพราะการลืมกินยาบ่อยจะเพิ่มความเสี่ยงต่อการเกิดอาการชักซ้ำ' },
    { title:'หมายเหตุสำคัญ', body:'ยาบางชนิด เช่น Valproate (วัลโปรเอต), Phenytoin (เฟนิโทอิน), Carbamazepine (คาร์บามาซีพีน), Levetiracetam (ลีเวไทราซีแทม) อาจมีข้อแนะนำเฉพาะ แต่หลักใหญ่เหมือนกัน คือ:\n\n1. กินทันทีที่นึกได้\n2. ถ้าใกล้มื้อต่อไป ให้ข้าม\n3. ไม่กินซ้ำสองเท่า', ref:'Cramer JA, et al. Medication compliance and persistence: terminology and definitions. Value Health. 2008;11(1):44-47.' },
  ]},
  'seizure-first-aid': { title:'การปฐมพยาบาลเมื่อมีอาการชัก', sections:[
    { title:'สิ่งที่ควรทำ', body:'1. ตั้งสติ อย่าตกใจ จับเวลาอาการชัก\n2. จัดให้ผู้ป่วยนอนตะแคง (Recovery position) เพื่อป้องกันสำลัก\n3. หาหมอนหรือผ้านุ่มรองใต้ศีรษะ\n4. คลายเสื้อผ้าที่รัดคอ/อก\n5. เคลียร์สิ่งของแหลมคมออกจากรอบตัว\n6. อยู่เป็นเพื่อนจนกว่าอาการจะหยุด\n7. หลังชักหยุด ให้ปลอบโยนและอธิบายสิ่งที่เกิดขึ้น' },
    { title:'สิ่งที่ไม่ควรทำ', body:'1. ห้ามง้างปากหรือสอดนิ้ว/วัตถุเข้าปาก\n2. ห้ามกดแขนขาขณะชัก\n3. ห้ามให้น้ำ/อาหารขณะชัก\n4. ห้ามเคลื่อนย้ายผู้ป่วยยกเว้นตำแหน่งอันตราย' },
    { title:'เมื่อไหร่ควรโทรรถฉุกเฉิน 1669', body:'- อาการชักนานเกิน 5 นาที\n- ชักซ้ำโดยไม่รู้สึกตัวระหว่างชัก\n- ผู้ป่วยมีอาการบาดเจ็บ\n- ผู้ป่วยตั้งครรภ์\n- เป็นการชักครั้งแรก\n- หลังชักหยุดแล้วไม่ฟื้นคืนสติ', ref:'Epilepsy Foundation. Seizure First Aid. Updated 2023.' },
  ]},
  'self-observation': { title:'การสังเกตอาการตนเอง', sections:[
    { title:'สัญญาณเตือนก่อนชัก (Aura)', body:'ผู้ป่วยบางรายอาจมีอาการเตือนก่อนชัก:\n\n- รู้สึกแปลกๆ ในท้อง (Rising sensation)\n- กลิ่นหรือรสชาติแปลกๆ\n- Deja vu หรือ Jamais vu\n- ความกลัว/วิตกกังวลเฉียบพลัน\n- อาการชาที่แขนขา\n- การมองเห็นเปลี่ยนแปลง' },
    { title:'สิ่งที่ควรบันทึก', body:'- วันที่และเวลาที่เกิดอาการ\n- ระยะเวลาของอาการ\n- ลักษณะอาการ (เกร็ง, กระตุก, เหม่อ)\n- สิ่งที่ทำก่อนเกิดอาการ\n- ได้กินยาตรงเวลาหรือไม่\n- ปัจจัยกระตุ้น (นอนน้อย, เครียด, ดื่มแอลกอฮอล์)' },
    { title:'ปัจจัยกระตุ้นที่ควรหลีกเลี่ยง', body:'- การนอนไม่เพียงพอ\n- ความเครียด\n- การดื่มแอลกอฮอล์\n- การลืมกินยา\n- ไข้สูง\n- แสงกระพริบ (ในบางราย)\n- การใช้สารเสพติด', ref:'Haut SR, et al. Seizure occurrence: precipitants and prediction. Neurology. 2007;69(20):1905-1910.' },
  ]},
  'research-evidence': { title:'หลักฐานเชิงประจักษ์และงานวิจัย', sections:[
    { title:'การใช้ AEDs เพื่อป้องกันชักหลัง TBI', body:'การศึกษา RCT โดย Temkin et al. (1990) พบว่า Phenytoin (เฟนิโทอิน) ลดอุบัติการณ์ early post-traumatic seizures (ภายใน 7 วัน) ได้อย่างมีนัยสำคัญในผู้ป่วย severe TBI เมื่อเทียบกับ placebo\n\nอย่างไรก็ตาม ไม่พบประโยชน์ในการป้องกัน late seizures (หลัง 7 วัน)', ref:'Temkin NR, et al. A randomized, double-blind study of phenytoin for the prevention of post-traumatic seizures. N Engl J Med. 1990;323(8):497-502.' },
    { title:'Levetiracetam vs Phenytoin', body:'การศึกษา prospective multicenter โดย Inaba et al. (2013) เปรียบเทียบ Levetiracetam (ลีเวไทราซีแทม) กับ Phenytoin (เฟนิโทอิน) สำหรับ early post-traumatic seizure prophylaxis พบว่าทั้งสองยามีประสิทธิภาพเทียบเคียงกัน\n\nLevetiracetam มีข้อดีคือ ไม่ต้องเจาะระดับยาในเลือด, มี drug interaction น้อยกว่า', ref:'Inaba K, et al. J Trauma Acute Care Surg. 2013;74(3):766-771.' },
    { title:'AAN Practice Parameter', body:'American Academy of Neurology (AAN) แนะนำ:\n\n- ใช้ AEDs ป้องกันใน severe TBI เพื่อลด early seizures\n- ระยะเวลาแนะนำ: 7 วัน\n- ไม่แนะนำให้ใช้ยาต่อเนื่องเพื่อป้องกัน late seizures ยกเว้นมีข้อบ่งชี้เพิ่มเติม', ref:'Chang BS, Lowenstein DH. Neurology. 2003;60(1):10-16.' },
    { title:'Cochrane Systematic Review', body:'Thompson et al. (2015) ทำ systematic review พบว่า:\n\n- AEDs มีประสิทธิภาพในการลด early seizures หลัง TBI (RR 0.34, 95% CI 0.21-0.54)\n- ไม่มีหลักฐานเพียงพอว่า AEDs ลด late seizures หรือ mortality\n- ไม่มีความแตกต่างอย่างมีนัยสำคัญระหว่าง Levetiracetam (ลีเวไทราซีแทม) และ Phenytoin (เฟนิโทอิน)', ref:'Thompson K, et al. Cochrane Database Syst Rev. 2015.' },
    { title:'ความสำคัญของ Medication Adherence', body:'การศึกษาหลายชิ้นยืนยันว่า การกินยากันชักไม่สม่ำเสมอ (non-adherence) เป็นสาเหตุหลักของ breakthrough seizures:\n\n- ผู้ป่วยที่ขาดยามีโอกาสเกิดชักซ้ำสูงกว่า 3-5 เท่า\n- Non-adherence พบได้ถึง 30-50% ของผู้ป่วยโรคลมชัก\n- การใช้ reminder systems และ medication tracking ช่วยเพิ่ม adherence ได้', ref:'Faught E, et al. Nonadherence to antiepileptic drugs and increased mortality. Neurology. 2008;71(20):1572-1578.\n\nCramer JA, et al. Value Health. 2008;11(1):44-47.' },
  ]},
};

function showLearnDetail(id) {
  const content = LEARN_CONTENT[id];
  if (!content) return;
  document.getElementById('learnDetailTitle').textContent = content.title;
  document.getElementById('learnDetailContent').innerHTML = content.sections.map(s =>
    `<div class="section-card">
      <h3>${s.title}</h3>
      <div class="body">${s.body}</div>
      ${s.ref ? `<div class="ref-box"><i class="fas fa-file-alt"></i><p>${s.ref}</p></div>` : ''}
    </div>`
  ).join('');
  showTab('learnDetail');
}

/* ===== ASSESS ===== */
function renderAssess() {
  renderSeizureLogs();
  renderSideEffectLogs();
}

function renderSeizureLogs() {
  const logs = getData('seizureLogs').sort((a,b) => b.date.localeCompare(a.date)).slice(0,5);
  const container = document.getElementById('seizureLogsList');
  if (logs.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>ยังไม่มีบันทึกอาการชัก</p></div>';
    return;
  }
  container.innerHTML = logs.map(l => {
    const sev = SEVERITY_DESCRIPTIONS[l.severity];
    return `<div class="log-card">
      <div class="log-header">
        <div class="log-date-row"><i class="fas fa-calendar"></i><span>${l.date}</span><span style="color:var(--text2)">${l.time}</span></div>
        <span class="severity-badge" style="background:${sev.color}20;color:${sev.color}">${sev.label}</span>
      </div>
      ${l.duration ? `<div class="log-detail">ระยะเวลา: ${l.duration}</div>` : ''}
      ${l.symptoms.length>0 ? `<div class="tags-row">${l.symptoms.map(s=>`<span class="tag">${s}</span>`).join('')}</div>` : ''}
      ${l.notes ? `<div class="log-notes">${l.notes}</div>` : ''}
    </div>`;
  }).join('');
}

function renderSideEffectLogs() {
  const logs = getData('sideEffectLogs').sort((a,b) => b.date.localeCompare(a.date)).slice(0,5);
  const container = document.getElementById('sideEffectLogsList');
  if (logs.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>ยังไม่มีบันทึกผลข้างเคียง</p></div>';
    return;
  }
  container.innerHTML = logs.map(l => {
    const sev = SEVERITY_DESCRIPTIONS[l.severity];
    return `<div class="log-card">
      <div class="log-header">
        <div class="log-date-row"><i class="fas fa-calendar"></i><span>${l.date}</span></div>
        <span class="severity-badge" style="background:${sev.color}20;color:${sev.color}">${sev.label}</span>
      </div>
      <div class="tags-row">${l.effects.map(e=>`<span class="tag">${e}</span>`).join('')}</div>
      ${l.notes ? `<div class="log-notes">${l.notes}</div>` : ''}
    </div>`;
  }).join('');
}

/* ===== SEIZURE MODAL ===== */
function initSeizureModal() {
  const now = new Date();
  document.getElementById('seizureDate').textContent = getDateStr(now);
  document.getElementById('seizureTime').textContent = getTimeStr();
  document.getElementById('seizureDuration').value = '';
  document.getElementById('seizureNotes').value = '';
  selectedSeizureSeverity = 3;
  selectedSeizureSymptoms = [];
  renderSeizureSeverityPicker();
  renderSeizureSymptomChips();
}

function saveSeizureLog() {
  const log = {
    id: genId(),
    date: document.getElementById('seizureDate').textContent,
    time: document.getElementById('seizureTime').textContent,
    duration: document.getElementById('seizureDuration').value.trim() || 'ไม่ทราบ',
    severity: selectedSeizureSeverity,
    symptoms: [...selectedSeizureSymptoms],
    notes: document.getElementById('seizureNotes').value.trim(),
  };
  const logs = getData('seizureLogs');
  logs.push(log);
  setData('seizureLogs', logs);
  closeModal('seizureModal');
  renderAssess();
  showToast('บันทึกอาการชักแล้ว');
}

/* ===== SIDE EFFECT MODAL ===== */
function initSideEffectModal() {
  document.getElementById('sideEffectDate').textContent = getDateStr(new Date());
  document.getElementById('sideEffectNotes').value = '';
  selectedSideEffectSeverity = 2;
  selectedSideEffects = [];
  const meds = getData('medications');
  selectedSideEffectMedId = meds.length > 0 ? meds[0].id : '';
  renderSideEffectMeds();
  renderSideEffectSeverityPicker();
  renderSideEffectSymptomChips();
}

function renderSideEffectMeds() {
  const meds = getData('medications');
  document.getElementById('sideEffectMeds').innerHTML = meds.map(m => {
    const sel = selectedSideEffectMedId === m.id;
    return `<button class="chip ${sel?'selected':''}" onclick="selectedSideEffectMedId='${m.id}';renderSideEffectMeds()">${m.name}</button>`;
  }).join('') || '<p style="color:var(--text3);font-size:13px">ยังไม่มีรายการยา</p>';
}

function saveSideEffectLog() {
  if (selectedSideEffects.length === 0) { showToast('กรุณาเลือกอาการข้างเคียงอย่างน้อย 1 อาการ'); return; }
  const log = {
    id: genId(),
    date: document.getElementById('sideEffectDate').textContent,
    medicationId: selectedSideEffectMedId,
    effects: [...selectedSideEffects],
    severity: selectedSideEffectSeverity,
    notes: document.getElementById('sideEffectNotes').value.trim(),
  };
  const logs = getData('sideEffectLogs');
  logs.push(log);
  setData('sideEffectLogs', logs);
  closeModal('sideEffectModal');
  renderAssess();
  showToast('บันทึกผลข้างเคียงแล้ว');
}

/* ===== SEVERITY PICKER ===== */
function renderSeverityPicker(containerId, descId, selected, onSelect) {
  const container = document.getElementById(containerId);
  container.innerHTML = [1,2,3,4,5].map(lv => {
    const sel = selected === lv;
    return `<div class="sev-item lv${lv} ${sel?'selected':''}" onclick="(${onSelect.toString()})(${lv})">
      <span class="sev-num">${lv}</span>
    </div>`;
  }).join('');

  const descEl = document.getElementById(descId);
  const sev = SEVERITY_DESCRIPTIONS[selected];
  descEl.className = 'severity-desc active';
  descEl.innerHTML = `<strong style="color:${sev.color}">${sev.label}</strong><br>${sev.desc}`;
}

/* ===== CHIPS ===== */
function renderChips(containerId, items, selected, onToggle, selectedClass) {
  const cls = selectedClass || 'selected';
  document.getElementById(containerId).innerHTML = items.map(item => {
    const sel = selected.includes(item);
    return `<button class="chip ${sel?cls:''}" onclick="(${onToggle.toString()})('${item}')">${item}</button>`;
  }).join('');
}

function toggleArr(arr, item) {
  const idx = arr.indexOf(item);
  if (idx > -1) arr.splice(idx, 1); else arr.push(item);
}

/* ===== PROFILE ===== */
function renderProfile() {
  const profile = getObj('profile') || { name:'', age:'', diagnosis:'', emergencyContact:'', emergencyPhone:'', doctorName:'', doctorPhone:'', nextAppointment:'' };
  const phone = profile.emergencyPhone || '1669';
  document.getElementById('emergencyNumber').textContent = phone;
  document.getElementById('emergencyCallBtn').href = `tel:${phone}`;

  const editIcon = editingProfile ? 'fa-check' : 'fa-pen';
  document.getElementById('editProfileBtn').innerHTML = `<i class="fas ${editIcon}"></i>`;

  const fields = [
    { section:'ข้อมูลผู้ป่วย', icon:'fa-user', color:'var(--primary)', rows:[
      { key:'name', label:'ชื่อ-สกุล', placeholder:'ระบุชื่อ-สกุล' },
      { key:'age', label:'อายุ', placeholder:'ระบุอายุ', type:'number' },
      { key:'diagnosis', label:'การวินิจฉัย', placeholder:'เช่น Epilepsy, Post-TBI' },
    ]},
    { section:'ผู้ติดต่อฉุกเฉิน', icon:'fa-users', color:'var(--accent)', rows:[
      { key:'emergencyContact', label:'ชื่อผู้ติดต่อ', placeholder:'ชื่อญาติ/ผู้ดูแล' },
      { key:'emergencyPhone', label:'เบอร์โทร', placeholder:'เบอร์โทรฉุกเฉิน', type:'tel' },
    ]},
    { section:'แพทย์ผู้ดูแล', icon:'fa-user-md', color:'var(--primary)', rows:[
      { key:'doctorName', label:'ชื่อแพทย์', placeholder:'ชื่อแพทย์ผู้ดูแล' },
      { key:'doctorPhone', label:'เบอร์โทร', placeholder:'เบอร์โทรคลินิก/โรงพยาบาล', type:'tel' },
      { key:'nextAppointment', label:'นัดครั้งถัดไป', placeholder:'เช่น 15 มี.ค. 2569' },
    ]},
  ];

  document.getElementById('profileContent').innerHTML = fields.map(section =>
    `<div class="profile-section">
      <div class="profile-section-header"><i class="fas ${section.icon}" style="color:${section.color}"></i><span>${section.section}</span></div>
      <div class="profile-card">
        ${section.rows.map(r => `<div class="profile-row">
          <span class="profile-label">${r.label}</span>
          ${editingProfile
            ? `<input class="profile-input" id="pf_${r.key}" value="${profile[r.key]||''}" placeholder="${r.placeholder}" type="${r.type||'text'}">`
            : `<span class="profile-value ${!profile[r.key]?'placeholder':''}">${profile[r.key] || r.placeholder}</span>`
          }
        </div>`).join('')}
      </div>
    </div>`
  ).join('');
}

function toggleEditProfile() {
  if (editingProfile) {
    const profile = {};
    ['name','age','diagnosis','emergencyContact','emergencyPhone','doctorName','doctorPhone','nextAppointment'].forEach(k => {
      const el = document.getElementById('pf_' + k);
      profile[k] = el ? el.value.trim() : '';
    });
    setObj('profile', profile);
    editingProfile = false;
    showToast('บันทึกข้อมูลแล้ว');
  } else {
    editingProfile = true;
  }
  renderProfile();
}

/* ===== MISSED DOSE ===== */
function renderMissedDose() {
  missedDoseStep = 'frequency';
  renderMissedDoseContent();
}

function renderMissedDoseContent() {
  const container = document.getElementById('missedDoseContent');
  let advisorHtml = '';

  if (missedDoseStep === 'frequency') {
    advisorHtml = `<p class="question-text">คุณกินยาวันละกี่ครั้ง?</p>
      <div class="options-grid">${[1,2,3,4].map(f => `<button class="option-btn" onclick="missedDoseFreq=${f};missedDoseStep='hours';renderMissedDoseContent()"><span class="option-num">${f}</span><span class="option-label">ครั้ง/วัน</span></button>`).join('')}</div>`;
  } else if (missedDoseStep === 'hours') {
    advisorHtml = `<p class="question-text">เลยเวลากินยามาแล้วกี่ชั่วโมง?</p>
      <div class="options-grid">${[1,2,3,4,5,6,8,10].map(h => `<button class="option-btn" onclick="calcMissedDose(${h})"><span class="option-num">${h}</span><span class="option-label">ชม.</span></button>`).join('')}</div>`;
  } else {
    const interval = 24 / missedDoseFreq;
    const half = interval / 2;
    const takeNow = missedDoseStep === 'take-now';
    advisorHtml = takeNow
      ? `<div class="result-box" style="background:var(--success-light)"><i class="fas fa-check-circle" style="color:var(--success)"></i><h3 style="color:var(--success)">ควรกินยาเลยตอนนี้</h3><p>ยังอยู่ในช่วงเวลาที่ปลอดภัยสำหรับการกินยามื้อที่ลืม</p></div>`
      : `<div class="result-box" style="background:var(--warning-light)"><i class="fas fa-clock" style="color:var(--warning)"></i><h3 style="color:var(--warning)">ควรรอกินยามื้อถัดไป</h3><p>ใกล้ถึงเวลามื้อถัดไปแล้ว ให้ข้ามมื้อที่ลืมและกินมื้อถัดไปตามปกติ</p></div>`;
    advisorHtml += `<button class="reset-btn" onclick="missedDoseStep='frequency';renderMissedDoseContent()"><i class="fas fa-redo"></i> คำนวณใหม่</button>`;
  }

  container.innerHTML = `
    <div class="advisor-card">
      <div class="advisor-header"><i class="fas fa-lightbulb"></i><span>ระบบช่วยแนะนำ</span></div>
      ${advisorHtml}
    </div>
    <h3 style="font-size:17px;font-weight:600;margin-bottom:14px">หลักปฏิบัติเมื่อลืมกินยากันชัก</h3>
    <div class="guide-item">
      <div class="guide-icon" style="background:var(--success-light);color:var(--success)"><i class="fas fa-check"></i></div>
      <div class="guide-content"><strong>นึกได้ไม่นานหลังเวลาที่ควรกินยา</strong><p>ให้กินยาทันที</p></div>
    </div>
    <div class="guide-item">
      <div class="guide-icon" style="background:var(--warning-light);color:var(--warning)"><i class="fas fa-clock"></i></div>
      <div class="guide-content"><strong>นึกได้ใกล้เวลามื้อถัดไป</strong><p>ให้ข้ามมื้อที่ลืม และกินมื้อต่อไปตามปกติ</p></div>
    </div>
    <div class="guide-item">
      <div class="guide-icon" style="background:var(--danger-light);color:var(--danger)"><i class="fas fa-times"></i></div>
      <div class="guide-content"><strong>ห้ามกินยาเป็น 2 เท่า</strong><p>ไม่ว่ากรณีใด ห้ามกินยาเป็น 2 เท่าเพื่อชดเชยมื้อที่ลืม</p></div>
    </div>
    <div class="guide-item">
      <div class="guide-icon" style="background:#EEF2FF;color:#6366F1"><i class="fas fa-stethoscope"></i></div>
      <div class="guide-content"><strong>หากลืมบ่อยหรือมีอาการผิดปกติ</strong><p>ควรปรึกษาแพทย์หรือพยาบาลทันที</p></div>
    </div>
    <div class="note-box">
      <i class="fas fa-info-circle"></i>
      <p>หมายเหตุ: ยาบางชนิด เช่น Valproate (วัลโปรเอต), Phenytoin (เฟนิโทอิน), Carbamazepine (คาร์บามาซีพีน), Levetiracetam (ลีเวไทราซีแทม) อาจมีข้อแนะนำเฉพาะ แต่หลักใหญ่เหมือนกัน คือ กินทันทีที่นึกได้ ถ้าใกล้มื้อต่อไปให้ข้าม และไม่กินซ้ำสองเท่า</p>
    </div>`;
}

function calcMissedDose(hours) {
  const interval = 24 / missedDoseFreq;
  const half = interval / 2;
  missedDoseStep = hours <= half ? 'take-now' : 'skip-wait';
  renderMissedDoseContent();
}

/* ===== MODALS ===== */
function showModal(id) {
  document.getElementById(id).classList.add('active');
  if (id === 'seizureModal') initSeizureModal();
  if (id === 'sideEffectModal') initSideEffectModal();
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('seizguard_currentUser');
  if (saved) {
    const users = JSON.parse(localStorage.getItem('seizguard_users') || '{}');
    if (users[saved]) {
      currentUser = saved;
      enterApp();
      return;
    }
  }
  document.getElementById('loginScreen').classList.add('active');
});

document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
});
