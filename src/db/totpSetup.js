// Генерира тайна за двуфакторен вход в админа: npm run totp
// Добави тайната в приложение за удостоверяване (Google Authenticator, Authy, 1Password),
// после я задай като ADMIN_TOTP_SECRET в Railway. Докато не е зададена, панелът иска само парола.
const { newTotpSecret } = require('../security');

const secret = newTotpSecret();
const issuer = encodeURIComponent('Библията под лупа');
console.log('ADMIN_TOTP_SECRET=' + secret);
console.log(`otpauth://totp/${issuer}:admin?secret=${secret}&issuer=${issuer}`);
