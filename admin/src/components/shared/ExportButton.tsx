import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportButtonProps<T> {
  data: T[];
  dtRef?: React.RefObject<any>;
  headers: string[];
  mapRow: (row: T, index: number) => (string | number)[];
  filename?: string;
  disabled?: boolean;
  title?: string;
  className?: string;
}

export default function ExportButton<T>({
  data,
  dtRef,
  headers,
  mapRow,
  filename = "export.csv",
  disabled = false,
  title = "Export to Excel",
  className = "",
}: ExportButtonProps<T>) {
  
  const handleExport = () => {
    if (disabled) return;
    
    // Get currently filtered rows or fallback to all data
    const dtApi = (dtRef?.current as any)?.dt?.() || dtRef?.current;
    
    const dataToExport: T[] = dtApi
      ? dtApi.rows({ search: "applied" }).data().toArray()
      : data;

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...dataToExport.map((row, idx) => {
        const mappedRow = mapRow(row, idx);
        // Ensure values containing commas are wrapped in quotes
        return mappedRow.map(value => {
            const strVal = String(value);
            // If the mapRow didn't already wrap in quotes and it contains commas, wrap it
            if (strVal.includes(',') && !strVal.startsWith('"') && !strVal.endsWith('"')) {
                return `"${strVal}"`;
            }
            return strVal;
        }).join(",");
      }),
    ].join("\n");

    // Trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      onClick={handleExport}
      disabled={disabled}
      title={disabled ? (title || "Export disabled") : title}
      className={`inline-flex items-center px-4 py-2 text-white text-[11px] md:text-sm font-medium transition-colors rounded-lg shadow-sm w-full sm:w-auto justify-center ${
        disabled
          ? "bg-slate-300 hover:bg-slate-300 cursor-not-allowed text-slate-500"
          : "bg-green-600 hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
      } ${className}`}
    >
      <Download className="h-4 w-4 mr-2 !shrink-0" />
      <span className="truncate">Export to Excel</span>
    </Button>
  );
}
