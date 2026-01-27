import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { getPagesByCategory } from "@/lib/permissionConfig";

interface UserFormModalProps {
    user: any | null;
    onClose: () => void;
}

const UserFormModal = ({ user, onClose }: UserFormModalProps) => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        name: "",
        role: "admin",
        permissions: {
            canEdit: false,
            canDisable: false,
            canAddReservations: false,
            canAddGuests: false,
            canViewDownload: true,
            canExport: true,
            visiblePages: [] as string[],
        },
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || "",
                password: "",
                name: user.name || "",
                role: user.role || "admin",
                permissions: {
                    canEdit: user.permissions?.canEdit || false,
                    canDisable: user.permissions?.canDisable || false,
                    canAddReservations: user.permissions?.canAddReservations || false,
                    canAddGuests: user.permissions?.canAddGuests || false,
                    canViewDownload: user.permissions?.canViewDownload !== false,
                    canExport: user.permissions?.canExport !== false,
                    visiblePages: user.permissions?.visiblePages || [],
                },
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem("admin_token");
            const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";

            const url = user
                ? `${apiBase}/api/admin/users/${user._id}`
                : `${apiBase}/api/admin/users`;

            const method = user ? "PUT" : "POST";

            const body: any = {
                name: formData.name,
                role: formData.role,
                permissions: formData.permissions,
            };

            if (!user) {
                body.username = formData.username;
                body.password = formData.password;
            } else if (formData.password) {
                body.password = formData.password;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                onClose();
            } else {
                const data = await response.json();
                alert(data.error || "Failed to save user");
            }
        } catch (error) {
            console.error("Error saving user:", error);
            alert("Failed to save user");
        } finally {
            setLoading(false);
        }
    };

    const togglePage = (pageId: string) => {
        setFormData((prev) => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                visiblePages: prev.permissions.visiblePages.includes(pageId)
                    ? prev.permissions.visiblePages.filter((p) => p !== pageId)
                    : [...prev.permissions.visiblePages, pageId],
            },
        }));
    };

    const toggleAllPages = (category: string, pages: any[]) => {
        const categoryPageIds = pages.map((p) => p.id);
        const allSelected = categoryPageIds.every((id) =>
            formData.permissions.visiblePages.includes(id)
        );

        setFormData((prev) => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                visiblePages: allSelected
                    ? prev.permissions.visiblePages.filter(
                        (p) => !categoryPageIds.includes(p)
                    )
                    : [...new Set([...prev.permissions.visiblePages, ...categoryPageIds])],
            },
        }));
    };

    const pagesByCategory = getPagesByCategory();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">
                        {user ? "Edit User" : "Create New User"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Basic Information</h3>

                        <div>
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                value={formData.username}
                                onChange={(e) =>
                                    setFormData({ ...formData, username: e.target.value })
                                }
                                disabled={!!user}
                                required={!user}
                            />
                        </div>

                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <Label htmlFor="password">
                                Password {user && "(leave blank to keep current)"}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                                required={!user}
                            />
                        </div>

                        <div>
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, role: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="superadmin">Superadmin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Feature Permissions */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Feature Permissions</h3>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="canEdit"
                                    checked={formData.permissions.canEdit}
                                    onCheckedChange={(checked) =>
                                        setFormData({
                                            ...formData,
                                            permissions: {
                                                ...formData.permissions,
                                                canEdit: checked as boolean,
                                            },
                                        })
                                    }
                                />
                                <Label htmlFor="canEdit">Can Edit</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="canAddReservations"
                                    checked={formData.permissions.canAddReservations}
                                    onCheckedChange={(checked: boolean) =>
                                        setFormData({
                                            ...formData,
                                            permissions: {
                                                ...formData.permissions,
                                                canAddReservations: checked,
                                            },
                                        })
                                    }
                                />
                                <Label htmlFor="canAddReservations">Can Add Reservations</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="canAddGuests"
                                    checked={formData.permissions.canAddGuests}
                                    onCheckedChange={(checked: boolean) =>
                                        setFormData({
                                            ...formData,
                                            permissions: {
                                                ...formData.permissions,
                                                canAddGuests: checked,
                                            },
                                        })
                                    }
                                />
                                <Label htmlFor="canAddGuests">Can Add Guests</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="canExport"
                                    checked={formData.permissions.canExport}
                                    onCheckedChange={(checked: boolean) =>
                                        setFormData({
                                            ...formData,
                                            permissions: {
                                                ...formData.permissions,
                                                canExport: checked,
                                            },
                                        })
                                    }
                                />
                                <Label htmlFor="canExport">Can Export Data</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="canDisable"
                                    checked={formData.permissions.canDisable}
                                    onCheckedChange={(checked: boolean) =>
                                        setFormData({
                                            ...formData,
                                            permissions: {
                                                ...formData.permissions,
                                                canDisable: checked,
                                            },
                                        })
                                    }
                                />
                                <Label htmlFor="canDisable">Can Disable</Label>
                            </div>
                        </div>
                    </div>

                    {/* Page Access */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Page Access</h3>

                        {Object.entries(pagesByCategory).map(([category, pages]) => (
                            <div key={category} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium capitalize">{category}</h4>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleAllPages(category, pages)}
                                    >
                                        {pages.every((p) =>
                                            formData.permissions.visiblePages.includes(p.id)
                                        )
                                            ? "Deselect All"
                                            : "Select All"}
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {pages.map((page) => (
                                        <div key={page.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={page.id}
                                                checked={formData.permissions.visiblePages.includes(
                                                    page.id
                                                )}
                                                onCheckedChange={() => togglePage(page.id)}
                                            />
                                            <Label htmlFor={page.id} className="text-sm">
                                                {page.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : user ? "Update User" : "Create User"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserFormModal;
