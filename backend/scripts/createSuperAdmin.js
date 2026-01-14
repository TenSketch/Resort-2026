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

async function createSuperAdmin() {
  if (!dryRun) await connectDB()
  else console.log('Running in dry-run mode: will not connect to DB or write data')

  const email = 'superadmin@gmail.com'
  const passwordPlain = '123'
  const saltRounds = 10

  const hashed = await bcrypt.hash(passwordPlain, saltRounds)

  const superAdmin = {
    username: email,
    password: hashed,
    name: 'Super Admin',
    role: 'superadmin',
    permissions: {
      canEdit: true,
      canDisable: true,
      canAddReservations: true,
      canAddGuests: true,
      canViewDownload: true,
    }
  }

  if (dryRun) {
    console.log('[dry-run] Would upsert super admin with username=', email)
    return
  }

  const existing = await Admin.findOne({ username: email })
  if (existing) {
    existing.password = superAdmin.password
    existing.name = superAdmin.name
    existing.role = superAdmin.role
    existing.permissions = superAdmin.permissions
    await existing.save()
    console.log('Updated existing super admin:', email)
  } else {
    const doc = new Admin(superAdmin)
    await doc.save()
    console.log('Created super admin:', email)
  }
}

if (process.argv[1] === __filename) {
  createSuperAdmin()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1) })
}

export default createSuperAdmin
