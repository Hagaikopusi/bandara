document.addEventListener('DOMContentLoaded', () => {
    // Definisi Elemen
    const pendingList = document.getElementById('pending-list');
    const approvedList = document.getElementById('approved-list');
    const logoutBtn = document.getElementById('logout-btn');
    const logTableBody = document.getElementById('log-table-body');
    const downloadLogBtn = document.getElementById('download-log-btn');
    
    // Elemen Paginasi Log
    const logPaginationContainer = document.getElementById('log-pagination');
    const logPrevBtn = document.getElementById('log-prev-btn');
    const logNextBtn = document.getElementById('log-next-btn');
    const logPageInput = document.getElementById('log-page-input');
    const logTotalPagesSpan = document.getElementById('log-total-pages');
    
    // Elemen Paginasi Promo Disetujui
    const approvedPaginationContainer = document.getElementById('approved-pagination');
    const approvedPrevBtn = document.getElementById('approved-prev-btn');
    const approvedNextBtn = document.getElementById('approved-next-btn');
    const approvedPageInfo = document.getElementById('approved-page-info');
    
    // Elemen Paginasi Promo Tertunda
    const pendingPaginationContainer = document.getElementById('pending-pagination');
    const pendingPrevBtn = document.getElementById('pending-prev-btn');
    const pendingNextBtn = document.getElementById('pending-next-btn');
    const pendingPageInfo = document.getElementById('pending-page-info');

    // Elemen Filter
    const searchInput = document.getElementById('log-search-input');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const resetFilterBtn = document.getElementById('reset-filter-btn');
    
    // State
    let logCurrentPage = 1;
    const logRowsPerPage = 4;
    let approvedCurrentPage = 1;
    const approvedItemsPerPage = 3;
    let pendingCurrentPage = 1;
    const pendingItemsPerPage = 3;
    let searchTerm = '';
    let startDate = null;
    let endDate = null;
    let activeTimers = [];

    // --- FUNGSI PROMO & LAINNYA ---
    function displayCurrentDate() {
        const dateElement = document.getElementById('current-date');
        if (!dateElement) return;
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' };
        dateElement.textContent = now.toLocaleDateString('id-ID', options);
    }

    function loadPromos() {
        activeTimers.forEach(timer => clearInterval(timer));
        activeTimers = [];

        if(pendingList) pendingList.innerHTML = '';
        if(approvedList) approvedList.innerHTML = '';

        const pendingPromos = JSON.parse(localStorage.getItem('pendingPromos')) || [];
        const approvedPromos = JSON.parse(localStorage.getItem('approvedPromos')) || [];

        // PAGINASI UNTUK PROMO TERTUNDA
        if (pendingPromos.length === 0) {
            if(pendingList) pendingList.innerHTML = '<div class="col-12"><p class="empty-message text-center">Tidak ada promo yang menunggu persetujuan.</p></div>';
        } else {
            const start = (pendingCurrentPage - 1) * pendingItemsPerPage;
            const end = start + pendingItemsPerPage;
            const paginatedPending = pendingPromos.slice(start, end);

            paginatedPending.forEach(promo => {
                const promoCard = createPromoCard(promo, 'pending');
                if(pendingList) pendingList.appendChild(promoCard);
            });
        }
        setupPendingPagination(pendingPromos.length);

        // PAGINASI UNTUK PROMO DISETUJUI
        if (approvedPromos.length === 0) {
            if(approvedList) approvedList.innerHTML = '<div class="col-12"><p class="empty-message text-center">Belum ada promo yang disetujui.</p></div>';
        } else {
            const start = (approvedCurrentPage - 1) * approvedItemsPerPage;
            const end = start + approvedItemsPerPage;
            const paginatedApproved = approvedPromos.slice(start, end);

            paginatedApproved.forEach(promo => {
                const promoCard = createPromoCard(promo, 'approved');
                if(approvedList) approvedList.appendChild(promoCard);
                if (promo.status === 'approved') {
                    startAdminCountdown(promo);
                }
            });
        }
        setupApprovedPagination(approvedPromos.length);
    }

    function setupPendingPagination(totalItems) {
        if (!pendingPaginationContainer) return;
        const totalPages = Math.ceil(totalItems / pendingItemsPerPage);

        if (totalPages <= 1) {
            pendingPaginationContainer.style.display = 'none';
        } else {
            pendingPaginationContainer.style.display = 'flex';
            pendingPageInfo.textContent = `Halaman ${pendingCurrentPage} dari ${totalPages}`;
            pendingPrevBtn.disabled = pendingCurrentPage === 1;
            pendingNextBtn.disabled = pendingCurrentPage === totalPages;
        }
    }

    function setupApprovedPagination(totalItems) {
        if (!approvedPaginationContainer) return;
        const totalPages = Math.ceil(totalItems / approvedItemsPerPage);

        if (totalPages <= 1) {
            approvedPaginationContainer.style.display = 'none';
        } else {
            approvedPaginationContainer.style.display = 'flex';
            approvedPageInfo.textContent = `Halaman ${approvedCurrentPage} dari ${totalPages}`;
            approvedPrevBtn.disabled = approvedCurrentPage === 1;
            approvedNextBtn.disabled = approvedCurrentPage === totalPages;
        }
    }
    
    // --- EVENT LISTENERS ---
    if(pendingPrevBtn) pendingPrevBtn.addEventListener('click', () => {
        if (pendingCurrentPage > 1) {
            pendingCurrentPage--;
            loadPromos();
        }
    });

    if(pendingNextBtn) pendingNextBtn.addEventListener('click', () => {
        const pendingPromos = JSON.parse(localStorage.getItem('pendingPromos')) || [];
        const totalPages = Math.ceil(pendingPromos.length / pendingItemsPerPage);
        if (pendingCurrentPage < totalPages) {
            pendingCurrentPage++;
            loadPromos();
        }
    });

    if(approvedPrevBtn) approvedPrevBtn.addEventListener('click', () => {
        if (approvedCurrentPage > 1) {
            approvedCurrentPage--;
            loadPromos();
        }
    });

    if(approvedNextBtn) approvedNextBtn.addEventListener('click', () => {
        const approvedPromos = JSON.parse(localStorage.getItem('approvedPromos')) || [];
        const totalPages = Math.ceil(approvedPromos.length / approvedItemsPerPage);
        if (approvedCurrentPage < totalPages) {
            approvedCurrentPage++;
            loadPromos();
        }
    });

    function approvePromo(id) {
        let pendingPromos = JSON.parse(localStorage.getItem('pendingPromos')) || [];
        let approvedPromos = JSON.parse(localStorage.getItem('approvedPromos')) || [];
        const promoToApprove = pendingPromos.find(p => p.id === id);

        if (promoToApprove) {
            promoToApprove.status = 'approved';
            promoToApprove.approvalTimestamp = Date.now();
            approvedPromos.push(promoToApprove);
            logAction('Disetujui', promoToApprove);

            pendingPromos = pendingPromos.filter(p => p.id !== id);
            localStorage.setItem('pendingPromos', JSON.stringify(pendingPromos));
            localStorage.setItem('approvedPromos', JSON.stringify(approvedPromos));

            const totalPagesAfter = Math.ceil(pendingPromos.length / pendingItemsPerPage);
            if(pendingCurrentPage > totalPagesAfter && totalPagesAfter > 0) {
                pendingCurrentPage = totalPagesAfter;
            }

            approvedCurrentPage = Math.ceil(approvedPromos.length / approvedItemsPerPage) || 1;
            loadPromos();
            logCurrentPage = 1;
            loadActivityLog();
        }
    }

    function rejectPromo(id) {
        const reason = prompt("Silakan masukkan alasan penolakan promo ini:");
        if (reason === null || reason.trim() === "") { alert("Penolakan dibatalkan karena tidak ada alasan yang diberikan."); return; }
        
        let pendingPromos = JSON.parse(localStorage.getItem('pendingPromos')) || [];
        let rejectedPromos = JSON.parse(localStorage.getItem('rejectedPromos')) || [];
        const promoToReject = pendingPromos.find(p => p.id === id);

        if (promoToReject) {
            promoToReject.status = 'rejected';
            promoToReject.rejectionReason = reason; 
            rejectedPromos.push(promoToReject);
            
            pendingPromos = pendingPromos.filter(p => p.id !== id);
            localStorage.setItem('pendingPromos', JSON.stringify(pendingPromos));
            localStorage.setItem('rejectedPromos', JSON.stringify(rejectedPromos));

            const totalPagesAfter = Math.ceil(pendingPromos.length / pendingItemsPerPage);
            if(pendingCurrentPage > totalPagesAfter && totalPagesAfter > 0) {
                pendingCurrentPage = totalPagesAfter;
            }
            loadPromos();
        }
    }
    
    function deleteApprovedPromo(promoId) {
        if (!confirm('Anda yakin ingin menghapus promo yang sudah disetujui ini? Aksi ini akan langsung menghilangkannya dari landing page.')) return;
        
        let approvedPromos = JSON.parse(localStorage.getItem('approvedPromos')) || [];
        const updatedApproved = approvedPromos.filter(promo => promo.id !== promoId);
        localStorage.setItem('approvedPromos', JSON.stringify(updatedApproved));
        
        const totalPagesAfter = Math.ceil(updatedApproved.length / approvedItemsPerPage);
        if (approvedCurrentPage > totalPagesAfter && totalPagesAfter > 0) {
            approvedCurrentPage = totalPagesAfter;
        }
        loadPromos();
    }

    function logAction(action, promo) {
        const logEntry = {
            timestamp: Date.now(), action: action, promoTitle: promo.title,
            tenant: promo.tenant, duration: promo.duration
        };
        const actionLog = JSON.parse(localStorage.getItem('actionLog')) || [];
        actionLog.push(logEntry);
        localStorage.setItem('actionLog', JSON.stringify(actionLog));
    }

    function loadActivityLog() {
        if (!logTableBody) return;
        let actionLog = JSON.parse(localStorage.getItem('actionLog')) || [];
        if (startDate) actionLog = actionLog.filter(log => log.timestamp >= startDate.getTime());
        if (endDate) { const endOfDay = new Date(endDate); endOfDay.setHours(23, 59, 59, 999); actionLog = actionLog.filter(log => log.timestamp <= endOfDay.getTime()); }
        if (searchTerm) actionLog = actionLog.filter(log => log.promoTitle.toLowerCase().includes(searchTerm) || log.tenant.toLowerCase().includes(searchTerm));
        
        const reversedLog = actionLog.slice().reverse();
        logTableBody.innerHTML = '';
        const start = (logCurrentPage - 1) * logRowsPerPage;
        const end = start + logRowsPerPage;
        const paginatedItems = reversedLog.slice(start, end);

        paginatedItems.forEach(log => {
            const row = document.createElement('tr');
            const date = new Date(log.timestamp).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            row.innerHTML = `<td>${date}</td><td class="text-success font-weight-bold">${log.action}</td><td>${log.promoTitle}</td><td>${log.tenant}</td><td>${formatDisplayDuration(log.duration)}</td><td><button class="btn btn-sm btn-outline-danger log-delete-btn" data-timestamp="${log.timestamp}" title="Hapus log ini"><i class="fa-solid fa-trash-can"></i></button></td>`;
            logTableBody.appendChild(row);
        });
        setupLogPaginationControls(actionLog.length);
    }

    function setupLogPaginationControls(totalItems) {
        if (!logPaginationContainer) return;
        const totalPages = Math.ceil(totalItems / logRowsPerPage);
        if (totalPages <= 1) { logPaginationContainer.style.display = 'none'; } 
        else {
            logPaginationContainer.style.display = 'flex';
            logPageInput.value = logCurrentPage; 
            logTotalPagesSpan.textContent = totalPages; 
            logPageInput.max = totalPages;
            logPrevBtn.disabled = logCurrentPage === 1; 
            logNextBtn.disabled = logCurrentPage === totalPages;
        }
    }
    
    // Sisa event listener dan fungsi helper...
    // (Kode untuk download CSV, delete log, dll. tetap sama)

    // =========================================================================
    // ↓↓↓ KODE FUNGSI createPromoCard YANG SUDAH DIPERBAIKI ↓↓↓
    // =========================================================================
    function createPromoCard(promo, type) {
        // Kita membuat elemen kolom Bootstrap sebagai pembungkus utama
        const col = document.createElement('div');
        col.className = 'col-xl-4 col-md-6 mb-4'; // Kelas grid dari Bootstrap

        const imageUrl = promo.imageData || promo.imageUrl || 'https://via.placeholder.com/300x180.png?text=No+Image';
        const submissionDate = promo.submissionTimestamp ? new Date(promo.submissionTimestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
        let approvalDateHTML = '';
        if (promo.approvalTimestamp) {
            const approvalDate = new Date(promo.approvalTimestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            approvalDateHTML = `<p class="card-text mb-1"><small><strong>Tgl. Disetujui:</strong> ${approvalDate}</small></p>`;
        }
        
        let actionBlock = '';
        if (type === 'pending') {
            actionBlock = `<div class="d-flex justify-content-between">
                            <button class="btn btn-success btn-sm approve-btn">Setujui</button>
                            <button class="btn btn-danger btn-sm reject-btn">Tolak</button>
                           </div>`;
        } else {
            actionBlock = `<div class="d-flex justify-content-between align-items-center">
                            <div class="status-tag-admin" id="timer-admin-${promo.id}">Memuat status...</div>
                            <button class="log-delete-btn btn btn-sm btn-outline-danger" data-id="${promo.id}" title="Hapus promo ini"><i class="fa-solid fa-trash-can"></i></button>
                           </div>`;
        }

        col.innerHTML = `
        <div class="card h-100">
            <img src="${imageUrl}" class="card-img-top" style="height: 320px; object-fit: cover;" alt="Gambar Promo">
            <div class="card-body">
                <h5 class="card-title font-weight-bold">${promo.title || 'Judul Tidak Tersedia'}</h5>
                <p class="card-text mb-1"><small><strong>Pengajuan:</strong> ${submissionDate}</small></p>
                ${approvalDateHTML}
                <p class="card-text mb-1"><small><strong>Header:</strong> ${promo.headerText || 'N/A'}</small></p>
                <p class="card-text mb-1"><small><strong>Caption:</strong> ${promo.caption || 'N/A'}</small></p>
                <p class="card-text mb-1"><small><strong>Durasi:</strong> ${formatDisplayDuration(promo.duration)}</small></p>
                <p class="card-text"><small><strong>Tenant:</strong> ${promo.tenant || 'N/A'}</small></p>
            </div>
            <div class="card-footer">
                ${actionBlock}
            </div>
        </div>`;
        
        if (type === 'pending') {
            col.querySelector('.approve-btn').addEventListener('click', () => approvePromo(promo.id));
            col.querySelector('.reject-btn').addEventListener('click', () => rejectPromo(promo.id));
        }
        
        if (type === 'approved' && approvedList) {
             const deleteButton = col.querySelector('.log-delete-btn');
             if(deleteButton) {
                deleteButton.addEventListener('click', () => deleteApprovedPromo(promo.id));
             }
        }

        return col;
    }
    // =========================================================================
    // ↑↑↑ AKHIR DARI FUNGSI createPromoCard YANG DIPERBAIKI ↑↑↑
    // =========================================================================

    // Fungsi helper lainnya...
    function formatDisplayDuration(seconds) {
        const durationInSeconds = Number(seconds);
        switch (durationInSeconds) {
            case 3600: return "1 Jam";
            case 2592000: return "1 Bulan";
            case 7776000: return "3 Bulan";
            case 15552000: return "6 Bulan";
            case 31536000: return "1 Tahun";
            default: return `${seconds || 'N/A'} detik`;
        }
    }
    
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

    function startAdminCountdown(promo) {
        const timerElement = document.getElementById(`timer-admin-${promo.id}`);
        if (!timerElement) return;
        const endTime = promo.approvalTimestamp + (Number(promo.duration) * 1000);
        if (Date.now() >= endTime) {
            timerElement.textContent = 'Selesai';
            timerElement.className = 'status-tag-admin expired';
            return;
        }
        timerElement.className = 'status-tag-admin countdown';
        const timer = setInterval(() => {
            const now = Date.now();
            const timeLeft = Math.round((endTime - now) / 1000);
            if (timeLeft > 0) {
                timerElement.textContent = `Aktif: ${formatTime(timeLeft)}`;
            } else {
                timerElement.textContent = 'Selesai';
                timerElement.classList.remove('countdown');
                timerElement.classList.add('expired');
                clearInterval(timer);
            }
        }, 1000);
        activeTimers.push(timer);
    }

    // =========================================================================
    // ↓↓↓ KODE LOGOUT YANG SUDAH DIPERBAIKI ↓↓↓
    // =========================================================================
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => { 
            // Mengarahkan ke halaman login yang benar
            window.location.href = 'login.html'; 
        });
    }
    // =========================================================================
    // ↑↑↑ AKHIR DARI KODE LOGOUT YANG DIPERBAIKI ↑↑↑
    // =========================================================================
    
    // Inisialisasi awal
    displayCurrentDate();
    loadPromos();
    loadActivityLog();
});