import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: `${__dirname}/../.env` })
import bcrypt from 'bcrypt'
import connectDB from '../config/mongodb.js'
import Admin from '../models/adminModel.js'

const argv = process.argv.slice(2)
let dryRun = false
for (const a of argv) {
  if (a === '--dry-run') dryRun = true
  if (a.startsWith('--uri=')) process.env.MONGODB_URI = a.split('=')[1]
  if (a.startsWith('-u=')) process.env.MONGODB_URI = a.split('=')[1]
}
for (let i = 0; i < argv.length; i++) {
  if ((argv[i] === '--uri' || argv[i] === '-u') && argv[i+1]) {
    process.env.MONGODB_URI = argv[i+1]
  }
}

async function createStaff() {
  if (!dryRun) await connectDB()
  else console.log('Running in dry-run mode: will not connect to DB or write data')

  const email = 'staff@gmail.com'
  const passwordPlain = '123'
  const saltRounds = 10

  const hashed = await bcrypt.hash(passwordPlain, saltRounds)

  const staff = {
    username: email,
    password: hashed,
    name: 'Staff User',
    role: 'staff',
    permissions: {
      canEdit: false,
      canDisable: false,
      canAddReservations: false,
      canAddGuests: false,
      canViewDownload: true,
    }
  }

  if (dryRun) {
    console.log('[dry-run] Would upsert staff user with username=', email, 'and permissions=', staff.permissions)
    return
  }

  const existing = await Admin.findOne({ username: email })
  if (existing) {
    existing.password = staff.password
    existing.name = staff.name
    existing.role = staff.role
    existing.permissions = staff.permissions
    await existing.save()
    console.log('Updated existing staff user:', email)
  } else {
    const doc = new Admin(staff)
    await doc.save()
    console.log('Created staff user:', email)
  }
}

if (process.argv[1] === __filename) {
  createStaff()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1) })
}

export default createStaff
