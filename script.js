// Initialize Lucide Icons
lucide.createIcons();

// Set Current Date
const options = { weekday: 'long', month: 'short', day: 'numeric' };
const dateElement = document.getElementById('current-date');
if (dateElement) {
    dateElement.innerText = new Date().toLocaleDateString('en-US', options);
}

// Simple State Management
function markTaken(btn) {
    const card = btn.closest('.dose-card');
    btn.innerHTML = '<i data-lucide="check" class="w-4 h-4 mx-auto"></i>';
    btn.classList.remove('bg-primary', 'bg-slate-900');
    btn.classList.add('bg-green-500');
    card.style.borderColor = '#22c55e';
    lucide.createIcons();
    
    setTimeout(() => {
        alert('บันทึกการกินยาเรียบร้อยแล้ว!');
    }, 100);
}

// Configure Tailwind
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#EA205E',
                secondary: '#F1F5F9',
                foreground: '#0F172A',
                muted: '#64748B',
                border: '#E2E8F0',
            }
        }
    }
}
