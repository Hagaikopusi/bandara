document.addEventListener('DOMContentLoaded', () => {
    // Definisi Elemen
    const swiperWrapper = document.querySelector('.swiper-container-3d .swiper-wrapper');
    const backgroundElement = document.querySelector('.dynamic-background');
    const titleElement = document.querySelector('.dynamic-slide-title');
    const headerTitleElement = document.getElementById('header-slide-title');
    const footerClockElement = document.getElementById('footer-clock');
    const footerDateElement = document.getElementById('footer-date');
    const loginContainer = document.getElementById('loginContainer');
    const loginCountdownText = document.getElementById('login-countdown-text');
    const loginBtn = loginContainer.querySelector('.login-btn');
    
    let swiperInstance = null;
    
    // PERUBAHAN: Data default sekarang ada 4 item
    const defaultPromos = [
        {
            title: "Diskon Fashion Terkini",
            headerText: "Selamat Datang di Kualanamu",
            caption: "Diskon Fashion Terkini",
            imageUrl: "https://dynamic.zacdn.com/zd_obbCvq4eiFVTGOFWIKUGMsmg=/filters:quality(70):format(webp)/https://static-id.zacdn.com/p/ralph-lauren-8086-5814073-4.jpg"
        },
        {
            title: "Sajian Kuliner Terbaik",
            headerText: "Nikmati Sajian Kuliner Terbaik",
            caption: "Diskon 50% The Fresh Food Home",
            imageUrl: "https://marketplace.canva.com/EAGOTUz7UJ4/2/0/900w/canva-oranye-%26-kuning-minimalis-promosi-makanan-batagor-cerita-instagram-M-Q0PDZi7Qg.jpg"
        },
        {
            title: "A&W Super Deals",
            headerText: "Promo Spesial A&W",
            caption: "Diskon 20% Minuman A&W",
            imageUrl: "https://www.awrestaurants.co.id/assets/images/promo/14B.jpeg"
        },
        {
            title: "Liceria & Co.",
            headerText: "Kopi & Kue Spesial",
            caption: "Beli 1 Gratis 1",
            imageUrl: "https://template.canva.com/EAFzzzdVx_U/1/0/450w-rLxQ8u_F9eg.jpg"
        }
    ];

    function checkExpiredPromos() {
        let approvedPromos = JSON.parse(localStorage.getItem('approvedPromos')) || [];
        if (approvedPromos.length === 0) return;

        const now = Date.now();
        let promosChanged = false;

        const activePromos = approvedPromos.filter(promo => {
            if (!promo.approvalTimestamp || !promo.duration) return true;
            const endTime = promo.approvalTimestamp + (Number(promo.duration) * 1000);
            return now < endTime;
        });

        if (activePromos.length !== approvedPromos.length) {
            promosChanged = true;
            localStorage.setItem('approvedPromos', JSON.stringify(activePromos));
        }

        if (promosChanged) {
            loadSlidesAndInitSwiper();
        }
    }

    // FUNGSI LOAD SLIDES DIPERBARUI TOTAL DENGAN LOGIKA BARU
    function loadSlidesAndInitSwiper() {
        if (swiperInstance) {
            swiperInstance.destroy(true, true);
            swiperInstance = null;
        }

        const approvedPromos = JSON.parse(localStorage.getItem('approvedPromos')) || [];
        let promosToDisplay = [];

        // Logika untuk menentukan slide yang akan ditampilkan
        if (approvedPromos.length >= 4) {
            // Jika promo yang disetujui ada 4 atau lebih, tampilkan semuanya
            promosToDisplay = approvedPromos;
        } else if (approvedPromos.length > 0) {
            // Jika ada 1-3 promo disetujui, gabungkan dengan promo default
            const neededDefaults = 4 - approvedPromos.length;
            promosToDisplay = [
                ...approvedPromos,
                ...defaultPromos.slice(0, neededDefaults)
            ];
        } else {
            // Jika tidak ada promo disetujui, tampilkan semua promo default
            promosToDisplay = defaultPromos;
        }

        swiperWrapper.innerHTML = '';
        promosToDisplay.forEach(promo => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            slide.dataset.title = promo.title;
            slide.dataset.headerText = promo.headerText; 
            // Gunakan imageData jika ada (dari upload), jika tidak gunakan imageUrl (dari default)
            const imageUrl = promo.imageData || promo.imageUrl;
            
            slide.innerHTML = `
                <a href="#" aria-label="Lihat promo ${promo.title}">
                    <img src="${imageUrl}" alt="Banner Promosi">
                    <div class="slide-caption">${promo.caption}</div>
                </a>
            `;
            swiperWrapper.appendChild(slide);
        });
        
        swiperInstance = new Swiper('.swiper-container-3d', {
            effect: 'coverflow',
            grabCursor: true,
            centeredSlides: true,
            loop: promosToDisplay.length > 1,
            slidesPerView: 'auto',
            autoplay: {
                delay: 3500,
                disableOnInteraction: false,
            },
            coverflowEffect: {
                rotate: 20, stretch: 0, depth: 100, modifier: 1.2, slideShadows: true,
            },
            on: {
                init: function(swiper) { updateContent(swiper); },
                slideChange: function(swiper) { updateContent(swiper); },
            },
        });
    }

    function updateContent(swiper) {
        if (!swiper.slides || swiper.slides.length === 0 || !swiper.slides[swiper.realIndex]) {
            backgroundElement.style.backgroundImage = `url(${defaultPromos[0].imageUrl})`;
            titleElement.textContent = 'Selamat Datang';
            headerTitleElement.textContent = 'Info Terkini';
            return;
        }
        const activeSlide = swiper.slides[swiper.realIndex];
        
        const newMainTitle = activeSlide.dataset.title || '';
        const newHeaderText = activeSlide.dataset.headerText || 'Info Terkini';

        if (titleElement.textContent !== newMainTitle) {
            titleElement.classList.add('title-is-changing');
            setTimeout(() => {
                titleElement.textContent = newMainTitle;
                titleElement.classList.remove('title-is-changing');
                titleElement.style.animation = 'fadeInDown 0.6s both';
            }, 300);
            titleElement.style.animation = 'none';
        }
        
        if (headerTitleElement && headerTitleElement.textContent !== newHeaderText) {
            headerTitleElement.classList.add('title-is-changing');
            setTimeout(() => {
                headerTitleElement.textContent = newHeaderText;
                headerTitleElement.classList.remove('title-is-changing');
            }, 300);
        }
        
        const imageElement = activeSlide.querySelector('img');
        if (imageElement) {
            backgroundElement.style.backgroundImage = `url(${imageElement.src})`;
        }
    }

    function startLoginCountdown() {
        if (!loginCountdownText || !loginBtn) return;
        let countdownSeconds = 10;
        loginBtn.style.display = 'none';
        loginContainer.classList.add('visible');
        loginCountdownText.textContent = `Tombol login muncul dalam ${countdownSeconds} detik...`;
        const countdownInterval = setInterval(() => {
            countdownSeconds--;
            if (countdownSeconds > 0) {
                loginCountdownText.textContent = `Tombol login muncul dalam ${countdownSeconds} detik...`;
            } else {
                clearInterval(countdownInterval);
                loginCountdownText.style.display = 'none';
                loginBtn.style.display = 'flex';
            }
        }, 1000);
    }
    
    startLoginCountdown();

    function updateDateTime() {
        const now = new Date();
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' };
        footerDateElement.textContent = now.toLocaleDateString('id-ID', dateOptions);
        footerClockElement.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta' });
    }

    updateDateTime();
    setInterval(updateDateTime, 1000);

    loadSlidesAndInitSwiper();
    setInterval(checkExpiredPromos, 1000);
});