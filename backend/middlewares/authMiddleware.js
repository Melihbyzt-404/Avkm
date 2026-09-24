const jwt = require('jsonwebtoken');

// Token Doğrulama Middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Erişim yetkisi yok, token bulunamadı.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, role, email }
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Geçersiz veya süresi dolmuş token.' });
    }
};

// Rol Tabanlı Yetki Kontrolü
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Bu işlem için yetkiniz yetersiz veya B2B üyeliğiniz henüz onaylanmadı.' 
            });
        }
        next();
    };
};

module.exports = { verifyToken, authorizeRoles };