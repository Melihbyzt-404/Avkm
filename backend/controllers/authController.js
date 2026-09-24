const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Veritabanı bağlanana kadar geçici kullanıcı deposu
const usersDB = [];

// 1. KAYIT OL (B2C Müşteri veya B2B Başvurusu)
exports.register = async (req, res) => {
    try {
        const { fullName, email, password, isB2bRequest, companyName, taxOffice, taxNumber, phone } = req.body;

        // Kullanıcı var mı kontrolü
        const existingUser = usersDB.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ message: 'Bu e-posta adresi zaten kayıtlı.' });
        }

        // Şifre Hashleme
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // B2B Başvurusu ise B2B_PENDING, normal müşteri ise CUSTOMER rolü atanır
        const userRole = isB2bRequest ? 'B2B_PENDING' : 'CUSTOMER';

        const newUser = {
            id: Date.now().toString(),
            fullName,
            email,
            password: hashedPassword,
            role: userRole,
            b2bDetails: isB2bRequest ? { companyName, taxOffice, taxNumber, phone } : null
        };

        usersDB.push(newUser);

        res.status(201).json({
            success: true,
            message: isB2bRequest 
                ? 'B2B Toptan üyelik başvurunuz alındı. Yönetici onayından sonra giriş yapabilirsiniz.'
                : 'Kayıt başarılı! Giriş yapabilirsiniz.'
        });
    } catch (error) {
        res.status(500).json({ message: 'Kayıt işlemi sırasında hata oluştu.' });
    }
};

// 2. GİRİŞ YAP
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = usersDB.find(u => u.email === email);
        if (!user) {
            return res.status(400).json({ message: 'E-posta veya şifre hatalı.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'E-posta veya şifre hatalı.' });
        }

        // B2B Hesabı henüz onaylanmamışsa engelleme opsiyonu:
        if (user.role === 'B2B_PENDING') {
            return res.status(403).json({ message: 'B2B başvurunuz henüz onay aşamasındadır.' });
        }

        // Token Oluşturma
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Giriş işlemi sırasında hata oluştu.' });
    }
};

// 3. MEVCUT KULLANICI BİLGİSİNİ GETİRME
exports.getMe = async (req, res) => {
    const user = usersDB.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

    res.status(200).json({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        b2bDetails: user.b2bDetails
    });
};