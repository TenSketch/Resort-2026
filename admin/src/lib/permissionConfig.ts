// Permission Configuration for Role-Based Access Control

export type PageId =
    | 'dashboard-resort'
    | 'dashboard-tent'
    | 'dashboard-tourist'
    | 'resorts-view'
    | 'resorts-add'
    | 'cottage-types-view'
    | 'cottage-types-add'
    | 'rooms-view'
    | 'rooms-add'
    | 'room-amenities-view'
    | 'room-amenities-add'
    | 'reservations-view'
    | 'reservations-add'
    | 'reports'
    | 'frontdesk'
    | 'guests-view'
    | 'guests-add'
    | 'tent-spots-view'
    | 'tent-spots-add'
    | 'tent-types-view'
    | 'tent-types-add'
    | 'tent-inventory-view'
    | 'tent-inventory-add'
    | 'tent-bookings-view'
    | 'tent-bookings-add'
    | 'tourist-spots-view'
    | 'tourist-spots-add'
    | 'tourist-packages'
    | 'tourist-bookings-view'
    | 'tourist-bookings-add'
    | 'log-reports'
    | 'user-management'

export interface PageDefinition {
    id: PageId
    label: string
    paths: string[] // Array of route paths this page covers
    category: 'resort' | 'tent' | 'tourist-spot' | 'general'
    description?: string
}

export const PAGE_DEFINITIONS: PageDefinition[] = [
    // Resort Management
    { id: 'dashboard-resort', label: 'Resort Dashboard', paths: ['/dashboard/report'], category: 'resort' },
    { id: 'resorts-view', label: 'All Resorts', paths: ['/resorts/all'], category: 'resort' },
    { id: 'resorts-add', label: 'Add Resort', paths: ['/resorts/add'], category: 'resort' },
    { id: 'cottage-types-view', label: 'All Cottage Types', paths: ['/cottage-types/all'], category: 'resort' },
    { id: 'cottage-types-add', label: 'Add Cottage Type', paths: ['/cottage-types/add'], category: 'resort' },
    { id: 'rooms-view', label: 'All Rooms', paths: ['/rooms/all'], category: 'resort' },
    { id: 'rooms-add', label: 'Add Room', paths: ['/rooms/add'], category: 'resort' },
    { id: 'room-amenities-view', label: 'All Room Amenities', paths: ['/room-amenities/all'], category: 'resort' },
    { id: 'room-amenities-add', label: 'Add Room Amenity', paths: ['/room-amenities/add'], category: 'resort' },
    { id: 'reservations-view', label: 'All Reservations', paths: ['/reservation/all'], category: 'resort' },
    { id: 'reservations-add', label: 'Add Reservation', paths: ['/reservation/add'], category: 'resort' },
    { id: 'reports', label: 'Reports', paths: ['/reports/daily-occupancy-junglestar', '/reports/daily-occupancy-vanavihari', '/dailyoccupanyreport/vanavihari', '/dailyoccupanyreport/junglestar'], category: 'resort' },
    { id: 'frontdesk', label: 'Front Desk', paths: ['/frontdesk/checkin', '/frontdesk/checkout'], category: 'resort' },
    { id: 'guests-view', label: 'All Guests', paths: ['/guests/all'], category: 'resort' },
    { id: 'guests-add', label: 'Add Guest', paths: ['/guests/add'], category: 'resort' },

    // Tent Management
    { id: 'dashboard-tent', label: 'Tent Dashboard', paths: ['/tent/dashboard'], category: 'tent' },
    { id: 'tent-spots-view', label: 'All Tent Spots', paths: ['/tentspots/all', '/tentspots/details'], category: 'tent' },
    { id: 'tent-spots-add', label: 'Add Tent Spot', paths: ['/tentspots/add'], category: 'tent' },
    { id: 'tent-types-view', label: 'All Tent Types', paths: ['/tenttypes/all'], category: 'tent' },
    { id: 'tent-types-add', label: 'Add Tent Type', paths: ['/tenttypes/add'], category: 'tent' },
    { id: 'tent-inventory-view', label: 'All Tents', paths: ['/tentinventory/alltents'], category: 'tent' },
    { id: 'tent-inventory-add', label: 'Add Tent', paths: ['/tentinventory/addtents'], category: 'tent' },
    { id: 'tent-bookings-view', label: 'All Tent Bookings', paths: ['/tentbookings/allbookings'], category: 'tent' },
    { id: 'tent-bookings-add', label: 'Add Tent Booking', paths: ['/tentbookings/addbookings'], category: 'tent' },

    // Tourist Spot Management
    { id: 'dashboard-tourist', label: 'Tourist Dashboard', paths: ['/tourist/dashboard'], category: 'tourist-spot' },
    { id: 'tourist-spots-view', label: 'All Tourist Spots', paths: ['/touristspots/all'], category: 'tourist-spot' },
    { id: 'tourist-spots-add', label: 'Add Tourist Spot', paths: ['/touristspots/add'], category: 'tourist-spot' },
    { id: 'tourist-packages', label: 'Tourist Packages', paths: ['/tourist/packages'], category: 'tourist-spot' },
    { id: 'tourist-bookings-view', label: 'All Tourist Bookings', paths: ['/tourist/bookings'], category: 'tourist-spot' },
    { id: 'tourist-bookings-add', label: 'Add Tourist Booking', paths: ['/tourist/bookings/add'], category: 'tourist-spot' },

    // General
    { id: 'log-reports', label: 'Log Reports', paths: ['/log-reports/all', '/log-reports/table'], category: 'general' },
    { id: 'user-management', label: 'User Management', paths: ['/users/manage'], category: 'general' },
]

// Get all page IDs
export const ALL_PAGE_IDS: PageId[] = PAGE_DEFINITIONS.map(p => p.id)

// Default permissions for each role
export const DEFAULT_ROLE_PERMISSIONS = {
    superadmin: {
        visiblePages: ALL_PAGE_IDS,
        canEdit: true,
        canDisable: true,
        canAddReservations: true,
        canAddGuests: true,
        canViewDownload: true,
        canExport: true,
    },
    admin: {
        visiblePages: ALL_PAGE_IDS.filter(id => id !== 'user-management'), // All except user management
        canEdit: false,
        canDisable: false,
        canAddReservations: false,
        canAddGuests: false,
        canViewDownload: true,
        canExport: true,
    },
    staff: {
        visiblePages: ['dashboard-resort', 'dashboard-tent', 'dashboard-tourist', 'reservations-view', 'reports'] as PageId[],
        canEdit: false,
        canDisable: false,
        canAddReservations: false,
        canAddGuests: false,
        canViewDownload: true,
        canExport: false,
    },
}

// Helper function to check if a path matches a page definition
export const getPageIdForPath = (path: string): PageId | null => {
    for (const page of PAGE_DEFINITIONS) {
        if (page.paths.some(p => {
            // Exact match
            if (p === path) return true
            // Wildcard match (e.g., /reservation/* matches /reservation/all)
            if (p.endsWith('/*') && path.startsWith(p.slice(0, -2))) return true
            return false
        })) {
            return page.id
        }
    }
    return null
}

// Group pages by category for UI display
export const getPagesByCategory = () => {
    const grouped: Record<string, PageDefinition[]> = {}
    PAGE_DEFINITIONS.forEach(page => {
        if (!grouped[page.category]) {
            grouped[page.category] = []
        }
        grouped[page.category].push(page)
    })
    return grouped
}
