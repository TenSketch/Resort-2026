import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import Admin from '../models/adminModel.js'
import 'dotenv/config'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resort'

const testUsers = [
    {
        username: 'superadmin',
        password: 'admin123',
        name: 'Super Administrator',
        role: 'superadmin',
        permissions: {
            canEdit: true,
            canDisable: true,
            canAddReservations: true,
            canAddGuests: true,
            canViewDownload: true,
            canExport: true,
            visiblePages: [], // Superadmin has access to all pages by default
        }
    },
    {
        username: 'admin1',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
        permissions: {
            canEdit: false, // No edit permission
            canDisable: false,
            canAddReservations: false, // No add permission
            canAddGuests: false,
            canViewDownload: true,
            canExport: true, // Can export
            visiblePages: [
                'dashboard-resort', 'dashboard-tent', 'dashboard-tourist',
                'resorts-view', 'resorts-add', 'cottage-types-view', 'cottage-types-add',
                'rooms-view', 'rooms-add', 'reservations-view', 'reservations-add',
                'reports', 'frontdesk', 'guests-view', 'guests-add',
                'tent-spots-view', 'tent-spots-add', 'tent-types-view', 'tent-types-add',
                'tent-inventory-view', 'tent-inventory-add', 'tent-bookings-view', 'tent-bookings-add',
                'tourist-spots-view', 'tourist-spots-add', 'tourist-packages',
                'tourist-bookings-view', 'tourist-bookings-add', 'log-reports'
            ]
        }
    },
    {
        username: 'staff1',
        password: 'admin123',
        name: 'Staff User',
        role: 'staff',
        permissions: {
            canEdit: false,
            canDisable: false,
            canAddReservations: false,
            canAddGuests: false,
            canViewDownload: true,
            canExport: false, // No export permission
            visiblePages: [
                'dashboard-resort', 'dashboard-tent', 'dashboard-tourist',
                'reservations-view', 'reports' // Only view reservations, no add
            ]
        }
    }
]

async function seedTestUsers() {
    try {
        console.log('Connecting to MongoDB...')
        await mongoose.connect(MONGODB_URI)
        console.log('Connected to MongoDB')

        console.log('\nSeeding test users...')

        for (const userData of testUsers) {
            // Check if user already exists
            const existingUser = await Admin.findOne({ username: userData.username })

            if (existingUser) {
                console.log(`❌ User '${userData.username}' already exists - skipping`)
                continue
            }

            // Hash password
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(userData.password, salt)

            // Create user
            const user = new Admin({
                username: userData.username,
                password: hashedPassword,
                name: userData.name,
                role: userData.role,
                permissions: userData.permissions
            })

            await user.save()
            console.log(`✅ Created ${userData.role}: ${userData.username} (password: ${userData.password})`)
        }

        console.log('\n✅ Seeding completed!')
        console.log('\nTest Users:')
        console.log('1. SuperAdmin - username: superadmin, password: admin123')
        console.log('   - Full access to everything')
        console.log('\n2. Admin - username: admin1, password: admin123')
        console.log('   - Can view all pages')
        console.log('   - Cannot edit or add items')
        console.log('   - Can export data')
        console.log('\n3. Staff - username: staff1, password: admin123')
        console.log('   - Can only view: Dashboards, Reservations, Reports')
        console.log('   - Cannot edit, add, or export')

    } catch (error) {
        console.error('Error seeding users:', error)
    } finally {
        await mongoose.connection.close()
        console.log('\nDatabase connection closed')
    }
}

seedTestUsers()
