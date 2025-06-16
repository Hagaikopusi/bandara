document.addEventListener('DOMContentLoaded', () => {
    // Definisi elemen
    const promoForm = document.getElementById('promo-form');
    const titleInput = document.getElementById('title');
    const headerTextInput = document.getElementById('header-text');
    const captionInput = document.getElementById('caption');
    const durationInput = document.getElementById('duration');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    const logoutBtn = document.getElementById('logout-btn');
    const tenantWelcome = document.getElementById('tenant-welcome');
    const imageUpload = document.getElementById('image-upload');
    const imagePreview = document.getElementById('image-preview');
    const imagePreviewContainer = document.querySelector('.image-preview-container');
    const fileInputLabel = document.querySelector('.file-input-label span');
    const promoStatusList = document.getElementById('promo-status-list');
    
    let activeTimers = [];
    const loggedInTenant = localStorage.getItem('loggedInTenant');

    // Cek jika tenant sudah login
    if (!loggedInTenant) { 
        window.location.href = 'login.html'; // Arahkan ke login page yang benar jika belum login
        return; 
    }
    
    // Tampilkan nama tenant di topbar
    if (tenantWelcome) {
        // Mengubah format tampilan agar lebih ringkas
        tenantWelcome.textContent = `Tenant: ${loggedInTenant}`;
    }

    // Fungsi format waktu (tidak ada perubahan)
    function formatTime(totalSeconds) {
        if (totalSeconds < 0) totalSeconds = 0;
        const days = Math.floor(totalSeconds / 86400); totalSeconds %= 86400;
        const hours = Math.floor(totalSeconds / 3600); totalSeconds %= 3600;
        const minutes = Math.floor(totalSeconds / 60); const seconds = totalSeconds % 60;
        const pad = (num) => String(num).padStart(2, '0');
        let result = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        if (days > 0) { result = `${days} hari, ${result}`; }
        return result;
    }

    function displayCurrentDate() {
        // Fungsi ini mungkin tidak relevan lagi jika tanggal tidak ditampilkan di dasbor tenant
        const dateElement = document.getElementById('current-date');
        if (!dateElement) return;
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' };
        dateElement.textContent = now.toLocaleDateString('id-ID', options);
    }

    // =========================================================================
    // ↓↓↓ FUNGSI loadMyPromos YANG SUDAH DIPERBAIKI DENGAN KELAS BOOTSTRAP ↓↓↓
    // =========================================================================
    function loadMyPromos() {
        activeTimers.forEach(timer => clearInterval(timer));
        activeTimers = [];

        if (!promoStatusList) return;
        promoStatusList.innerHTML = '';
        // Ubah promoStatusList menjadi list-group
        promoStatusList.className = 'list-group list-group-flush';

        const pendingPromos = JSON.parse(localStorage.getItem('pendingPromos')) || [];
        const approvedPromos = JSON.parse(localStorage.getItem('approvedPromos')) || [];
        const rejectedPromos = JSON.parse(localStorage.getItem('rejectedPromos')) || [];
        const allPromos = [...pendingPromos, ...approvedPromos, ...rejectedPromos];
        const myPromos = allPromos.filter(promo => promo.tenant === loggedInTenant);

        if (myPromos.length === 0) {
            promoStatusList.innerHTML = '<p class="text-center text-muted">Anda belum pernah mengajukan promo.</p>';
            return;
        }

        myPromos.forEach(promo => {
            const listItem = document.createElement('div');
            // Menggunakan kelas list-group-item dari Bootstrap
            listItem.className = 'list-group-item';
            
            const submissionDate = new Date(promo.submissionTimestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            
            let statusBadge = '';
            let infoDetails = `<p class="mb-0 text-muted small">Diajukan: ${submissionDate}</p>`;
            let actionButton = '';

            if (promo.status === 'pending') {
                statusBadge = '<span class="badge badge-warning">Menunggu Persetujuan</span>';
            } else if (promo.status === 'rejected') {
                statusBadge = '<span class="badge badge-danger">Tidak Disetujui</span>';
                infoDetails += `<p class="mb-0 text-danger small"><strong>Alasan:</strong> ${promo.rejectionReason || 'Tidak ada alasan spesifik.'}</p>`;
                actionButton = `<button class="btn btn-sm btn-outline-primary revise-btn" data-promo-id="${promo.id}">Perbaiki</button>`;
            } else if (promo.status === 'approved') {
                const approvalDate = new Date(promo.approvalTimestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                infoDetails = `<p class="mb-0 text-muted small">Diajukan: ${submissionDate} | Disetujui: ${approvalDate}</p>`;
                
                const endTime = promo.approvalTimestamp + (Number(promo.duration) * 1000);
                if (Date.now() < endTime) {
                    statusBadge = `<span class="badge badge-success countdown" id="timer-${promo.id}">Memuat...</span>`;
                     const timer = setInterval(() => {
                         const now = Date.now();
                         const timeLeft = Math.round((endTime - now) / 1000);
                         const timerElement = document.getElementById(`timer-${promo.id}`);
                         if (timerElement) {
                             if (timeLeft > 0) {
                                 timerElement.textContent = `Aktif: ${formatTime(timeLeft)}`;
                             } else {
                                 timerElement.textContent = 'Selesai';
                                 timerElement.className = 'badge badge-secondary';
                                 clearInterval(timer);
                             }
                         } else { clearInterval(timer); }
                     }, 1000);
                     activeTimers.push(timer);
                } else {
                    statusBadge = '<span class="badge badge-secondary">Selesai</span>';
                }
            }

            // Menggabungkan semua elemen dengan layout flexbox dari Bootstrap
            listItem.innerHTML = `
            <div class="d-flex w-100 justify-content-between align-items-center">
                <div>
                    <h5 class="mb-1">${promo.title}</h5>
                    ${infoDetails}
                </div>
                <div class="text-right">
                    ${statusBadge}
                    <div class="mt-2">${actionButton}</div>
                </div>
            </div>`;

            promoStatusList.appendChild(listItem);
        });
        
        document.querySelectorAll('.revise-btn').forEach(button => {
            button.addEventListener('click', () => handleRevise(button.dataset.promoId));
        });
    }
    // =========================================================================
    // ↑↑↑ AKHIR DARI FUNGSI loadMyPromos YANG DIPERBAIKI ↑↑↑
    // =========================================================================

    function handleRevise(promoId) {
        let rejectedPromos = JSON.parse(localStorage.getItem('rejectedPromos')) || [];
        const promoToRevise = rejectedPromos.find(p => p.id === promoId);
        if (!promoToRevise) return;
        
        titleInput.value = promoToRevise.title;
        headerTextInput.value = promoToRevise.headerText;
        captionInput.value = promoToRevise.caption;
        durationInput.value = promoToRevise.duration;
        imagePreview.src = promoToRevise.imageData;
        imagePreviewContainer.style.display = 'block'; // Tampilkan preview
        imagePreview.style.display = 'block';
        if(fileInputLabel) fileInputLabel.textContent = 'Pilih ulang gambar (wajib)';
        
        const updatedRejectedPromos = rejectedPromos.filter(p => p.id !== promoId);
        localStorage.setItem('rejectedPromos', JSON.stringify(updatedRejectedPromos));
        loadMyPromos();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        alert("Data promo telah dimuat ke form. Silakan perbaiki dan kirim ulang. Anda wajib memilih ulang file gambar.");
    }

    if (imageUpload) {
        imageUpload.addEventListener('change', () => {
            const file = imageUpload.files[0];
            if (file) {
                if(imagePreviewContainer) imagePreviewContainer.style.display = 'block';
                if(imagePreview) {
                    imagePreview.src = URL.createObjectURL(file);
                    imagePreview.style.display = 'block';
                }
                if(fileInputLabel) fileInputLabel.textContent = file.name;
            }
        });
    }

    if (promoForm) {
        promoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if(successMessage) successMessage.style.display = 'none'; 
            if(errorMessage) errorMessage.style.display = 'none';

            const file = imageUpload.files[0]; 
            const duration = durationInput.value;

            if (!file || !titleInput.value || !headerTextInput.value || !captionInput.value || !duration) {
                if(errorMessage) {
                    errorMessage.textContent = 'Semua field, termasuk gambar dan durasi, harus diisi.';
                    errorMessage.style.display = 'block';
                }
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                const newPromo = {
                    id: `promo-${Date.now()}`, submissionTimestamp: Date.now(),
                    tenant: loggedInTenant, title: titleInput.value,
                    headerText: headerTextInput.value, caption: captionInput.value,
                    duration: duration, imageData: event.target.result, status: 'pending'
                };

                const pendingPromos = JSON.parse(localStorage.getItem('pendingPromos')) || [];
                pendingPromos.push(newPromo);
                localStorage.setItem('pendingPromos', JSON.stringify(pendingPromos));

                promoForm.reset(); 
                if(imagePreviewContainer) imagePreviewContainer.style.display = 'none';
                if(imagePreview) imagePreview.src = '#';
                if(fileInputLabel) fileInputLabel.textContent = 'Pilih file...';
                
                if(successMessage) {
                    successMessage.textContent = 'Promo berhasil dikirim dan sedang menunggu persetujuan admin.';
                    successMessage.style.display = 'block';
                }

                loadMyPromos(); 
                setTimeout(() => { if(successMessage) successMessage.style.display = 'none'; }, 4000);
            };
            reader.readAsDataURL(file);
        });
    }
    
    // =========================================================================
    // ↓↓↓ KODE LOGOUT YANG SUDAH DIPERBAIKI ↓↓↓
    // =========================================================================
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('loggedInTenant'); 
            // Mengarahkan ke halaman login yang benar
            window.location.href = 'login.html'; 
        });
    }
    // =========================================================================
    // ↑↑↑ AKHIR DARI KODE LOGOUT YANG DIPERBAIKI ↑↑↑
    // =========================================================================

    // Panggil fungsi-fungsi inisialisasi
    displayCurrentDate(); // Mungkin tidak terpakai tapi tidak masalah jika ada
    loadMyPromos();
});