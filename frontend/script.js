// 1. SUPABASE BAĞLANTISI (Kendi bilgilerinizi yapıştırın)
const SUPABASE_URL = "https://nphcswznuhwshlhqkdiw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_NyfEJDu8OMrkshPFEOCIhg_oahFTAbJ";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. B2B Form Alanlarını Açma / Kapatma
function toggleB2BFields() {
    const isChecked = document.getElementById("isB2bCheck").checked;
    document.getElementById("b2bFields").style.display = isChecked ? "block" : "none";
}

// 3. KAYIT OLMA İŞLEMİ
document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("regFullName").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const isB2B = document.getElementById("isB2bCheck").checked;

    // Rol Belirleme: B2B ise 'B2B_PENDING', değilse 'CUSTOMER'
    const role = isB2B ? "B2B_PENDING" : "CUSTOMER";

    // B2B Ek Bilgileri
    const b2bData = isB2B ? {
        company_name: document.getElementById("regCompanyName").value,
        tax_office: document.getElementById("regTaxOffice").value,
        tax_number: document.getElementById("regTaxNumber").value,
        phone: document.getElementById("regPhone").value
    } : null;

    // Supabase Auth İle Kayıt
    const { data, error } = await _supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: fullName,
                role: role,
                b2b_details: b2bData
            }
        }
    });

    if (error) {
        alert("Kayıt Hatası: " + error.message);
    } else {
        alert(isB2B 
            ? "B2B Başvurunuz başarıyla alındı! Yönetici onayından sonra toptan fiyatlara erişebilirsiniz." 
            : "Kayıt başarılı! Giriş yapabilirsiniz."
        );
    }
});

// GİRİŞ SONRASI ROL KONTROLÜ VE ADMIN PANELİNİ AÇMA
async function checkUserRoleAndInit() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    // Kullanıcının profil bilgilerini çek
    const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) return console.error(error);

    // Eğer kullanıcı ADMIN ise Yönetim Panelini Göster
    if (profile.role === 'ADMIN') {
        document.getElementById('adminPanelSection').style.display = 'block';
        loadPendingB2BApplications(); // Başvuruları yükle
        listenRealtimeB2BRequests();   // Anlık yeni başvuruları dinle
    }
}

// BEKLEYEN B2B BAŞVURULARINI LİSTELEME
async function loadPendingB2BApplications() {
    const { data: pendingUsers, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('role', 'B2B_PENDING');

    if (error) {
        alert("Başvurular yüklenirken hata oluştu: " + error.message);
        return;
    }

    const tableBody = document.getElementById('b2bApplicationsTable');
    tableBody.innerHTML = '';

    if (pendingUsers.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Bekleyen B2B başvurusu bulunmuyor.</td></tr>`;
        return;
    }

    pendingUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.full_name || '-'}</td>
            <td>${user.company_name || '-'}</td>
            <td>${user.tax_office || '-'} / ${user.tax_number || '-'}</td>
            <td>${user.phone || '-'}</td>
            <td>
                <button onclick="approveB2B('${user.id}')" style="background: green; color: white; padding: 5px 10px; cursor: pointer;">Onayla</button>
                <button onclick="rejectB2B('${user.id}')" style="background: red; color: white; padding: 5px 10px; cursor: pointer;">Reddet</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// B2B ONAYLAMA İŞLEMİ (Supabase RPC Çağrısı)
async function approveB2B(userId) {
    const { error } = await supabaseClient.rpc('approve_b2b_user', { target_user_id: userId });
    if (error) {
        alert("Onay hatası: " + error.message);
    } else {
        alert("B2B Başvurusu Onaylandı!");
        loadPendingB2BApplications(); // Listeyi yenile
    }
}

// B2B REDDETME İŞLEMİ
async function rejectB2B(userId) {
    const { error } = await supabaseClient.rpc('reject_b2b_user', { target_user_id: userId });
    if (error) {
        alert("Hata: " + error.message);
    } else {
        alert("Başvuru reddedildi.");
        loadPendingB2BApplications(); // Listeyi yenile
    }
}

// REALTIME (ANLIK) DİNLEYİCİ: Yeni başvuru geldiğinde sayfayı yenilemeden tabloya düşer
function listenRealtimeB2BRequests() {
    supabaseClient
        .channel('public:profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
            loadPendingB2BApplications();
        })
        .subscribe();
}

// 4. GİRİŞ YAPMA İŞLEMİ
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const { data, error } = await _supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert("Giriş Hatası: " + error.message);
        return;
    }

    const user = data.user;
    const userRole = user.user_metadata.role;

    alert(`Giriş Başarılı! Hoş geldiniz, ${user.user_metadata.full_name}`);

    // B2B Durumuna Göre Arayüz Kontrolü
    if (userRole === "B2B_PENDING") {
        alert("B2B Hesabınız henüz admin onayındadır. Şu an perakende fiyatları görebilirsiniz.");
    } else if (userRole === "B2B_APPROVED") {
        alert("Toptan B2B Fiyat Modu Aktif!");
        // Burada sitedeki fiyatları toptan fiyata çeviren fonksiyonu çağıracağız
    }
});