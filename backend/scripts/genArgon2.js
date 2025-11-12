import argon2 from 'argon2';

const users = [
  { email: 'admin@demo.com',   pass: 'Demo123*' },
  { email: 'business@demo.com', pass: 'Demo123*' },
  { email: 'client@demo.com',   pass: 'Demo123*' },
];

for (const u of users) {
  const hash = await argon2.hash(u.pass); // Argon2id por defecto
  console.log(u.email, '=>', hash);
}
