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
  { name: 'เกร็งทั้งตัว', weight: 2 },
  { name: 'กระตุกแขนขา', weight: 2 },
  { name: 'เหม่อนิ่ง', weight: 1 },
  { name: 'ตาค้าง/กลอกตา', weight: 1 },
  { name: 'หมดสติ', weight: 3 },
  { name: 'กัดลิ้น', weight: 3 },
  { name: 'อาเจียน', weight: 2 },
  { name: 'ปัสสาวะราด', weight: 2 },
  { name: 'สับสนหลังชัก', weight: 2 },
  { name: 'ปวดศีรษะ', weight: 1 },
  { name: 'อ่อนแรงแขน/ขา', weight: 2 },
  { name: 'พูดไม่ได้ชั่วคราว', weight: 2 },
  { name: 'หยุดหายใจ/หน้าเขียว', weight: 5 }
];

// อาการข้างเคียงทั่วไปของยากันชัก (ใช้เมื่อยังไม่ได้เลือกยา)
const SIDE_EFFECTS_LIST = [
  { name: 'เวียนศีรษะ', weight: 1 },
  { name: 'มึนงง', weight: 1 },
  { name: 'ง่วงนอน/อ่อนเพลีย', weight: 1 },
  { name: 'คลื่นไส้', weight: 2 },
  { name: 'อาเจียน', weight: 3 },
  { name: 'ปวดศีรษะ', weight: 1 },
  { name: 'ตาพร่า/เห็นภาพซ้อน', weight: 2 },
  { name: 'เดินเซ/ทรงตัวไม่ดี', weight: 2 },
  { name: 'ผื่นผิวหนัง', weight: 4 },
  { name: 'ผื่นรุนแรง/ปากพอง (SJS)', weight: 5 },
  { name: 'ตัวเหลือง/ตาเหลือง', weight: 5 },
  { name: 'หงุดหงิด/อารมณ์แปรปรวน', weight: 2 },
  { name: 'นอนไม่หลับ', weight: 1 },
  { name: 'เบื่ออาหาร', weight: 1 },
  { name: 'น้ำหนักเพิ่ม', weight: 1 },
  { name: 'ผมร่วง', weight: 1 },
  { name: 'มือสั่น', weight: 2 },
  { name: 'ความจำ/สมาธิลดลง', weight: 2 }
];

// อาการข้างเคียงเฉพาะของยาแต่ละตัว
const AED_SIDE_EFFECTS = {
  'Phenytoin': [
    { name: 'เวียนศีรษะ', weight: 1, freq: 'บ่อย' },
    { name: 'ง่วงนอน/อ่อนเพลีย', weight: 1, freq: 'บ่อย' },
    { name: 'ตาพร่า/เห็นภาพซ้อน', weight: 2, freq: 'บ่อย' },
    { name: 'เดินเซ/ทรงตัวไม่ดี (Ataxia)', weight: 2, freq: 'บ่อย' },
    { name: 'เหงือกบวม (Gingival Hyperplasia)', weight: 2, freq: 'บ่อย' },
    { name: 'ขนดก/ผมขึ้นมาก (Hirsutism)', weight: 1, freq: 'พบได้' },
    { name: 'สิว/ผิวหยาบ', weight: 1, freq: 'พบได้' },
    { name: 'คลื่นไส้/อาเจียน', weight: 2, freq: 'พบได้' },
    { name: 'ผื่นผิวหนัง', weight: 4, freq: 'พบได้' },
    { name: 'ผื่นรุนแรง/ปากพอง (SJS/TEN)', weight: 5, freq: 'หายาก แต่อันตราย' },
    { name: 'ตัวเหลือง/ตาเหลือง (ตับอักเสบ)', weight: 5, freq: 'หายาก' },
    { name: 'ความจำ/สมาธิลดลง', weight: 2, freq: 'พบได้' },
  ],
  'Carbamazepine': [
    { name: 'เวียนศีรษะ', weight: 1, freq: 'บ่อย' },
    { name: 'ง่วงนอน/อ่อนเพลีย', weight: 1, freq: 'บ่อย' },
    { name: 'ตาพร่า/เห็นภาพซ้อน', weight: 2, freq: 'บ่อย' },
    { name: 'เดินเซ/ทรงตัวไม่ดี (Ataxia)', weight: 2, freq: 'บ่อย' },
    { name: 'คลื่นไส้/อาเจียน', weight: 2, freq: 'บ่อย' },
    { name: 'โซเดียมในเลือดต่ำ (Hyponatremia)', weight: 3, freq: 'พบได้' },
    { name: 'ผื่นผิวหนัง', weight: 4, freq: 'พบได้' },
    { name: 'ผื่นรุนแรง/ปากพอง (SJS/TEN)', weight: 5, freq: 'หายาก แต่อันตราย' },
    { name: 'เม็ดเลือดขาวต่ำ (Leukopenia)', weight: 4, freq: 'พบได้' },
    { name: 'ตัวเหลือง/ตาเหลือง (ตับอักเสบ)', weight: 5, freq: 'หายาก' },
    { name: 'ความจำ/สมาธิลดลง', weight: 2, freq: 'พบได้' },
  ],
  'Valproate (Depakine)': [
    { name: 'คลื่นไส้/อาเจียน', weight: 2, freq: 'บ่อย' },
    { name: 'น้ำหนักเพิ่ม', weight: 1, freq: 'บ่อย' },
    { name: 'ผมร่วง', weight: 1, freq: 'บ่อย' },
    { name: 'มือสั่น (Tremor)', weight: 2, freq: 'บ่อย' },
    { name: 'ง่วงนอน/อ่อนเพลีย', weight: 1, freq: 'บ่อย' },
    { name: 'เวียนศีรษะ', weight: 1, freq: 'พบได้' },
    { name: 'ตับอักเสบ (Hepatotoxicity)', weight: 5, freq: 'หายาก แต่อันตราย' },
    { name: 'ตับอ่อนอักเสบ (Pancreatitis)', weight: 5, freq: 'หายาก แต่อันตราย' },
    { name: 'ตัวเหลือง/ตาเหลือง', weight: 5, freq: 'หายาก' },
    { name: 'เกล็ดเลือดต่ำ (Thrombocytopenia)', weight: 4, freq: 'พบได้' },
    { name: 'ความจำ/สมาธิลดลง', weight: 2, freq: 'พบได้' },
  ],
  'Levetiracetam (Keppra)': [
    { name: 'หงุดหงิด/อารมณ์แปรปรวน', weight: 2, freq: 'บ่อย' },
    { name: 'ง่วงนอน/อ่อนเพลีย', weight: 1, freq: 'บ่อย' },
    { name: 'นอนไม่หลับ', weight: 1, freq: 'บ่อย' },
    { name: 'เวียนศีรษะ', weight: 1, freq: 'พบได้' },
    { name: 'ปวดศีรษะ', weight: 1, freq: 'พบได้' },
    { name: 'คลื่นไส้', weight: 2, freq: 'พบได้' },
    { name: 'ซึมเศร้า/วิตกกังวล', weight: 3, freq: 'พบได้' },
    { name: 'ความจำ/สมาธิลดลง', weight: 2, freq: 'พบได้' },
    { name: 'ก้าวร้าว/พฤติกรรมเปลี่ยน', weight: 3, freq: 'พบได้ โดยเฉพาะในเด็ก' },
  ],
  'Lamotrigine': [
    { name: 'เวียนศีรษะ', weight: 1, freq: 'บ่อย' },
    { name: 'ปวดศีรษะ', weight: 1, freq: 'บ่อย' },
    { name: 'ตาพร่า/เห็นภาพซ้อน', weight: 2, freq: 'บ่อย' },
    { name: 'คลื่นไส้', weight: 2, freq: 'บ่อย' },
    { name: 'นอนไม่หลับ', weight: 1, freq: 'พบได้' },
    { name: 'ผื่นผิวหนัง', weight: 4, freq: 'พบได้ (พบบ่อยในเด็ก)' },
    { name: 'ผื่นรุนแรง/ปากพอง (SJS/TEN)', weight: 5, freq: 'หายาก แต่อันตราย' },
    { name: 'ง่วงนอน/อ่อนเพลีย', weight: 1, freq: 'พบได้' },
    { name: 'เดินเซ/ทรงตัวไม่ดี', weight: 2, freq: 'พบได้' },
  ],
  'Topiramate': [
    { name: 'ความจำ/สมาธิลดลง', weight: 2, freq: 'บ่อย' },
    { name: 'เบื่ออาหาร/น้ำหนักลด', weight: 1, freq: 'บ่อย' },
    { name: 'เวียนศีรษะ', weight: 1, freq: 'บ่อย' },
    { name: 'ง่วงนอน/อ่อนเพลีย', weight: 1, freq: 'บ่อย' },
    { name: 'ปวดศีรษะ', weight: 1, freq: 'พบได้' },
    { name: 'นิ่วในไต (Kidney Stones)', weight: 3, freq: 'พบได้' },
    { name: 'ตาพร่า/เห็นภาพซ้อน', weight: 2, freq: 'พบได้' },
    { name: 'ชาปลายมือปลายเท้า (Paresthesia)', weight: 2, freq: 'พบได้' },
    { name: 'กรดในเลือดสูง (Metabolic Acidosis)', weight: 4, freq: 'พบได้' },
  ],
  'Oxcarbazepine': [
    { name: 'เวียนศีรษะ', weight: 1, freq: 'บ่อย' },
    { name: 'ง่วงนอน/อ่อนเพลีย', weight: 1, freq: 'บ่อย' },
    { name: 'ตาพร่า/เห็นภาพซ้อน', weight: 2, freq: 'บ่อย' },
    { name: 'เดินเซ/ทรงตัวไม่ดี', weight: 2, freq: 'บ่อย' },
    { name: 'คลื่นไส้/อาเจียน', weight: 2, freq: 'บ่อย' },
    { name: 'โซเดียมในเลือดต่ำ (Hyponatremia)', weight: 3, freq: 'พบได้บ่อยกว่า Carbamazepine' },
    { name: 'ผื่นผิวหนัง', weight: 4, freq: 'พบได้' },
    { name: 'ผื่นรุนแรง/ปากพอง (SJS/TEN)', weight: 5, freq: 'หายาก แต่อันตราย' },
    { name: 'ปวดศีรษะ', weight: 1, freq: 'พบได้' },
  ],
  'Gabapentin': [
    { name: 'ง่วงนอน/อ่อนเพลีย', weight: 1, freq: 'บ่อย' },
    { name: 'เวียนศีรษะ', weight: 1, freq: 'บ่อย' },
    { name: 'เดินเซ/ทรงตัวไม่ดี (Ataxia)', weight: 2, freq: 'บ่อย' },
    { name: 'น้ำหนักเพิ่ม', weight: 1, freq: 'บ่อย' },
    { name: 'ตาพร่า/เห็นภาพซ้อน', weight: 2, freq: 'พบได้' },
    { name: 'คลื่นไส้/อาเจียน', weight: 2, freq: 'พบได้' },
    { name: 'บวมน้ำ (Peripheral Edema)', weight: 2, freq: 'พบได้' },
    { name: 'ความจำ/สมาธิลดลง', weight: 2, freq: 'พบได้' },
  ],
  'Phenobarbital': [
    { name: 'ง่วงนอน/อ่อนเพลีย', weight: 1, freq: 'บ่อยมาก' },
    { name: 'เวียนศีรษะ', weight: 1, freq: 'บ่อย' },
    { name: 'เดินเซ/ทรงตัวไม่ดี', weight: 2, freq: 'บ่อย' },
    { name: 'ความจำ/สมาธิลดลง', weight: 2, freq: 'บ่อย' },
    { name: 'ซึมเศร้า', weight: 3, freq: 'พบได้' },
    { name: 'หงุดหงิด/อารมณ์แปรปรวน', weight: 2, freq: 'พบได้ (โดยเฉพาะในเด็ก)' },
    { name: 'ผื่นผิวหนัง', weight: 4, freq: 'พบได้' },
    { name: 'ผื่นรุนแรง/ปากพอง (SJS/TEN)', weight: 5, freq: 'หายาก แต่อันตราย' },
    { name: 'ตับอักเสบ', weight: 5, freq: 'หายาก' },
    { name: 'การพึ่งพายา (Dependence)', weight: 3, freq: 'พบได้เมื่อใช้นาน' },
  ],
};



const SEVERITY_DESCRIPTIONS = {
  1: {
    label: 'เล็กน้อยมาก',
    color: 'var(--success)',
    desc: 'อาการเพียงเล็กน้อย ไม่กระทบกิจวัตรประจำวัน เช่น รู้สึกชาเล็กน้อยชั่วคราว เหม่อนิ่งไม่กี่วินาที หรือผลข้างเคียงยาที่แทบไม่รู้สึก',
    ref: 'อ้างอิง: CTCAE v5.0 Grade 1; ILAE Seizure Severity Scale'
  },
  2: {
    label: 'เล็กน้อย',
    color: 'var(--success)',
    desc: 'อาการเล็กน้อย รบกวนเล็กน้อยแต่ยังทำกิจกรรมได้ตามปกติ เช่น กระตุกเฉพาะที่สั้นๆ มึนงงเล็กน้อย หรือรู้สึกง่วงเป็นบางเวลา',
    ref: 'อ้างอิง: CTCAE v5.0 Grade 1; Liverpool Seizure Severity Scale'
  },
  3: {
    label: 'ปานกลาง',
    color: 'var(--warning)',
    desc: 'อาการปานกลาง กระทบการใช้ชีวิตบ้าง ต้องหยุดพักกิจกรรม เช่น อาการชักที่มีเกร็ง/กระตุกชัดเจนแต่ไม่นาน คลื่นไส้ต้องนอนพัก หรือเวียนศีรษะจนเดินไม่ถนัด',
    ref: 'อ้างอิง: CTCAE v5.0 Grade 2; Chalfont Seizure Severity Scale'
  },
  4: {
    label: 'รุนแรง',
    color: 'var(--danger)',
    desc: 'อาการรุนแรง กระทบการใช้ชีวิตมาก ต้องการความช่วยเหลือ เช่น ชักนานกว่า 2-3 นาที สับสนหลังชักนาน หมดสติ ผลข้างเคียงรุนแรง (ผื่นลามทั้งตัว ตาเหลือง) ต้องไปพบแพทย์',
    ref: 'อ้างอิง: CTCAE v5.0 Grade 3; ILAE Definition of Status Epilepticus'
  },
  5: {
    label: 'รุนแรงมาก / ฉุกเฉิน',
    color: 'var(--danger)',
    desc: 'อาการรุนแรงมาก เป็นอันตรายต่อชีวิต ต้องเรียกรถฉุกเฉินทันที เช่น ชักนานเกิน 5 นาที (Status epilepticus) ชักซ้ำไม่หยุด หยุดหายใจ มีอาการ Stevens-Johnson Syndrome',
    ref: 'อ้างอิง: CTCAE v5.0 Grade 4; ILAE Guidelines for Emergency Management'
  }
};

// คำอธิบายระดับความรุนแรงสำหรับอาการข้างเคียงยา
const SIDE_EFFECT_SEVERITY_DESCRIPTIONS = {
  1: {
    label: 'เล็กน้อย',
    color: 'var(--success)',
    desc: 'อาการข้างเคียงเล็กน้อย ไม่กระทบกิจวัตรประจำวัน เช่น ง่วงนอนเล็กน้อย เวียนศีรษะชั่วคราว หรือเบื่ออาหารเล็กน้อย สังเกตอาการต่อไป แจ้งแพทย์ในนัดถัดไป',
    ref: 'อ้างอิง: CTCAE v5.0 Grade 1; Perucca P, Gilliam FG. Lancet Neurol. 2012'
  },
  2: {
    label: 'ปานกลาง',
    color: 'var(--warning)',
    desc: 'อาการรบกวนการใช้ชีวิต เช่น เวียนศีรษะจนเดินไม่ถนัด คลื่นไส้ต้องนอนพัก หรืออารมณ์แปรปรวนจนกระทบคนรอบข้าง ควรปรึกษาแพทย์เพื่อปรับขนาดยาหรือเปลี่ยนยา',
    ref: 'อ้างอิง: CTCAE v5.0 Grade 2; Perucca P, Gilliam FG. Lancet Neurol. 2012'
  },
  3: {
    label: 'รุนแรงปานกลาง',
    color: 'var(--warning)',
    desc: 'อาการรุนแรงปานกลาง กระทบการใช้ชีวิตมาก เช่น ซึมเศร้า อารมณ์แปรปรวนรุนแรง นิ่วในไต หรือโซเดียมในเลือดต่ำ ควรพบแพทย์โดยเร็ว',
    ref: 'อ้างอิง: CTCAE v5.0 Grade 3; Perucca P, Gilliam FG. Lancet Neurol. 2012'
  },
  4: {
    label: 'รุนแรง / ต้องพบแพทย์ทันที',
    color: 'var(--danger)',
    desc: 'อาการรุนแรง ต้องพบแพทย์ทันที เช่น ผื่นลามทั้งตัว เม็ดเลือดขาวต่ำ เกล็ดเลือดต่ำ หรือกรดในเลือดสูง ห้ามหยุดยาเองโดยไม่ปรึกษาแพทย์',
    ref: 'อ้างอิง: CTCAE v5.0 Grade 3-4; Perucca P, Gilliam FG. Lancet Neurol. 2012'
  },
  5: {
    label: 'อันตราย / ฉุกเฉิน',
    color: 'var(--danger)',
    desc: 'อาการอันตรายถึงชีวิต ต้องเรียกรถฉุกเฉินหรือไปห้องฉุกเฉินทันที เช่น ผื่นรุนแรง Stevens-Johnson Syndrome (SJS) ตัวเหลือง/ตาเหลือง (ตับอักเสบ) หรือตับอ่อนอักเสบ ห้ามหยุดยาเองโดยเด็ดขาด',
    ref: 'อ้างอิง: CTCAE v5.0 Grade 4-5; Perucca P, Gilliam FG. Lancet Neurol. 2012; Epilepsy Foundation Guidelines'
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
  const hn = document.getElementById('loginHN').value.trim();
  if (!u || !hn) { showToast('กรุณากรอกชื่อผู้ใช้ และเลขที่โรงพยาบาล'); return; }
  const users = JSON.parse(localStorage.getItem('seizguard_users') || '{}');
  if (!users[u]) { showToast('ไม่พบผู้ใช้นี้ กรุณาลงทะเบียนก่อน'); return; }
  if (users[u].hn !== hn) { showToast('เลขที่โรงพยาบาลไม่ถูกต้อง'); return; }
  currentUser = u;
  localStorage.setItem('seizguard_currentUser', u);
  enterApp();
}

function handleRegister() {
  const u = document.getElementById('loginUsername').value.trim();
  const hn = document.getElementById('loginHN').value.trim();
  if (!u || !hn) { showToast('กรุณากรอกชื่อผู้ใช้ และเลขที่โรงพยาบาล'); return; }
  if (u.length < 3) { showToast('ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร'); return; }
  if (hn.length < 1) { showToast('กรุณากรอกเลขที่โรงพยาบาล'); return; }
  const users = JSON.parse(localStorage.getItem('seizguard_users') || '{}');
  if (users[u]) { showToast('ชื่อผู้ใช้นี้ถูกใช้แล้ว'); return; }
  users[u] = { hn: hn };
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
  document.getElementById('loginHN').value = '';
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

  if (meds.length === 0 || logs.length === 0) {
    document.getElementById('medList').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-pills"></i>
        <h3>${logs.length === 0 ? 'ไม่มีรายการยาในวันนี้' : 'ยังไม่มีรายการยา'}</h3>
        <p>${logs.length === 0 ? 'ไม่มีการกำหนดยาสำหรับวันนี้' : 'กดปุ่ม + เพื่อเพิ่มรายการยากันชัก'}</p>
      </div>`;
    return;
  }

  document.getElementById('medList').innerHTML = logs.map(log => {
    const med = meds.find(m => m.id === log.medicationId);
    if (!med) return '';
    const isTaken = log.status === 'taken';
    const thaiName = getThaiName(med.name);
    const canTake = isToday && !isTaken;
    let buttonHtml = '';
    if (isTaken) {
      buttonHtml = `<span class="taken-badge">กินแล้ว</span>`;
    } else if (canTake) {
      buttonHtml = `<button class="take-btn" onclick="event.stopPropagation();takePill('${log.id}')"><i class="fas fa-check"></i></button>`;
    } else {
      buttonHtml = `<span class="taken-badge" style="background:var(--surface2);color:var(--text3)">-</span>`;
    }
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
      ${buttonHtml}
    </div>`;
  }).join('');
}

function getThaiName(engName) {
  const found = COMMON_AEDS.find(a => engName.toLowerCase().includes(a.name.split(' ')[0].toLowerCase()));
  return found ? found.thai : '';
}

function takePill(logId) {
  const todayStr = getDateStr(new Date());
  let logs = getData('medLogs');
  const idx = logs.findIndex(l => l.id === logId);
  if (idx !== -1) {
    const logDate = logs[idx].date;
    if (logDate !== todayStr) {
      showToast('สามารถบันทึกการกินยาได้เฉพาะวันนี้เท่านั้น');
      return;
    }
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
    { title:'ผลข้างเคียงที่พบได้บ่อย (ทุกยา)', body:'ยากันชักทุกตัวอาจทำให้เกิด:\n\n- เวียนศีรษะ / มึนงง\n- ง่วงนอน / อ่อนเพลีย\n- คลื่นไส้ / อาเจียน\n- ปวดศีรษะ\n- ตาพร่า / เห็นภาพซ้อน\n- เดินเซ / ทรงตัวไม่ดี', ref:'Perucca P, Gilliam FG. Adverse effects of antiepileptic drugs. Lancet Neurol. 2012;11(9):792-802.' },
    { title:'ผลข้างเคียงเฉพาะยาแต่ละตัว', body:'Phenytoin (เฟนิโทอิน):\n• เหงือกบวม (Gingival Hyperplasia) — พบบ่อย\n• ขนดก / ผมขึ้นมาก (Hirsutism) — พบได้\n• เดินเซ / ทรงตัวไม่ดี (Ataxia) — พบบ่อย\n• ตาพร่า / เห็นภาพซ้อน — พบบ่อย\n• ผื่นผิวหนัง / SJS (หายาก แต่อันตราย)\n\nCarbamazepine (คาร์บามาซีพีน):\n• โซเดียมในเลือดต่ำ (Hyponatremia) — พบได้\n• เม็ดเลือดขาวต่ำ (Leukopenia) — พบได้\n• ผื่นผิวหนัง / SJS (หายาก แต่อันตราย)\n\nValproate (วัลโปรเอต):\n• น้ำหนักเพิ่ม — พบบ่อย\n• ผมร่วง — พบบ่อย\n• มือสั่น (Tremor) — พบบ่อย\n• ตับอักเสบ (Hepatotoxicity) — หายาก แต่อันตราย\n• ตับอ่อนอักเสบ (Pancreatitis) — หายาก แต่อันตราย\n\nLevetiracetam (ลีเวไทราซีแทม):\n• หงุดหงิด / อารมณ์แปรปรวน — พบบ่อย\n• นอนไม่หลับ — พบบ่อย\n• ซึมเศร้า / ก้าวร้าว — พบได้\n\nLamotrigine (ลาโมไทรจีน):\n• ผื่นผิวหนัง (พบบ่อยในเด็ก) — ต้องระวัง\n• ผื่นรุนแรง SJS — หายาก แต่อันตราย\n\nTopiramate (โทพิราเมท):\n• ความจำ / สมาธิลดลง — พบบ่อย\n• นิ่วในไต (Kidney Stones) — พบได้\n• น้ำหนักลด / เบื่ออาหาร — พบบ่อย\n\nOxcarbazepine (ออกซ์คาร์บาซีพีน):\n• โซเดียมในเลือดต่ำ (พบบ่อยกว่า Carbamazepine) — ต้องติดตาม\n• ผื่นผิวหนัง / SJS — หายาก แต่อันตราย\n\nGabapentin (กาบาเพนติน):\n• ง่วงนอน / เดินเซ — พบบ่อย\n• น้ำหนักเพิ่ม — พบบ่อย\n• บวมน้ำ (Peripheral Edema) — พบได้\n\nPhenobarbital (ฟีโนบาร์บิทอล):\n• ง่วงนอนมาก — พบบ่อยมาก\n• ความจำ / สมาธิลดลง — พบบ่อย\n• ซึมเศร้า — พบได้\n• การพึ่งพายา (Dependence) — เมื่อใช้นาน', ref:'Perucca P, Gilliam FG. Adverse effects of antiepileptic drugs. Lancet Neurol. 2012;11(9):792-802.' },
    { title:'เมื่อไหร่ควรพบแพทย์ทันที (อาการอันตราย)', body:'- ผื่นรุนแรง / Stevens-Johnson Syndrome (SJS) — หยุดยาทันที ไปห้องฉุกเฉิน\n- ตัวเหลือง / ตาเหลือง (อาจเป็นสัญญาณตับอักเสบ) — ไปห้องฉุกเฉิน\n- ปวดท้องรุนแรง / อาเจียนมาก (อาจเป็นสัญญาณตับอ่อนอักเสบ)\n- ปากเจ็บ / แผลในปาก / ไข้ (อาจเป็นสัญญาณเม็ดเลือดขาวต่ำ)\n- เลือดออกผิดปกติ\n- อาการชักเพิ่มขึ้นหรือเปลี่ยนแปลง\n- พฤติกรรมหรืออารมณ์เปลี่ยนแปลงมาก (เช่น คิดทำร้ายตัวเอง)' },
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
  const meds = getData('medications');
  container.innerHTML = logs.map(l => {
    const sev = SIDE_EFFECT_SEVERITY_DESCRIPTIONS[l.severity] || SIDE_EFFECT_SEVERITY_DESCRIPTIONS[1];
    const med = meds.find(m => m.id === l.medicationId);
    const medName = med ? med.name : '';
    return `<div class="log-card">
      <div class="log-header">
        <div class="log-date-row"><i class="fas fa-calendar"></i><span>${l.date}</span>${medName ? `<span style="font-size:11px;color:var(--primary);margin-left:6px"><i class="fas fa-pills"></i> ${medName}</span>` : ''}</div>
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
  selectedSeizureSeverity = 0;
  selectedSeizureSymptoms = [];
  updateSeizureSeverityUI();
  renderSeizureSymptomChips();
}

function calculateSeizureSeverity() {
  const duration = document.getElementById('seizureDuration').value;
  if (!duration) { selectedSeizureSeverity = 0; updateSeizureSeverityUI(); return; }

  let score = 1;
  // Duration scoring
  if (duration === '30-60 วินาที') score = 2;
  else if (duration === '1-2 นาที') score = 3;
  else if (duration === '2-5 นาที') score = 4;
  else if (duration === '> 5 นาที') score = 5;

  // Symptom weighting
  let maxSymptomWeight = 0;
  selectedSeizureSymptoms.forEach(sName => {
    const s = SEIZURE_SYMPTOMS.find(item => item.name === sName);
    if (s && s.weight > maxSymptomWeight) maxSymptomWeight = s.weight;
  });

  // Final score is the higher of duration or max symptom weight
  selectedSeizureSeverity = Math.max(score, maxSymptomWeight);
  updateSeizureSeverityUI();
}

function updateSeizureSeverityUI() {
  const badge = document.getElementById('seizureSevBadge');
  const label = document.getElementById('seizureSevLabel');
  const desc = document.getElementById('seizureSeverityDesc');

  if (selectedSeizureSeverity === 0) {
    badge.textContent = '-';
    badge.style.background = 'var(--text3)';
    label.textContent = 'กรุณาเลือกระยะเวลาและอาการ';
    desc.classList.remove('active');
    return;
  }

  const sev = SEVERITY_DESCRIPTIONS[selectedSeizureSeverity];
  badge.textContent = selectedSeizureSeverity;
  badge.style.background = sev.color;
  label.textContent = sev.label;
  label.style.color = sev.color;
  desc.innerHTML = `<strong>คำแนะนำ:</strong> ${sev.desc}<br><small style="display:block;margin-top:8px;color:var(--text3);font-size:10px;font-style:italic">${sev.ref}</small>`;
  desc.classList.add('active');
}

function renderSeizureSymptomChips() {
  const symptomNames = SEIZURE_SYMPTOMS.map(s => s.name);
  renderChips('seizureSymptoms', symptomNames, selectedSeizureSymptoms, toggleSeizureSymptom);
}

function toggleSeizureSymptom(s) {
  toggleArr(selectedSeizureSymptoms, s);
  renderSeizureSymptomChips();
  calculateSeizureSeverity();
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
  selectedSideEffectSeverity = 0;
  selectedSideEffects = [];
  const meds = getData('medications');
  selectedSideEffectMedId = meds.length > 0 ? meds[0].id : '';
  renderSideEffectMeds();
  updateSideEffectSeverityUI();
  renderSideEffectSymptomChips();
}

function calculateSideEffectSeverity() {
  if (selectedSideEffects.length === 0) {
    selectedSideEffectSeverity = 0;
    updateSideEffectSeverityUI();
    return;
  }

  // ใช้รายการอาการข้างเคียงของยาที่เลือกอยู่
  const currentList = getSideEffectListForSelectedMed();
  let maxWeight = 1;
  selectedSideEffects.forEach(sName => {
    const s = currentList.find(item => item.name === sName);
    if (s && s.weight > maxWeight) maxWeight = s.weight;
  });

  selectedSideEffectSeverity = maxWeight;
  updateSideEffectSeverityUI();
}

function updateSideEffectSeverityUI() {
  const badge = document.getElementById('sideEffectSevBadge');
  const label = document.getElementById('sideEffectSevLabel');
  const desc = document.getElementById('sideEffectSeverityDesc');

  if (selectedSideEffectSeverity === 0) {
    badge.textContent = '-';
    badge.style.background = 'var(--text3)';
    label.textContent = 'กรุณาเลือกอาการข้างเคียง';
    desc.classList.remove('active');
    return;
  }

  const sev = SIDE_EFFECT_SEVERITY_DESCRIPTIONS[selectedSideEffectSeverity];
  badge.textContent = selectedSideEffectSeverity;
  badge.style.background = sev.color;
  label.textContent = sev.label;
  label.style.color = sev.color;
  desc.innerHTML = `<strong>คำแนะนำ:</strong> ${sev.desc}<br><small style="display:block;margin-top:8px;color:var(--text3);font-size:10px;font-style:italic">${sev.ref}</small>`;
  desc.classList.add('active');
}

function getSideEffectListForSelectedMed() {
  const meds = getData('medications');
  const med = meds.find(m => m.id === selectedSideEffectMedId);
  if (!med) return SIDE_EFFECTS_LIST;
  // ค้นหาชื่อยาใน AED_SIDE_EFFECTS โดยตรวจสอบว่าชื่อยาใน COMMON_AEDS ตรงกับ key ใน AED_SIDE_EFFECTS
  const matchedKey = Object.keys(AED_SIDE_EFFECTS).find(key =>
    med.name.toLowerCase().includes(key.split(' ')[0].toLowerCase()) ||
    key.toLowerCase().includes(med.name.split(' ')[0].toLowerCase())
  );
  if (matchedKey) return AED_SIDE_EFFECTS[matchedKey];
  return SIDE_EFFECTS_LIST;
}

function renderSideEffectSymptomChips() {
  const sideEffectList = getSideEffectListForSelectedMed();
  const meds = getData('medications');
  const med = meds.find(m => m.id === selectedSideEffectMedId);
  const container = document.getElementById('sideEffectSymptoms');

  // แสดงชื่อยาและอ้างอิงเหนือ chip
  const matchedKey = med ? Object.keys(AED_SIDE_EFFECTS).find(key =>
    med.name.toLowerCase().includes(key.split(' ')[0].toLowerCase()) ||
    key.toLowerCase().includes(med.name.split(' ')[0].toLowerCase())
  ) : null;

  let headerHtml = '';
  if (matchedKey) {
    headerHtml = `<div style="font-size:11px;color:var(--text3);margin-bottom:8px;font-style:italic">อาการข้างเคียงเฉพาะของ <strong>${matchedKey}</strong> — อ้างอิง: Perucca P, Gilliam FG. Lancet Neurol. 2012</div>`;
  } else {
    headerHtml = `<div style="font-size:11px;color:var(--text3);margin-bottom:8px;font-style:italic">อาการข้างเคียงทั่วไปของยากันชัก</div>`;
  }

  const chipsHtml = sideEffectList.map(item => {
    const sel = selectedSideEffects.includes(item.name);
    const freqBadge = item.freq ? `<span style="font-size:9px;opacity:0.7;display:block;margin-top:1px">${item.freq}</span>` : '';
    const sevColor = item.weight >= 5 ? 'var(--danger)' : item.weight >= 4 ? 'var(--danger)' : item.weight >= 3 ? 'var(--warning)' : 'var(--text3)';
    const sevDot = item.weight >= 3 ? `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${sevColor};margin-right:3px;vertical-align:middle"></span>` : '';
    return `<button class="chip ${sel?'selected':''}" onclick="toggleSideEffect('${item.name.replace(/'/g, "\\'")}')">${sevDot}${item.name}${freqBadge}</button>`;
  }).join('');

  container.innerHTML = headerHtml + chipsHtml;
}

function toggleSideEffect(s) {
  toggleArr(selectedSideEffects, s);
  renderSideEffectSymptomChips();
  calculateSideEffectSeverity();
}

function renderSideEffectMeds() {
  const meds = getData('medications');
  document.getElementById('sideEffectMeds').innerHTML = meds.map(m => {
    const sel = selectedSideEffectMedId === m.id;
    return `<button class="chip ${sel?'selected':''}" onclick="selectedSideEffectMedId='${m.id}';renderSideEffectMeds();renderSideEffectSymptomChips();selectedSideEffects=[];calculateSideEffectSeverity()">${m.name}</button>`;
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
  const profile = getObj('profile') || { name:'', hn:'', age:'', diagnosis:'', emergencyContact:'', emergencyPhone:'', doctorName:'', doctorPhone:'', nextAppointment:'' };
  const phone = profile.emergencyPhone || '1669';
  document.getElementById('emergencyNumber').textContent = phone;
  document.getElementById('emergencyCallBtn').href = `tel:${phone}`;

  const editIcon = editingProfile ? 'fa-check' : 'fa-pen';
  document.getElementById('editProfileBtn').innerHTML = `<i class="fas ${editIcon}"></i>`;

  const fields = [
    { section:'ข้อมูลผู้ป่วย', icon:'fa-user', color:'var(--primary)', rows:[
      { key:'name', label:'ชื่อ-สกุล', placeholder:'ระบุชื่อ-สกุล' },
      { key:'hn', label:'เลขที่โรงพยาบาล (HN)', placeholder:'ระบุเลขที่ HN' },
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


/* ===== GOOGLE SHEET INTEGRATION ===== */
// Google Form URL
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfAukHlHfPDMztqyVgnmEBBhFB3doYNVfkziA9r6Z4gHPbGyA/formResponse';

// ฟิลด์ ID ของ Google Form
const FORM_FIELDS = {
  username: 'entry.607237854',
  hn: 'entry.1510434627',
  date: 'entry.1957480164',
  medName: 'entry.279375545',
  status: 'entry.1642115361',
  actualTime: 'entry.1324849634',
  seizure: 'entry.1692092125',
  seizureSeverity: 'entry.219841705',
  sideEffect: 'entry.341674460',
  sideEffectType: 'entry.273226191',
  sideEffectSeverity: 'entry.294989148'
};

// ฟังก์ชันสำหรับส่งข้อมูลไปยัง Google Sheet
function submitToGoogleSheet() {
  const username = currentUser;
  const users = JSON.parse(localStorage.getItem('seizguard_users') || '{}');
  const hn = users[username]?.hn || '';
  
  const meds = getData('medications');
  const medLogs = getData('medLogs');
  const seizures = getData('seizures');
  const sideEffects = getData('sideEffects');
  
  if (meds.length === 0 && medLogs.length === 0 && seizures.length === 0 && sideEffects.length === 0) {
    showToast('ไม่มีข้อมูลที่จะส่ง');
    return;
  }
  
  let submittedCount = 0;
  
  // ส่งข้อมูลการกินยา
  medLogs.forEach((log) => {
    const med = meds.find(m => m.id === log.medicationId);
    if (med) {
      const formData = new FormData();
      formData.append(FORM_FIELDS.username, username);
      formData.append(FORM_FIELDS.hn, hn);
      formData.append(FORM_FIELDS.date, log.date);
      formData.append(FORM_FIELDS.medName, med.name);
      formData.append(FORM_FIELDS.status, log.status === 'taken' ? 'กินแล้ว' : 'ยังไม่กิน');
      
      if (log.actualTime) {
        formData.append(FORM_FIELDS.actualTime, log.actualTime);
      }
      
      // ส่งข้อมูลการชัก
      const seizure = seizures.find(s => s.date === log.date);
      if (seizure) {
        formData.append(FORM_FIELDS.seizure, 'มี');
        formData.append(FORM_FIELDS.seizureSeverity, seizure.severity || '');
      } else {
        formData.append(FORM_FIELDS.seizure, 'ไม่มี');
      }
      
      // ส่งข้อมูลผลข้างเคียง
      const sideEffect = sideEffects.find(s => s.date === log.date);
      if (sideEffect) {
        formData.append(FORM_FIELDS.sideEffect, 'มี');
        formData.append(FORM_FIELDS.sideEffectType, sideEffect.symptoms?.join(', ') || '');
        formData.append(FORM_FIELDS.sideEffectSeverity, sideEffect.severity || '');
      } else {
        formData.append(FORM_FIELDS.sideEffect, 'ไม่มี');
      }
      
      // ส่งข้อมูลไปยัง Google Form
      fetch(GOOGLE_FORM_URL, {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
      }).then(() => {
        submittedCount++;
      }).catch(err => {
        console.error('Error:', err);
      });
    }
  });
  
  setTimeout(() => {
    showToast(`ส่งข้อมูล ${submittedCount} รายการไปยัง Google Sheet สำเร็จ!`);
  }, 500);
}

// เพิ่มปุ่มส่งข้อมูลในหน้า Profile
function addGoogleSheetButton() {
  const profileContent = document.getElementById('tabProfile');
  if (profileContent && !document.getElementById('submitGoogleSheetBtn')) {
    const btn = document.createElement('button');
    btn.id = 'submitGoogleSheetBtn';
    btn.className = 'btn-primary btn-large';
    btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> ส่งข้อมูลไปยัง Google Sheet';
    btn.onclick = submitToGoogleSheet;
    btn.style.marginTop = '20px';
    profileContent.appendChild(btn);
  }
}

// เรียกใช้เมื่อเข้าแอป
window.addEventListener('load', () => {
  setTimeout(addGoogleSheetButton, 500);
});
