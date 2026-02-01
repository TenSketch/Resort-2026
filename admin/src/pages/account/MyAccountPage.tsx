import { User, Shield, Eye, Lock, CheckCircle, XCircle } from "lucide-react"
import { useAdmin } from "@/lib/AdminProvider"
import { PAGE_DEFINITIONS } from "@/lib/permissionConfig"
import type { PageId } from "@/lib/permissionConfig"

const MyAccountPage = () => {
    const { admin } = useAdmin()

    if (!admin) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-slate-600">Loading...</p>
            </div>
        )
    }

    const permissions = admin.permissions || {}
    const visiblePages = (permissions.visiblePages || []) as PageId[]

    // Group pages by category
    const pagesByCategory = visiblePages.reduce((acc, pageId) => {
        const pageDef = PAGE_DEFINITIONS.find(p => p.id === pageId)
        if (pageDef) {
            if (!acc[pageDef.category]) {
                acc[pageDef.category] = []
            }
            acc[pageDef.category].push(pageDef)
        }
        return acc
    }, {} as Record<string, typeof PAGE_DEFINITIONS>)

    const categoryLabels = {
        'resort': 'Resort Management',
        'tent': 'Tent Management',
        'tourist-spot': 'Trek Spot Management',
        'general': 'General'
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
                            <User className="h-8 w-8 text-slate-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-800">{admin.name}</h1>
                            <p className="text-slate-600">@{admin.username}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <Shield className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-600 capitalize">{admin.role}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Permissions Overview */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">Permissions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PermissionItem
                            label="Edit Content"
                            enabled={permissions.canEdit || false}
                            icon={Lock}
                        />
                        <PermissionItem
                            label="Disable/Delete Items"
                            enabled={permissions.canDisable || false}
                            icon={Lock}
                        />
                        <PermissionItem
                            label="Add Reservations"
                            enabled={permissions.canAddReservations || false}
                            icon={Lock}
                        />
                        <PermissionItem
                            label="Add Guests"
                            enabled={permissions.canAddGuests || false}
                            icon={Lock}
                        />
                        <PermissionItem
                            label="View & Download"
                            enabled={permissions.canViewDownload || false}
                            icon={Eye}
                        />
                        <PermissionItem
                            label="Export Data"
                            enabled={permissions.canExport || false}
                            icon={Eye}
                        />
                    </div>
                </div>

                {/* Page Access */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">Page Access</h2>
                    {admin.role === 'superadmin' ? (
                        <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                            <p className="text-blue-800 font-medium">Full Access - All pages available</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(pagesByCategory).map(([category, pages]) => (
                                <div key={category}>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">
                                        {categoryLabels[category as keyof typeof categoryLabels] || category}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {pages.map(page => (
                                            <div
                                                key={page.id}
                                                className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200"
                                            >
                                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                <span className="text-sm text-slate-700">{page.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {visiblePages.length === 0 && (
                                <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-lg">
                                    <XCircle className="h-5 w-5 text-slate-400" />
                                    <p className="text-slate-600">No page access configured</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

interface PermissionItemProps {
    label: string
    enabled: boolean
    icon: typeof Lock
}

const PermissionItem = ({ label, enabled, icon: Icon }: PermissionItemProps) => {
    return (
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-slate-600" />
                <span className="text-sm text-slate-700">{label}</span>
            </div>
            {enabled ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
                <XCircle className="h-5 w-5 text-slate-300" />
            )}
        </div>
    )
}

export default MyAccountPage
