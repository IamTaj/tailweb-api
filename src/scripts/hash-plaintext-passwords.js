require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri, { dbName: 'assignment_portal' });

  const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    role: String,
    name: String
  }, { collection: 'users' });
  const User = mongoose.model('User_migration', userSchema);

  const candidates = await User.find({ password: { $exists: true } }).lean();
  let updated = 0;
  for (const u of candidates) {
    if (typeof u.password === 'string' && u.password.startsWith('$2')) continue;
    const hash = await bcrypt.hash(u.password, 12);
    await User.updateOne({ _id: u._id }, { $set: { password: hash } });
    updated += 1;
  }

  console.log(`Hashed ${updated} user password(s).`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


