import GuestForm from "@/components/guests/GuestForm";
import { usePermissions } from "@/lib/AdminProvider";

const AddGuestPage = () => {
  const perms = usePermissions()

  if (!perms.canAddGuests) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold">Insufficient Permissions</h2>
        <p className="mt-2 text-sm text-gray-600">You don't have permission to add guests.</p>
      </div>
    )
  }

  return (
    <div>
      <GuestForm />
    </div>
  )
}

export default AddGuestPage