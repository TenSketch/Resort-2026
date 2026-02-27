import * as React from "react";
import { format, isValid, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerFieldProps {
  /** ISO string value "yyyy-MM-dd" or "" */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** ISO string "yyyy-MM-dd" */
  minDate?: string;
  /** ISO string "yyyy-MM-dd" */
  maxDate?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePickerField({
  value,
  onChange,
  placeholder = "Pick a date",
  minDate,
  maxDate,
  disabled = false,
  className,
}: DatePickerFieldProps) {
  const [open, setOpen] = React.useState(false);

  const selected =
    value && isValid(parseISO(value)) ? parseISO(value) : undefined;
  const fromDate = minDate ? parseISO(minDate) : undefined;
  const toDate = maxDate ? parseISO(maxDate) : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"));
    } else {
      onChange("");
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => !disabled && setOpen(true)}
          className={cn(
            "w-full px-4 py-3 h-auto justify-between text-left font-normal border border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors",
            !selected && "text-slate-500",
            disabled && "opacity-50 cursor-not-allowed bg-slate-100",
            className,
          )}
        >
          <span>
            {selected ? format(selected, "dd MMM yyyy") : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 text-slate-500 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          disabled={(date) => {
            if (fromDate && date < fromDate) return true;
            if (toDate && date > toDate) return true;
            return false;
          }}
          defaultMonth={selected ?? fromDate}
          captionLayout="dropdown"
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
