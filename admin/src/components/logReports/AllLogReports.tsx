import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import "datatables.net-dt/css/dataTables.dataTables.css";
import 'datatables.net-buttons-dt/css/buttons.dataTables.css';
import 'datatables.net-buttons';
import 'datatables.net-buttons/js/buttons.colVis.js';
import 'datatables.net-columncontrol-dt';
import 'datatables.net-columncontrol-dt/css/columnControl.dataTables.css';

import "datatables.net-fixedcolumns";
import "datatables.net-fixedcolumns-dt/css/fixedColumns.dataTables.css";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

DataTable.use(DT);

interface LogEntry {
  bookingId: string;
  username: string;
  logType: string;
  logMessage: string;
  logEntryDate: string; // ISO date string
}


export default function LogsTable() {
  const tableRef = useRef(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isConfirmDisableOpen, setIsConfirmDisableOpen] = useState(false);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
  const [disablingLog, setDisablingLog] = useState<LogEntry | null>(null);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [disabledLogs, setDisabledLogs] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<Partial<LogEntry>>({});
  const [rows, setRows] = useState<LogEntry[]>([]);

  const handleEdit = (log: LogEntry) => {
    setEditingLog(log);
    setFormData({ ...log });
  setIsEditSheetOpen(true);
  };

  const handleDisable = (log: LogEntry) => {
    setDisablingLog(log);
    setIsConfirmDisableOpen(true);
  };

  const handleRowClick = (log: LogEntry) => {
    setSelectedLog(log);
    setIsDetailSheetOpen(true);
  };

  const confirmDisable = () => {
    if (disablingLog) {
      console.log('Disabling log:', disablingLog.bookingId);
      setDisabledLogs(prev => new Set([...prev, disablingLog.bookingId]));
      setIsConfirmDisableOpen(false);
      setDisablingLog(null);
    }
  };

  const cancelDisable = () => {
    setIsConfirmDisableOpen(false);
    setDisablingLog(null);
  };

  const handleUpdate = () => {
    if (editingLog && formData) {
      console.log('Updating log:', formData);
      const payload: any = { ...formData }
      if (payload.logEntryDate && typeof payload.logEntryDate === 'string') {
        payload.logEntryDate = new Date(payload.logEntryDate)
      }

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      fetch(`${apiBase}/api/logs/${encodeURIComponent(editingLog.bookingId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(async (res) => {
          const parsed = await res.json().catch(() => null)
          if (!res.ok) throw new Error((parsed && parsed.error) || res.statusText)
          return parsed
        })
        .then((data) => {
          if (data && data.success && data.log) {
            setRows(prev => prev.map(r => r.bookingId === data.log.bookingId ? ({
              ...data.log,
              logEntryDate: data.log.logEntryDate ? new Date(data.log.logEntryDate).toISOString().slice(0,16) : ''
            }) : r))
          }
          setIsEditSheetOpen(false);
          setEditingLog(null);
          setFormData({});
        })
        .catch((err) => {
          console.error('Update log error', err)
          alert('Failed to update log: ' + err.message)
        })
    }
  };

  const handleCancel = () => {
    setIsEditSheetOpen(false);
    setEditingLog(null);
    setFormData({});
  };

  const handleInputChange = (field: keyof LogEntry, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .dt-button-collection {
        position: fixed !important;
        z-index: 9999 !important;
        background: white !important;
        border: 1px solid #ddd !important;
        border-radius: 4px !important;
      }
      .dataTables_wrapper {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      .dataTables_wrapper .dt-layout-row {
        flex-shrink: 0;
      }
      .dataTables_wrapper .dataTables_scroll {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
      .dataTables_wrapper .dataTables_scrollHead {
        flex-shrink: 0;
        border-radius: 0.5rem 0.5rem 0 0;
        border: 1px solid #ddd;
        border-bottom: none;
        background: #ddd;
      }
      .dataTables_wrapper .dataTables_scrollHeadInner {
        width: 100% !important;
      }
      .dataTables_wrapper .dataTables_scrollBody {
        flex: 1;
        overflow: auto !important;
        width: 100%;
        border: 1px solid #ddd;
        border-top: none;
        border-radius: 0 0 0.5rem 0.5rem;
        min-height: 300px;
        max-height: calc(100vh - 350px);
      }
      .dataTables_wrapper table {
        width: max-content !important;
        min-width: 100%;
        margin: 0 !important;
      }
      .dt-button-collection.dropdown-menu {
        transform: none !important;
      }
      .dataTables_wrapper .dt-buttons {
        margin-bottom: 1rem;
      }
      .dataTables_wrapper .dataTables_info,
      .dataTables_wrapper .dataTables_paginate {
        margin-top: 1rem;
      }
      table.dataTable thead tr th,
      table.dataTable thead tr td {
        font-weight: 700 !important;
      }
      /* Disabled row styling */
      table.dataTable tbody tr.disabled-row {
        background-color: #f5f5f5 !important;
        opacity: 0.6 !important;
        text-decoration: line-through !important;
      }
      table.dataTable tbody tr.disabled-row:hover {
        background-color: #eeeeee !important;
      }
      /* Action button styling */
      .edit-btn:active {
        transform: translateY(0) !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
      }
      .disable-btn:active:not([disabled]) {
        transform: translateY(0) !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
      }
      /* Clickable row styling */
      table.dataTable tbody tr {
        cursor: pointer !important;
        transition: background-color 0.2s ease !important;
      }
      table.dataTable tbody tr:hover:not(.disabled-row) {
        background-color: #f8fafc !important;
      }
      table.dataTable tbody tr:hover.disabled-row {
        background-color: #eeeeee !important;
      }
    `;
    document.head.appendChild(style);

    const handleButtonClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const logId = target.getAttribute('data-id') || target.closest('button')?.getAttribute('data-id');
      const log = rows.find(l => l.bookingId === logId);
      
      if (log) {
        // Stop propagation to prevent row click when button is clicked
        event.stopPropagation();
        
        if (target.classList.contains('edit-btn') || target.closest('.edit-btn')) {
          handleEdit(log);
        } else if (target.classList.contains('disable-btn') || target.closest('.disable-btn')) {
          handleDisable(log);
        }
      }
    };

    const handleTableRowClick = (event: Event) => {
      const target = event.target as HTMLElement;
      
      // Don't trigger row click if a button was clicked
      if (target.closest('.edit-btn, .disable-btn')) {
        return;
      }
      
      const row = target.closest('tr');
      if (row && row.parentElement?.tagName === 'TBODY') {
        const rowIndex = Array.from(row.parentElement.children).indexOf(row);
        const log = rows[rowIndex];
        if (log) {
          handleRowClick(log);
        }
      }
    };

    const handleScroll = () => {
      const collection = document.querySelector(".dt-button-collection");
      if (collection && (collection as HTMLElement).style.display !== "none") {
        (collection as HTMLElement).style.display = "none";
      }
    };

    const scrollContainer = document.querySelector(".dataTables_scrollBody");
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
    }

    document.addEventListener('click', handleButtonClick);
    document.addEventListener('click', handleTableRowClick);

    return () => {
      document.head.removeChild(style);
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
      document.removeEventListener('click', handleButtonClick);
      document.removeEventListener('click', handleTableRowClick);
    };
  }, []);

  // fetch logs from backend on mount
  useEffect(() => {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    fetch(`${apiBase}/api/logs`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.logs)) {
          const normalized = data.logs.map((l: any) => ({
            ...l,
            logEntryDate: l.logEntryDate ? new Date(l.logEntryDate).toISOString().slice(0,16) : ''
          }))
          setRows(normalized)
        }
      })
      .catch((err) => console.error('fetch logs error', err))
  }, [])

  const columns = [
    {
      title: "S.No",
      data: null,
      render: (_data: any, _type: any, _row: any, meta: any) => {
        return meta.row + 1 + meta.settings._iDisplayStart;
      },
      orderable: false,
      searchable: false
    },
    { data: "username", title: "Username" },
    { data: "bookingId", title: "Booking ID" },
    { data: "logType", title: "Log Type" },
    { data: "logMessage", title: "Log Message" },
    {
      data: "logEntryDate",
      title: "Log Entry Date",
      render: (data: string) => {
        const date = new Date(data);
        return date.toLocaleString();
      }
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      searchable: false,
      render: (_data: any, _type: any, row: LogEntry) => {
        const isDisabled = disabledLogs.has(row.bookingId);
        return `
          <div style="display: flex; gap: 8px; align-items: center;">
            <button 
              class="edit-btn" 
              data-id="${row.bookingId}" 
              title="Edit Log"
              style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                ${isDisabled ? 'opacity: 0.5;' : ''}
              "
              onmouseover="this.style.background='#2563eb'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 6px rgba(0, 0, 0, 0.15)'"
              onmouseout="this.style.background='#3b82f6'; this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0, 0, 0, 0.1)'"
            >
              Edit
            </button>
            <button 
              class="disable-btn" 
              data-id="${row.bookingId}" 
              title="${isDisabled ? 'Already Disabled' : 'Disable Record'}"
              style="
                background: ${isDisabled ? '#6b7280' : '#dc2626'};
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
                transition: all 0.2s ease;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              "
              ${isDisabled ? 'disabled' : ''}
              onmouseover="${!isDisabled ? `this.style.background='#b91c1c'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 6px rgba(0, 0, 0, 0.15)'` : ''}"
              onmouseout="${!isDisabled ? `this.style.background='#dc2626'; this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0, 0, 0, 0.1)'` : ''}"
            >
              ${isDisabled ? 'Disabled' : 'Disable'}
            </button>
          </div>
        `;
      },
    }
  ];

  return (
    <div className="flex flex-col h-full max-h-screen overflow-hidden">
      <div className="flex-shrink-0 px-6 py-4">
        <h2 className="text-xl font-semibold text-slate-800">Logs Table</h2>
      </div>
      <div className="flex-1 py-4 overflow-hidden">
        <div ref={tableRef} className="h-full">
          <DataTable
            data={rows}
            columns={columns}
            className="display nowrap w-full border border-gray-400"
            options={{
              pageLength: 10,
              lengthMenu: [5, 10, 25, 50, 100],
              order: [[0, 'desc']], // Updated index for date column
              searching: true,
              paging: true,
              info: true,
              scrollX: true,
              scrollY: "400px",
              scrollCollapse: true,
              layout: {
                topStart: 'buttons',
                topEnd: 'search',
                bottomStart: 'pageLength',
                bottomEnd: 'paging'
              },
              buttons: [
                {
                  extend: 'colvis',
                  text: 'Column Visibility',
                  collectionLayout: 'fixed two-column'
                }
              ],
              columnControl: ['order', ['orderAsc', 'orderDesc', 'spacer', 'search']],
              rowCallback: (row: any, data: any) => {
                if (disabledLogs.has(data.bookingId)) {
                  row.classList.add('disabled-row');
                } else {
                  row.classList.remove('disabled-row');
                }
                return row;
              },
            }}
          />
        </div>
      </div>

      {/* Edit Sheet (sidebar) */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="w-[420px] sm:w-[520px] lg:w-[640px] flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>Edit Log Entry</SheetTitle>
            <SheetDescription>Make changes to the log entry details below.</SheetDescription>
          </SheetHeader>

          {formData && (
            <div className="flex-1 overflow-y-auto px-6 py-4 grid grid-cols-1 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username || ''}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bookingId">Booking ID</Label>
                <Input
                  id="bookingId"
                  value={formData.bookingId || ''}
                  onChange={(e) => handleInputChange('bookingId', e.target.value)}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="logType">Log Type</Label>
                <Input
                  id="logType"
                  value={formData.logType || ''}
                  onChange={(e) => handleInputChange('logType', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="logMessage">Log Message</Label>
                <Input
                  id="logMessage"
                  value={formData.logMessage || ''}
                  onChange={(e) => handleInputChange('logMessage', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="logEntryDate">Log Entry Date</Label>
                <Input
                  id="logEntryDate"
                  type="datetime-local"
                  value={formData.logEntryDate || ''}
                  onChange={(e) => handleInputChange('logEntryDate', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex-shrink-0 flex gap-2 p-6 pt-4 border-t bg-white">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>
              Update
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog for Disable Action */}
      <Dialog open={isConfirmDisableOpen} onOpenChange={setIsConfirmDisableOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Disable</DialogTitle>
            <DialogDescription>
              Are you sure you want to disable this log entry? This action will hide the record from the database.
            </DialogDescription>
          </DialogHeader>
          
          {disablingLog && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                <strong>Booking ID:</strong> {disablingLog.bookingId}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Username:</strong> {disablingLog.username}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Log Type:</strong> {disablingLog.logType}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={cancelDisable}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDisable}>
              Yes, Disable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Details Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[700px] lg:w-[800px] flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>Log Entry Details</SheetTitle>
            <SheetDescription>
              Complete information about the selected log entry
            </SheetDescription>
          </SheetHeader>
          
          {selectedLog && (
            <>
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Booking ID</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      <span className="text-sm text-gray-900 font-mono">{selectedLog.bookingId}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Username</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      <span className="text-sm text-gray-900">{selectedLog.username}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Log Type</Label>
                    <div className="mt-1">
                      <Badge 
                        variant={selectedLog.logType === 'ERROR' ? "destructive" : 
                               selectedLog.logType === 'WARNING' ? "secondary" : "default"}
                        className="px-2 py-1"
                      >
                        {selectedLog.logType}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Log Message</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border min-h-[100px]">
                      <span className="text-sm text-gray-900 whitespace-pre-wrap">{selectedLog.logMessage}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Log Entry Date</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      <span className="text-sm text-gray-900">
                        {new Date(selectedLog.logEntryDate).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Timestamp (ISO)</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      <span className="text-sm text-gray-900 font-mono break-all">{selectedLog.logEntryDate}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <div className="mt-1">
                      <Badge 
                        variant={disabledLogs.has(selectedLog.bookingId) ? "destructive" : "default"}
                        className="px-2 py-1"
                      >
                        {disabledLogs.has(selectedLog.bookingId) ? "Disabled" : "Active"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Fixed Action Buttons */}
              <div className="flex-shrink-0 flex gap-2 p-6 pt-4 border-t bg-white">
                <Button 
                  onClick={() => {
                    setIsDetailSheetOpen(false);
                    handleEdit(selectedLog);
                  }}
                  className="flex-1"
                  disabled={disabledLogs.has(selectedLog.bookingId)}
                >
                  Edit Log
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setIsDetailSheetOpen(false);
                    handleDisable(selectedLog);
                  }}
                  disabled={disabledLogs.has(selectedLog.bookingId)}
                >
                  Disable
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
