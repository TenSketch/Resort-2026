import { useState, useEffect } from "react";
import { useAdmin } from "@/lib/AdminProvider";
import { Navigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import UserFormModal from "@/components/users/UserFormModal";
import LoadingScreen from "@/components/shared/LoadingScreen";

interface AdminUser {
    _id: string;
    username: string;
    name: string;
    role: string;
    permissions?: any;
    createdAt: string;
}

const UserManagementPage = () => {
    const { isSuperAdmin } = useAdmin();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("admin_token");
            const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";

            const response = await fetch(`${apiBase}/api/admin/users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data.admins || []);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return;

        try {
            const token = localStorage.getItem("admin_token");
            const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";

            const response = await fetch(`${apiBase}/api/admin/users/${userId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                fetchUsers();
            } else {
                const data = await response.json();
                alert(data.error || "Failed to delete user");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user");
        }
    };

    const handleEdit = (user: AdminUser) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        fetchUsers();
    };

    // Only superadmin can access this page
    if (!isSuperAdmin) {
        return <Navigate to="/dashboard/report" replace />;
    }

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600 mt-1">
                        Manage admin and staff user accounts and permissions
                    </p>
                </div>
                <Button onClick={handleAdd} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add User
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user._id}>
                                    <TableCell className="font-medium">{user.username}</TableCell>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                user.role === "superadmin"
                                                    ? "bg-purple-100 text-purple-800"
                                                    : user.role === "admin"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : user.role === "dfo"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-gray-100 text-gray-800"
                                            }`}
                                        >
                                            {user.role}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(user)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(user._id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {isModalOpen && (
                <UserFormModal
                    user={editingUser}
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
};

export default UserManagementPage;
