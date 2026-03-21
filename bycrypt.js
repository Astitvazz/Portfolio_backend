import bcrypt from 'bcrypt';
const hash = await bcrypt.hash('Astitva31@123', 10);
console.log(hash);