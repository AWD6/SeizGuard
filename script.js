// ฟังก์ชันสลับหน้า Tab
function switchTab(tab) {
    // ซ่อนทุก Section
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // ลบ class active จากทุกปุ่ม
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // แสดง Section ที่เลือก
    if (tab === 'today') {
        document.getElementById('dashboardSection').style.display = 'block';
    } else if (tab === 'learn') {
        document.getElementById('learnSection').style.display = 'block';
    }

    // ใส่ active ให้ปุ่มที่กด
    event.currentTarget.classList.add('active');
}

// ระบบ Login จำลอง
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    alert('เข้าสู่ระบบ SeizGuard สำเร็จ!');
});

// ฟังก์ชันช่วยตัดสินใจ "ลืมกินยา"
function checkMissedDose(choice) {
    if (choice === 'now') {
        alert("คำแนะนำทางการแพทย์: \nหากนึกได้ไม่นาน ให้ทานทันที 1 เม็ด และทานมื้อต่อไปตามปกติ (ห้ามทานเบิ้ล 2 เท่า)");
    } else {
        alert("คำแนะนำทางการแพทย์: \nหากใกล้ถึงเวลามื้อถัดไปแล้ว ให้ข้ามมื้อที่ลืมไปเลย และเริ่มทานใหม่มื้อหน้าในขนาดยาปกติ");
    }
}

// Modal Log Event
function openLogEvent() {
    document.getElementById('logModal').style.display = 'flex';
}

function closeLogEvent() {
    const symptom = document.getElementById('symptom').value;
    if(symptom !== 'none') {
        alert('บันทึกข้อมูลอาการ ' + symptom + ' เรียบร้อยแล้ว ข้อมูลจะถูกส่งไปยังพยาบาลเจ้าของไข้');
    }
    document.getElementById('logModal').style.display = 'none';
}

// แสดงวันที่ปัจจุบันที่ Header
const d = new Date();
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
document.getElementById('headerDate').innerHTML = days[d.getDay()] + ", " + months[d.getMonth()] + " " + d.getDate();
