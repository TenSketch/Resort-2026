import 'dotenv/config'
import connectDB from '../config/mongodb.js'
import Admin from '../models/adminModel.js'
import { fileURLToPath } from 'url'

const argv = process.argv.slice(2)
let dryRun = false
let targetId = '68a944f22849cc5bd06a69e0'
let username
for (const a of argv) {
  if (a === '--dry-run') dryRun = true
  if (a.startsWith('--id=')) targetId = a.split('=')[1]
  if (a.startsWith('--username=')) username = a.split('=')[1]
  if (a.startsWith('--uri=')) process.env.MONGODB_URI = a.split('=')[1]
  if (a.startsWith('-u=')) process.env.MONGODB_URI = a.split('=')[1]
}
for (let i = 0; i < argv.length; i++) {
  if ((argv[i] === '--uri' || argv[i] === '-u') && argv[i+1]) process.env.MONGODB_URI = argv[i+1]
  if ((argv[i] === '--id') && argv[i+1]) targetId = argv[i+1]
  if ((argv[i] === '--username') && argv[i+1]) username = argv[i+1]
}

async function updateAdmin() {
  if (!dryRun) await connectDB()
  else console.log('Running in dry-run mode: will not connect to DB or write data')

  const permissionsForAdmin = {
    canEdit: false,
    canDisable: false,
    canAddReservations: true,
    canAddGuests: true,
    canViewDownload: true,
  }

  const query = username ? { username } : { _id: targetId }

  if (dryRun) {
    console.log('[dry-run] Would update admin matching', query, 'with role=admin and permissions=', permissionsForAdmin)
    return
  }

  const admin = await Admin.findOne(query)
  if (!admin) {
    console.error('Admin not found for', query)
    return
  }

  admin.role = 'admin'
  admin.permissions = permissionsForAdmin
  await admin.save()
  console.log('Updated admin', admin._id.toString(), admin.username)
}

const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
  updateAdmin()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1) })
}

export default updateAdmin
