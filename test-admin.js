require('dotenv').config({path: '.env.local'});
console.log('ADMIN_EMAILS:', process.env.ADMIN_EMAILS);
const email='gamatig@gmail.com';
const raw=(process.env.ADMIN_EMAILS ?? '').replace(/['"]/g, '');
console.log('raw:', raw);
const allowed=raw.split(',').map(e=>e.trim().toLowerCase()).filter(Boolean);
console.log('allowed:', allowed);
console.log('isAdmin:', allowed.includes(email.toLowerCase()));
