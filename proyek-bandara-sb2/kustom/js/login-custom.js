document.addEventListener('DOMContentLoaded', () => {
    // Definisi elemen-elemen dari halaman login.html
    const adminBtn = document.getElementById('admin-btn');
    const tenantBtn = document.getElementById('tenant-btn');
    const roleInput = document.getElementById('role-input');
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const passwordInput = document.getElementById('password');
    // Di template SB Admin 2, tidak ada toggle password default, jadi kita lewati elemen ini.
    // Jika Anda menambahkannya secara manual, pastikan ID-nya sesuai.
    // const togglePassword = document.getElementById('toggle-password');

    // Fungsi untuk mengganti peran (role) antara Admin dan Tenant
    function switchRole(activeBtn, inactiveBtn, role) {
        activeBtn.classList.add('active');
        inactiveBtn.classList.remove('active');
        roleInput.value = role;
    }

    // Event listener untuk tombol Admin
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            switchRole(adminBtn, tenantBtn, 'admin');
        });
    }

    // Event listener untuk tombol Tenant
    if (tenantBtn) {
        tenantBtn.addEventListener('click', () => {
            switchRole(tenantBtn, adminBtn, 'tenant');
        });
    }

    /* // Bagian ini bisa diaktifkan jika Anda menambahkan ikon mata untuk toggle password
    // dengan id="toggle-password" di HTML Anda.
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
        });
    }
    */

    // Event listener utama saat form login disubmit
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Mencegah form mengirim data secara default

            // Sembunyikan pesan error setiap kali mencoba login
            if (errorMessage) {
                errorMessage.style.display = 'none';
                errorMessage.textContent = '';
            }

            const username = loginForm.username.value.trim();
            const password = loginForm.password.value.trim();
            const role = loginForm.role.value;

            // Validasi input tidak boleh kosong
            if (username === '' || password === '') {
                if (errorMessage) {
                    errorMessage.textContent = 'Username dan Password tidak boleh kosong.';
                    errorMessage.style.display = 'block';
                }
                return;
            }
            
            let loginSuccess = false;
            let redirectUrl = '';

            // Logika pengecekan login untuk Admin
            if (role === 'admin') {
                if (username === 'admin' && password === 'admin123') {
                    loginSuccess = true;
                    // URL redirect sudah disesuaikan dengan file baru
                    redirectUrl = 'dashboard_admin.html';
                }
            } 
            // Logika pengecekan login untuk Tenant
            else if (role === 'tenant') {
                // Contoh data login tenant, bisa lebih dari satu
                if (username === 'tenant' && password === 'tenant123') {
                    loginSuccess = true;
                    // Simpan nama tenant yang login ke localStorage agar bisa ditampilkan di dasbor
                    localStorage.setItem('loggedInTenant', username); 
                    // URL redirect sudah disesuaikan dengan file baru
                    redirectUrl = 'dashboard_tenant.html'; 
                }
            }

            // Jika login berhasil
            if (loginSuccess) {
                alert(`Login berhasil sebagai ${role}!`);
                window.location.href = redirectUrl; // Arahkan ke halaman dasbor yang sesuai
            } 
            // Jika login gagal
            else {
                if (errorMessage) {
                    errorMessage.textContent = 'Username atau Password salah. Silakan coba lagi.';
                    errorMessage.style.display = 'block';
                }
            }
        });
    }
});