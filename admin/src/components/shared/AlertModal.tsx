import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: "success" | "error";
  onAction?: () => void;
}

export default function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type,
  onAction,
}: AlertModalProps) {
  const isSuccess = type === "success";

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm w-[90%] rounded-lg mx-auto p-4 border-0 shadow-xl">
        <DialogHeader className="flex flex-col items-center gap-4 text-center sm:text-center mt-2">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center p-3 ring-8 ${isSuccess
              ? "bg-green-100 ring-green-50/50"
              : "bg-red-100 ring-red-50/50"
              }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            ) : (
              <AlertCircle className="w-10 h-10 text-red-600" />
            )}
          </div>
          <div className="space-y-1 mt-2">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-800">
              {title}
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-sm sm:text-base leading-relaxed mt-2 mx-auto max-w-sm">
              {message}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="flex sm:justify-center mt-6">
          <Button
            onClick={handleAction}
            className={`w-full sm:w-auto min-w-[120px] rounded-lg h-11 font-medium text-white transition-colors ${isSuccess
              ? "bg-green-600 hover:bg-green-700 active:bg-green-800"
              : "bg-red-600 hover:bg-red-700 active:bg-red-800"
              }`}
          >
            {isSuccess ? "Great, Got it!" : "Try Again"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
