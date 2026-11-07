'use strict';
const $=id=>document.getElementById(id);
let session='',role='',view=null,demo=false,allPatients=[];

const PRESET_MEDS = {
  'depakine-500-bid': { name: 'Depakine Chrono (Sodium Valproate) 500 mg', dosage: '1 เม็ด วันละ 2 ครั้ง เช้า-เย็น หลังอาหาร', times: '08:00, 20:00' },
  'depakine-500-hs': { name: 'Depakine Chrono (Sodium Valproate) 500 mg', dosage: '1 เม็ด วันละ 1 ครั้ง ก่อนนอน', times: '20:00' },
  'depakine-200-bid': { name: 'Depakine (Sodium Valproate) 200 mg', dosage: '1 เม็ด วันละ 2 ครั้ง เช้า-เย็น หลังอาหาร', times: '08:00, 20:00' },
  'keppra-500-bid': { name: 'Keppra (Levetiracetam) 500 mg', dosage: '1 เม็ด วันละ 2 ครั้ง เช้า-เย็น หลังอาหาร', times: '08:00, 20:00' },
  'keppra-250-bid': { name: 'Keppra (Levetiracetam) 250 mg', dosage: '1 เม็ด วันละ 2 ครั้ง เช้า-เย็น หลังอาหาร', times: '08:00, 20:00' },
  'keppra-1000-bid': { name: 'Keppra (Levetiracetam) 1,000 mg', dosage: '1 เม็ด วันละ 2 ครั้ง เช้า-เย็น หลังอาหาร', times: '08:00, 20:00' },
  'dilantin-100-hs': { name: 'Dilantin (Phenytoin) 100 mg', dosage: '3 แคปซูล วันละ 1 ครั้ง ก่อนนอน', times: '20:00' },
  'dilantin-100-bid': { name: 'Dilantin (Phenytoin) 100 mg', dosage: '1 แคปซูล วันละ 2 ครั้ง เช้า-เย็น หลังอาหาร', times: '08:00, 20:00' },
  'dilantin-100-hs2': { name: 'Dilantin (Phenytoin) 100 mg', dosage: '2 แคปซูล วันละ 1 ครั้ง ก่อนนอน', times: '20:00' },
  'tegretol-200-bid': { name: 'Tegretol (Carbamazepine) 200 mg', dosage: '1 เม็ด วันละ 2 ครั้ง เช้า-เย็น หลังอาหาร', times: '08:00, 20:00' },
  'tegretol-cr-400-bid': { name: 'Tegretol CR (Carbamazepine) 400 mg', dosage: '1 เม็ด วันละ 2 ครั้ง เช้า-เย็น หลังอาหาร', times: '08:00, 20:00' },
  'lamictal-25-bid': { name: 'Lamictal (Lamotrigine) 25 mg', dosage: '1 เม็ด วันละ 2 ครั้ง เช้า-เย็น หลังอาหาร', times: '08:00, 20:00' },
  'lamictal-50-bid': { name: 'Lamictal (Lamotrigine) 50 mg', dosage: '1 เม็ด วันละ 2 ครั้ง เช้า-เย็น หลังอาหาร', times: '08:00, 20:00' },
  'lamictal-100-bid': { name: 'Lamictal (Lamotrigine) 100 mg', dosage: '1 เม็ด วันละ 2 ครั้ง เช้า-เย็น หลังอาหาร', times: '08:00, 20:00' },
  'topamax-25-bid': { name: 'Topamax (Topiramate) 25 mg', dosage: '1 เม็ด วันละ 2 ครั้ง เช้า-เย็น หลังอาหาร', times: '08:00, 20:00' },
  'topamax-50-bid': { name: 'Topamax (Topiramate) 50 mg', dosage: '1 เม็ด วันละ 2 ครั้ง เช้า-เย็น หลังอาหาร', times: '08:00, 20:00' },
  'trileptal-300-bid': { name: 'Trileptal (Oxcarbazepine) 300 mg', dosage: '1 เม็ด วันละ 2 ครั้ง เช้า-เย็น หลังอาหาร', times: '08:00, 20:00' },
  'trileptal-600-bid': { name: 'Trileptal (Oxcarbazepine) 600 mg', dosage: '1 เม็ด วันละ 2 ครั้ง เช้า-เย็น หลังอาหาร', times: '08:00, 20:00' },
  'phenobarb-60-hs': { name: 'Phenobarbital 60 mg', dosage: '1 เม็ด วันละ 1 ครั้ง ก่อนนอน', times: '20:00' },
  'phenobarb-30-hs': { name: 'Phenobarbital 30 mg', dosage: '1 เม็ด วันละ 1 ครั้ง ก่อนนอน', times: '20:00' },
  'rivotril-05-hs': { name: 'Rivotril (Clonazepam) 0.5 mg', dosage: '1 เม็ด วันละ 1 ครั้ง ก่อนนอน', times: '20:00' },
  'rivotril-2-hs': { name: 'Rivotril (Clonazepam) 2 mg', dosage: '0.5 เม็ด วันละ 1 ครั้ง ก่อนนอน', times: '20:00' },
  'vimpat-50-bid': { name: 'Vimpat (Lacosamide) 50 mg', dosage: '1 เม็ด วันละ 2 ครั้ง เช้า-เย็น หลังอาหาร', times: '08:00, 20:00' },
  'vimpat-100-bid': { name: 'Vimpat (Lacosamide) 100 mg', dosage: '1 เม็ด วันละ 2 ครั้ง เช้า-เย็น หลังอาหาร', times: '08:00, 20:00' },
  'neurontin-300-tid': { name: 'Neurontin (Gabapentin) 300 mg', dosage: '1 แคปซูล วันละ 3 ครั้ง เช้า-กลางวัน-เย็น หลังอาหาร', times: '08:00, 12:00, 18:00' }
};

const endpoint=()=>window.SEIZGUARD_CLOUD?.endpoint;
async function api(action,data={}){
  if(!endpoint())throw new Error('ส่วนกลางยังไม่ได้เชื่อมต่อ ใช้ปุ่มดูตัวอย่างข้อมูลสมมติเพื่อดูหน้าจอก่อนได้');
  const response=await fetch(endpoint(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,session,...data}),credentials:'omit',cache:'no-store'});
  const result=await response.json();if(!result.ok)throw new Error(result.error||'ไม่สามารถดำเนินการได้');return result.data;
}
function node(tag,value,className){const e=document.createElement(tag);if(value!==undefined)e.textContent=value;if(className)e.className=className;return e;}
function dateLabel(s){if(!s)return 'ยังไม่กำหนด';return new Intl.DateTimeFormat('th-TH',{dateStyle:'medium'}).format(new Date(s+'T12:00:00+07:00'));}

function renderPatientDetails(){
  if(!view){
    $('patientDetailsArea').hidden=true;
    return;
  }
  $('patientDetailsArea').hidden=false;
  $('patientName').textContent=view.name;
  $('patientHn').textContent='HN '+view.hn;
  $('displayId').textContent=view.patientId;
  $('searchId').value=view.patientId;
  $('connectionStatus').textContent=view.connected?'ผู้ป่วยเชื่อมต่อส่วนกลางแล้ว':'ยังรอผู้ป่วยเชื่อมแอป';
  const a=view.adherence;
  $('adherenceValue').textContent=a.percent===null?'ไม่มีข้อมูล':a.percent+'%';
  $('targetValue').value=a.target||'';
  $('adherenceDetail').textContent=`กินแล้ว ${a.taken}/${a.expected??a.recorded} มื้อตามแผนที่ส่วนกลางทราบและถึงเวลาแล้ว`+(a.target?` · เป้าหมาย ${a.target}%${a.percent===null?'':a.percent>=a.target?' · ถึงเป้าหมาย':' · ต่ำกว่าเป้าหมาย'}`:' · ยังไม่กำหนดเป้าหมาย')+(a.missing?` · ${a.missing} มื้อยังไม่มีผลบันทึก`:'');
  $('seizureCount').textContent=view.events.filter(e=>e.type==='seizure').length;
  $('effectCount').textContent=view.events.filter(e=>e.type==='side_effect').length;
  $('appointmentValue').textContent=dateLabel(view.nextAppointment);
  $('nextAppointment').value=view.nextAppointment||'';
  $('allergies').value=(view.allergies||[]).join('\n');

  const meds=$('medications');
  meds.replaceChildren();
  for(const med of view.medications){
    const r=node('div',undefined,'med-row');
    r.append(node('strong',med.name),node('p',med.dosage));
    for(const time of med.times)r.append(node('span',time,'med-time'));
    r.append(node('p',med.active?'กำลังใช้':'ยุติแล้ว'));
    if(med.active){
      const stop=node('button','ยุติแผนยานี้','secondary');
      stop.onclick=()=>{
        if(!confirm('ยืนยันยุติแผนยา '+med.name+' ของ '+view.name+' ตามคำสั่งการรักษา?'))return;
        task(async()=>{
          if(demo)med.active=false;
          else view=await api('admin.medication',{patientId:view.patientId,medication:{...med,active:false}});
          renderPatientDetails();
        });
      };
      r.append(stop);
    }
    meds.append(r);
  }
  if(!view.medications.length)meds.append(node('p','ยังไม่มีแผนยาที่ส่งเข้าระบบ'));

  const tbody=$('events');
  tbody.replaceChildren();
  for(const e of view.events){
    const tr=node('tr');
    const med=view.medications.find(m=>m.id===e.medicationId);
    const type={dose:'รับประทานยา',seizure:'อาการชัก',side_effect:'อาการข้างเคียง'}[e.type];
    const detail=e.type==='dose'?`${med?.name||'ยา'} · ${{taken:'กินแล้ว',pending:'ยังไม่มีการยืนยัน',missed:'บันทึกว่าขาดยา'}[e.status]||e.status}`:[e.duration,...(e.symptoms||[])].filter(Boolean).join(' · ');
    for(const val of [e.date+' '+(e.time||''),type,detail,e.severity||'—'])tr.append(node('td',val));
    tbody.append(tr);
  }
  if(!view.events.length){
    const r=node('tr'),c=node('td','ยังไม่มีบันทึกที่ส่งเข้าระบบ');
    c.colSpan=4;r.append(c);tbody.append(r);
  }
}

let currentFilter='all';
function renderPatientsTable(){
  const tbody=$('patientsTableBody');
  tbody.replaceChildren();
  const filtered=allPatients.filter(p=>{
    if(currentFilter==='unlinked')return !p.linked;
    if(currentFilter==='linked')return p.linked;
    return true;
  });

  const countAll=allPatients.length;
  const countLinked=allPatients.filter(p=>p.linked).length;
  const countUnlinked=allPatients.filter(p=>!p.linked).length;
  $('countAll').textContent=countAll;
  $('countLinked').textContent=countLinked;
  $('countUnlinked').textContent=countUnlinked;

  if(!filtered.length){
    const r=node('tr'),c=node('td','ไม่พบข้อมูลผู้ป่วยในหมวดนี้','');
    c.colSpan=6;c.style.textAlign='center';r.append(c);tbody.append(r);
    return;
  }

  for(const p of filtered){
    const tr=node('tr');
    const dateStr=p.createdAt?new Intl.DateTimeFormat('th-TH',{dateStyle:'short',timeStyle:'short'}).format(new Date(p.createdAt)):(p.date||'—');
    tr.append(node('td',dateStr));
    const tdId=node('td');
    const codeSpan=node('code',p.patientId);
    codeSpan.style.fontFamily='monospace';codeSpan.style.fontWeight='600';codeSpan.style.color='#0b747a';
    tdId.append(codeSpan);
    tr.append(tdId);
    tr.append(node('td',p.username||'—'));

    const tdStatus=node('td');
    const tag=node('span',p.linked?'✓ จับคู่แล้ว':'รอจับคู่',p.linked?'tag-status tag-linked':'tag-status tag-unlinked');
    tdStatus.append(tag);
    tr.append(tdStatus);

    const tdName=node('td',p.linked?`HN ${p.hn} · ${p.name}`:'— (ยังไม่ระบุ)');
    tr.append(tdName);

    const tdActions=node('td');
    tdActions.style.whiteSpace='nowrap';
    if(!p.linked){
      const btnLink=node('button','จับคู่ข้อมูล','btn-table link');
      btnLink.onclick=()=>{
        $('linkPatientId').value=p.patientId;
        $('linkHn').focus();
        $('linkSection').scrollIntoView({behavior:'smooth'});
      };
      tdActions.append(btnLink);
    }
    const btnView=node('button',p.linked?'ดูข้อมูล/จัดการยา':'ดูข้อมูล','btn-table view');
    btnView.style.marginLeft='6px';
    btnView.onclick=()=>task(async()=>{
      if(demo){
        $('dashboardMessage').textContent='โหมดตัวอย่างมีผู้ป่วยสมมติเพียงรายเดียว';
        return;
      }
      try{
        view=await api('admin.patient',{patientId:p.patientId});
        renderPatientDetails();
        $('patientDetailsArea').scrollIntoView({behavior:'smooth'});
      }catch(err){
        $('dashboardMessage').textContent=err.message;
      }
    });
    tdActions.append(btnView);
    tr.append(tdActions);

    tbody.append(tr);
  }
}

async function loadAllPatients(){
  if(demo)return;
  try{
    allPatients=await api('admin.patients.all');
    renderPatientsTable();
  }catch(e){
    console.error('Failed to load patients list:',e);
  }
}

function render(){
  $('adminLogin').hidden=true;
  $('dashboard').hidden=false;
  $('modeLabel').textContent=demo?'ตัวอย่างข้อมูลสมมติ · การแก้ไขไม่ส่งเข้าระบบจริง':'ผู้ดูแลที่ได้รับอนุมัติ';
  renderPatientDetails();
  $('accessPanel').hidden=role!=='owner';
}

async function task(fn){
  $('dashboardMessage').textContent='';
  try{await fn();}catch(e){$('dashboardMessage').textContent=e.message;}
}

$('loginForm').addEventListener('submit',async e=>{
  e.preventDefault();
  $('loginMessage').textContent='กำลังตรวจสิทธิ์…';
  const button=e.submitter;button.disabled=true;
  try{
    const pid=$('patientId').value.trim().toUpperCase();
    const result=await api('admin.login',{adminCode:$('adminCode').value.trim(),patientId:pid||undefined});
    session=result.session;
    setTimeout(()=>location.reload(),30*60*1000);
    role=result.role;
    view=result.patient;
    $('adminCode').value='';
    demo=false;
    render();
    await loadAllPatients();
    if(role==='owner')await loadAdmins();
  }catch(error){
    $('loginMessage').textContent=error.message;
  }finally{
    button.disabled=false;
  }
});

$('logoutButton').onclick=async()=>{
  if(!demo&&session)await api('admin.logout').catch(()=>{});
  session='';view=null;role='';location.reload();
};

$('searchForm').onsubmit=e=>{
  e.preventDefault();
  task(async()=>{
    if(demo){
      $('dashboardMessage').textContent='โหมดตัวอย่างมีผู้ป่วยสมมติเพียงรายเดียว';
      return;
    }
    view=await api('admin.patient',{patientId:$('searchId').value.trim().toUpperCase()});
    renderPatientDetails();
    $('patientDetailsArea').scrollIntoView({behavior:'smooth'});
  });
};

// Patient Linking form submit
$('linkForm').onsubmit=async e=>{
  e.preventDefault();
  const btn=$('btnLinkSubmit');
  btn.disabled=true;
  $('linkMessage').textContent='กำลังเชื่อมโยงข้อมูลกับ Google Sheets…';
  $('linkMessage').style.color='#0b747a';
  try{
    const patientId=$('linkPatientId').value.trim().toUpperCase();
    const hn=$('linkHn').value.trim();
    const firstName=$('linkFirstName').value.trim();
    const lastName=$('linkLastName').value.trim();
    const name=`${firstName} ${lastName}`.trim();
    if(demo){
      allPatients.push({patientId,username:'demo',linked:true,hn,name,createdAt:new Date().toISOString()});
      renderPatientsTable();
      $('linkMessage').textContent='✓ (โหมดตัวอย่าง) จำลองเชื่อมโยงข้อมูลสำเร็จ!';
      $('linkMessage').style.color='#2e7d32';
      $('linkForm').reset();
      return;
    }
    const res=await api('admin.patient.link',{patientId,hn,name});
    $('linkMessage').textContent=`✓ เชื่อมโยงสำเร็จ! บันทึก ${name} (HN: ${hn}) เข้าสู่ Sheet ทะเบียนผู้ป่วย และ SeizGuard_IDs แล้ว`;
    $('linkMessage').style.color='#2e7d32';
    $('linkForm').reset();
    await loadAllPatients();
    if(res.patient){
      view=res.patient;
      renderPatientDetails();
      $('patientDetailsArea').scrollIntoView({behavior:'smooth'});
    }
  }catch(err){
    $('linkMessage').textContent='เกิดข้อผิดพลาด: '+err.message;
    $('linkMessage').style.color='#c62828';
  }finally{
    btn.disabled=false;
  }
};

$('refreshPatientsBtn').onclick=()=>task(loadAllPatients);

document.querySelectorAll('.filter-chip').forEach(chip=>{
  chip.onclick=()=>{
    document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter=chip.dataset.filter;
    renderPatientsTable();
  };
});

// Medication presets & quick chips
$('medPreset').onchange=()=>{
  const val=$('medPreset').value;
  if(!val||!PRESET_MEDS[val])return;
  const p=PRESET_MEDS[val];
  $('adminMedName').value=p.name;
  $('adminMedDosage').value=p.dosage;
  $('adminMedTimes').value=p.times;
  $('adminMedTimes').setCustomValidity('');
};

document.querySelectorAll('.chip-btn').forEach(btn=>{
  btn.onclick=()=>{
    if(btn.dataset.time){
      $('adminMedTimes').value=btn.dataset.time;
      $('adminMedTimes').setCustomValidity('');
    }
  };
});

$('addMedicationButton').onclick=()=>{
  $('medPatient').textContent=view.name+' · '+view.patientId+' (HN: '+view.hn+')';
  $('medicationForm').reset();
  $('medPreset').value='';
  $('medDialog').showModal();
};
$('cancelMedication').onclick=()=>$('medDialog').close();

$('medicationForm').onsubmit=e=>{
  e.preventDefault();
  const medication={
    name:$('adminMedName').value.trim(),
    dosage:$('adminMedDosage').value.trim(),
    times:$('adminMedTimes').value.split(',').map(x=>x.trim()).filter(Boolean)
  };
  if(medication.times.some(t=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(t))){
    $('adminMedTimes').setCustomValidity('ใช้เวลา HH:mm เช่น 08:00, 20:00');
    $('adminMedTimes').reportValidity();
    return;
  }
  $('adminMedTimes').setCustomValidity('');
  task(async()=>{
    if(demo)view.medications.push({...medication,id:crypto.randomUUID(),active:true});
    else view=await api('admin.medication',{patientId:view.patientId,medication});
    $('medDialog').close();
    renderPatientDetails();
  });
};
$('adminMedTimes').oninput=()=>$('adminMedTimes').setCustomValidity('');

$('appointmentForm').onsubmit=e=>{
  e.preventDefault();
  task(async()=>{
    const date=$('nextAppointment').value;
    if(demo)view.nextAppointment=date;
    else view=await api('admin.appointment',{patientId:view.patientId,date});
    renderPatientDetails();
  });
};
$('allergyForm').onsubmit=e=>{
  e.preventDefault();
  task(async()=>{
    const allergies=$('allergies').value.split('\n').map(x=>x.trim()).filter(Boolean);
    if(demo)view.allergies=allergies;
    else view=await api('admin.allergies',{patientId:view.patientId,allergies});
    renderPatientDetails();
  });
};
$('targetForm').onsubmit=e=>{
  e.preventDefault();
  task(async()=>{
    const target=Number($('targetValue').value);
    if(demo)view.adherence.target=target;
    else view=await api('admin.target',{patientId:view.patientId,target});
    renderPatientDetails();
  });
};

async function loadAdmins(){
  const list=await api('admin.access.list');
  $('adminList').replaceChildren();
  for(const a of list){
    const r=node('div',undefined,'med-row');
    r.append(node('strong',a.label),node('p',a.role==='owner'?'เจ้าของระบบ':a.approved?'อนุมัติแล้ว':'ยังไม่อนุมัติ'));
    if(a.role!=='owner'){
      const b=node('button',a.approved?'เพิกถอนสิทธิ์':'อนุมัติ');
      b.onclick=()=>task(async()=>{
        await api('admin.access.approve',{id:a.id,approved:!a.approved});
        await loadAdmins();
      });
      r.append(b);
    }
    $('adminList').append(r);
  }
}
$('createAdminForm').onsubmit=e=>{
  e.preventDefault();
  task(async()=>{
    const result=await api('admin.access.create',{label:$('newAdminLabel').value.trim()});
    $('newAdminCode').textContent='รหัสแสดงครั้งเดียว ส่งให้ผู้ดูแลผ่านช่องทางส่วนตัว\n'+result.code+'\nสถานะ: ยังไม่อนุมัติ';
    await loadAdmins();
  });
};

$('demoButton').onclick=()=>{
  demo=true;
  role='clinician';
  document.body.classList.add('demo');
  allPatients=[
    {patientId:'SG-DEMO-0000-0000-0001',username:'somchai_demo',linked:true,hn:'6701001',name:'นายสมชาย ตัวอย่าง',createdAt:new Date().toISOString()},
    {patientId:'SG-DEMO-0000-0000-0002',username:'wipa_demo',linked:false,hn:'',name:'',createdAt:new Date(Date.now()-3600000).toISOString()},
    {patientId:'SG-DEMO-0000-0000-0003',username:'prasert_demo',linked:false,hn:'',name:'',createdAt:new Date(Date.now()-86400000).toISOString()}
  ];
  view={
    patientId:'SG-DEMO-0000-0000-0001',
    name:'ผู้ป่วยตัวอย่าง (ข้อมูลสมมติ)',
    hn:'DEMO-ONLY',
    connected:true,
    nextAppointment:'2026-11-21',
    allergies:['Phenytoin (แพ้ผื่นขึ้น)'],
    adherence:{taken:12,recorded:14,percent:86,target:90},
    medications:[
      {id:'demo-med-1',name:'Depakine Chrono 500 mg',dosage:'1 เม็ด เช้า-เย็น หลังอาหาร',times:['08:00','20:00'],active:true},
      {id:'demo-med-2',name:'Keppra 500 mg',dosage:'1 เม็ด เช้า-เย็น หลังอาหาร',times:['08:00','20:00'],active:true}
    ],
    events:[
      {type:'dose',date:'2026-11-07',time:'08:00',medicationId:'demo-med-1',status:'taken'},
      {type:'seizure',date:'2026-11-06',time:'16:30',duration:'2 นาที',symptoms:['เกร็งกระตุกทั้งตัว','เหม่อลอย'],severity:3},
      {type:'side_effect',date:'2026-11-05',time:'10:00',symptoms:['ง่วงซึม','เวียนศีรษะ'],severity:1}
    ]
  };
  render();
  renderPatientsTable();
};

if(new URLSearchParams(location.search).get('demo')==='1')$('demoButton').click();
