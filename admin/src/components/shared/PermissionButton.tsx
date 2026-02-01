import { Button } from "@/components/ui/button";
import { useAdmin } from "@/lib/AdminProvider";
import React from "react";

type Permissions = {
    canEdit: boolean
    canDisable: boolean
    canAddReservations: boolean
    canAddGuests: boolean
    canViewDownload: boolean
    canExport: boolean
}

interface PermissionButtonProps extends React.ComponentProps<typeof Button> {
    permission: keyof Permissions;
    children: React.ReactNode;
}

const PermissionButton = ({ permission, children, disabled, ...props }: PermissionButtonProps) => {
    const { canPerformAction } = useAdmin();
    const allowed = canPerformAction(permission);

    return (
        <Button {...props} disabled={!allowed || disabled}>
            {children}
        </Button>
    );
};

export default PermissionButton;
