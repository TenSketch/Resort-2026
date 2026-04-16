
import "datatables.net-dt/css/dataTables.dataTables.css";
import "datatables.net-buttons-dt/css/buttons.dataTables.css";
import "datatables.net-buttons";
import "datatables.net-buttons/js/buttons.colVis.js";
import "datatables.net-columncontrol-dt";
import "datatables.net-columncontrol-dt/css/columnControl.dataTables.css";
import "datatables.net-fixedcolumns";
import "datatables.net-fixedcolumns-dt/css/fixedColumns.dataTables.css";

import { useEffect, useRef, useState } from "react";
import { usePermissions } from "@/lib/AdminProvider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import PageLoader from "@/components/shared/PageLoader";
import ExportButton from "@/components/shared/ExportButton";
import DataTable from "../dataTable/DataTable";


interface Tent {
  id: string;
  sno: number;
  tentSpot: string;
  tentSpotName: string;
  tentType: string;
  tentTypeName: string;
  noOfGuests: number;
  noOfChildren: number;
  tentId: string;
  rate: number;
  tentCount: number;
  images: Array<{ url: string; public_id: string }>;
  isActive: boolean;
}

export default function AllTentsTable() {
  const tableRef = useRef(null);
  const dtRef = useRef<any>(null);
  const perms = usePermissions();
  const permsRef = useRef(perms);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"view" | "edit">("view");
  const [selectedTent, setSelectedTent] = useState<Tent | null>(null);
  const [tents, setTents] = useState<Tent[]>([]);
  const tentsRef = useRef<Tent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Editable fields
  const [editNoOfGuests, setEditNoOfGuests] = useState<number>(0);
  const [editNoOfChildren, setEditNoOfChildren] = useState<number>(0);
  const [editRate, setEditRate] = useState<number>(0);
  const [editTentCount, setEditTentCount] = useState<number>(1);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);

  // Fetch tents from backend
  useEffect(() => {
    const apiBase =
      (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";
    const fetchTents = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`${apiBase}/api/tents`);
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(
            e.error || `Failed to fetch tents (status ${res.status})`,
          );
        }
        const data = await res.json();
        const list = Array.isArray(data.tents) ? data.tents : [];

        const mapped = list.map((t: any, idx: number) => ({
          id: t._id,
          sno: idx + 1,
          tentSpot: t.tentSpot?._id || "",
          tentSpotName: t.tentSpot?.spotName || "Unknown",
          tentType: t.tentType?._id || "",
          tentTypeName: t.tentType?.tentType || "Unknown",
          noOfGuests: t.noOfGuests || 0,
          noOfChildren: t.noOfChildren || 0,
          tentId: t.tentId || "",
          rate: t.rate || 0,
          tentCount: t.tentCount || 1,
          images: t.images || [],
          isActive: !t.isDisabled,
        }));

        setTents(mapped);
      } catch (err: any) {
        console.error("Failed to load tents", err);
        setLoadError(err.message || "Failed to load tents");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTents();
  }, []);

  useEffect(() => {
    tentsRef.current = tents;
  }, [tents]);
  useEffect(() => {
    permsRef.current = perms;
  }, [perms]);



  const openForView = (tent: Tent) => {
    setSelectedTent(tent);
    setEditNoOfGuests(tent.noOfGuests);
    setEditNoOfChildren(tent.noOfChildren);
    setEditRate(tent.rate);
    setEditTentCount(tent.tentCount);
    setNewImages([]);
    setSheetMode("view");
    setIsDetailSheetOpen(true);
  };

  const handleEdit = (tent: Tent) => {
    if (!permsRef.current.canEdit) return;
    openForView(tent);
    setSheetMode("edit");
  };

  const columns = [
    { data: "sno", title: "S.No" },
    { data: "tentSpotName", title: "Tent Spot" },
    { data: "tentTypeName", title: "Tent Type" },
    { data: "noOfGuests", title: "No. of Guests" },
    { data: "noOfChildren", title: "No. of Children" },
    { data: "tentId", title: "Tent ID" },
    {
      data: "rate",
      title: "Rate (₹)",
      render: (data: number) => `₹${data.toLocaleString()}`,
    },
    { data: "tentCount", title: "Tent Count" },
    {
      data: "images",
      title: "Images",
      render: (data: any[]) =>
        data && data.length > 0 ? `${data.length} image(s)` : "No images",
    },
    {
      data: "isActive",
      title: "Status",
      render: (data: boolean) => `
        <span style="padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: 500;
        color: ${data ? "#15803d" : "#b91c1c"};
        background-color: ${data ? "#dcfce7" : "#fee2e2"};">
          ${data ? "Active" : "Inactive"}
        </span>`,
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      searchable: false,
      render: (_data: any, _type: any, row: Tent) => {
        return `
          <div style="display: flex; gap: 8px; align-items: center;">
            <button 
              class="view-btn" 
              data-id="${row.id}"
              style="background: #10b981; color: white; border: none; padding: 6px 12px;
                border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer;"
              title="View Tent Details"
            >
              View
            </button>
            ${perms.canEdit
            ? `
            <button 
              class="edit-btn" 
              data-id="${row.id}"
              style="background: #3b82f6; color: white; border: none; padding: 6px 12px;
                border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer;"
              title="Edit Tent"
            >
              Edit
            </button>`
            : ""
          }
          </div>
        `;
      },
    },
  ];

  // Handle button clicks in table
  useEffect(() => {
    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest("button") as HTMLElement | null;
      if (button?.classList.contains("view-btn")) {
        event.stopPropagation();
        const tentId = button.getAttribute("data-id") || "";
        const tent = tentsRef.current.find((t) => t.id === tentId);
        if (tent) openForView(tent);
        return;
      }
      if (button?.classList.contains("edit-btn")) {
        event.stopPropagation();
        const tentId = button.getAttribute("data-id") || "";
        const tent = tentsRef.current.find((t) => t.id === tentId);
        if (!tent) return;
        if (!permsRef.current.canEdit) return;
        handleEdit(tent);
        return;
      }

      // Row click opens view-only detail
      const row = target.closest("tr");
      if (row && row.parentElement?.tagName === "TBODY") {
        const rowIndex = Array.from(row.parentElement.children).indexOf(
          row as any,
        );
        const tent = tentsRef.current[rowIndex];
        if (tent) openForView(tent);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleDeleteImage = async (publicId: string) => {
    if (!perms.canEdit) return;
    if (!selectedTent) {
      alert("No tent selected.");
      return;
    }

    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }

    setDeletingImage(publicId);
    try {
      const apiBase =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("admin_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiBase}/api/tents/${selectedTent.id}/image`, {
        method: "DELETE",
        headers,
        body: JSON.stringify({ public_id: publicId }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && data.error) || res.statusText);

      // Update local state
      if (data && data.tent) {
        const updatedImages = data.tent.images || [];
        setSelectedTent((prev) =>
          prev ? { ...prev, images: updatedImages } : prev,
        );
        setTents((prev) =>
          prev.map((t) =>
            t.id === selectedTent.id ? { ...t, images: updatedImages } : t,
          ),
        );
      }

      alert("Image deleted successfully!");
    } catch (e: any) {
      console.error(e);
      alert("Failed to delete image: " + e.message);
    } finally {
      setDeletingImage(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!perms.canEdit || !selectedTent) return;

    try {
      const apiBase =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("admin_token");

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Use FormData if there are new images
      if (newImages.length > 0) {
        const formData = new FormData();
        newImages.forEach((file) => {
          formData.append("images", file);
        });

        // Append other fields
        formData.append("noOfGuests", String(editNoOfGuests));
        formData.append("noOfChildren", String(editNoOfChildren));
        formData.append("rate", String(editRate));
        formData.append("tentCount", String(editTentCount));

        const response = await fetch(
          `${apiBase}/api/tents/${selectedTent.id}`,
          {
            method: "PUT",
            headers,
            body: formData,
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to update tent");
        }

        // Update local state with new images
        if (data && data.tent) {
          const updatedImages = data.tent.images || [];
          setSelectedTent((prev) =>
            prev
              ? {
                ...prev,
                images: updatedImages,
                noOfGuests: editNoOfGuests,
                noOfChildren: editNoOfChildren,
                rate: editRate,
                tentCount: editTentCount,
              }
              : prev,
          );
          setTents((prev) =>
            prev.map((t) =>
              t.id === selectedTent.id
                ? {
                  ...t,
                  images: updatedImages,
                  noOfGuests: editNoOfGuests,
                  noOfChildren: editNoOfChildren,
                  rate: editRate,
                  tentCount: editTentCount,
                }
                : t,
            ),
          );
        }
      } else {
        // No new images, use JSON
        const updateData = {
          noOfGuests: editNoOfGuests,
          noOfChildren: editNoOfChildren,
          rate: editRate,
          tentCount: editTentCount,
        };

        const response = await fetch(
          `${apiBase}/api/tents/${selectedTent.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...headers,
            },
            body: JSON.stringify(updateData),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to update tent");
        }

        // Update local state
        setTents((prev) =>
          prev.map((t) =>
            t.id === selectedTent.id
              ? {
                ...t,
                noOfGuests: editNoOfGuests,
                noOfChildren: editNoOfChildren,
                rate: editRate,
                tentCount: editTentCount,
              }
              : t,
          ),
        );
      }

      setSheetMode("view");
      setNewImages([]);
      alert("Tent updated successfully!");
    } catch (err: any) {
      console.error("Failed to update tent:", err);
      alert("Failed to update tent: " + (err.message || String(err)));
    }
  };

  return (
    <div className="flex flex-col h-full max-h-screen overflow-hidden py-6">
      <style>{`
        @media (max-width: 768px) {
          .tent-inventory-table-container .dt-layout-row {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
          }

          .tent-inventory-table-container .dt-layout-cell {
            display: inline-flex !important;
            align-items: center !important;
            flex-wrap: nowrap !important;
          }

          .tent-inventory-table-container .dt-layout-start {
            order: 1 !important;
          }

          .tent-inventory-table-container .dt-layout-end {
            order: 2 !important;
            margin-left: auto !important;
          }

          .tent-inventory-table-container .dt-buttons {
            display: inline-flex !important;
          }

          .tent-inventory-table-container .dt-buttons button {
            font-size: 11px !important;
            padding: 4px 8px !important;
            white-space: nowrap !important;
          }

          .tent-inventory-table-container .dt-search {
            display: inline-flex !important;
            align-items: center !important;
          }

          .tent-inventory-table-container .dt-search input {
            font-size: 10px !important;
            padding: 4px 6px !important;
            width: 140px !important;
          }

          .tent-inventory-table-container .dt-length {
            order: 3 !important;
            flex-basis: 100% !important;
            margin-top: 8px !important;
          }

          .tent-inventory-table-container .dt-length select {
            font-size: 11px !important;
            padding: 4px 6px !important;
          }

          .tent-inventory-table-container .dt-length label {
            font-size: 11px !important;
          }

          .tent-inventory-table-container .dt-paging {
            order: 4 !important;
            flex-basis: 100% !important;
            margin-top: 8px !important;
            display: flex !important;
            justify-content: flex-end !important;
          }

          .tent-inventory-table-container .dt-paging button {
            font-size: 10px !important;
            padding: 4px 8px !important;
          }

          .tent-inventory-table-container .dt-info {
            display: none !important;
          }
        }
      `}</style>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold text-slate-800">All Tents</h2>
        <ExportButton
          data={tents}
          dtRef={dtRef}
          headers={[
            "S.No",
            "Tent Spot",
            "Tent Type",
            "No. of Guests",
            "No. of Children",
            "Tent ID",
            "Rate (₹)",
            "Tent Count",
            "Images",
            "Status"
          ]}
          mapRow={(tent: any) => [
            tent.sno,
            tent.tentSpotName,
            tent.tentTypeName,
            tent.noOfGuests,
            tent.noOfChildren,
            tent.tentId,
            tent.rate,
            tent.tentCount,
            tent.images?.length || 0,
            tent.isActive ? "Active" : "Inactive"
          ]}
          filename="Tents_Records.csv"
          disabled={!perms.canExport}
        />
      </div>

      <div
        ref={tableRef}
        className="tent-inventory-table-container flex-1 overflow-hidden"
      >
        {isLoading && <PageLoader message="Loading tents..." />}
        {loadError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-md text-red-800 mb-3">
            {loadError}
          </div>
        )}
        <DataTable

          data={tents}
          columns={columns}
          dtRef={dtRef}

        />
      </div>

      {/* small style for truncation/ellipsis */}
      <style>{`
        .dt-ellipsis{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block}
        .dt-center{text-align:center}
      `}</style>

      {/* Detail Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[600px] lg:w-[800px] flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>Tent Details</SheetTitle>
            <SheetDescription>
              Complete information about the selected tent
            </SheetDescription>
          </SheetHeader>

          {selectedTent && (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <Label>S.No</Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    {selectedTent.sno}
                  </div>
                </div>

                <div>
                  <Label>Tent Spot</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                    {selectedTent.tentSpotName}
                  </div>
                </div>

                <div>
                  <Label>Tent Type</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                    {selectedTent.tentTypeName}
                  </div>
                </div>

                <div>
                  <Label>No. of Guests</Label>
                  {sheetMode === "edit" ? (
                    <Input
                      type="number"
                      value={editNoOfGuests}
                      onChange={(e) =>
                        setEditNoOfGuests(Number(e.target.value))
                      }
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      {selectedTent.noOfGuests}
                    </div>
                  )}
                </div>

                <div>
                  <Label>No. of Children</Label>
                  {sheetMode === "edit" ? (
                    <Input
                      type="number"
                      min={0}
                      value={editNoOfChildren}
                      onChange={(e) =>
                        setEditNoOfChildren(Number(e.target.value))
                      }
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      {selectedTent.noOfChildren}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Tent ID</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md border font-mono text-blue-600">
                    {selectedTent.tentId}
                  </div>
                </div>

                <div>
                  <Label>Rate (₹)</Label>
                  {sheetMode === "edit" ? (
                    <Input
                      type="number"
                      value={editRate}
                      onChange={(e) => setEditRate(Number(e.target.value))}
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      ₹{selectedTent.rate.toLocaleString()}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Tent Count</Label>
                  {sheetMode === "edit" ? (
                    <Input
                      type="number"
                      min={1}
                      value={editTentCount}
                      onChange={(e) => setEditTentCount(Number(e.target.value))}
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      {selectedTent.tentCount}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Number of times this tent can be booked for the same dates
                  </p>
                </div>

                <div>
                  <Label>Images</Label>
                  <div className="mt-1 space-y-2">
                    {/* Display existing images */}
                    {selectedTent.images && selectedTent.images.length > 0 ? (
                      <div className="space-y-2">
                        <span className="text-green-600 text-sm">
                          ✓ {selectedTent.images.length} image(s) uploaded
                        </span>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {selectedTent.images.map((img, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={img.url}
                                alt={`Tent ${idx + 1}`}
                                className="w-full h-32 object-cover rounded-md border"
                              />
                              {sheetMode === "edit" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteImage(img.public_id)
                                  }
                                  disabled={deletingImage === img.public_id}
                                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                  title="Delete image"
                                >
                                  {deletingImage === img.public_id ? (
                                    <svg
                                      className="w-4 h-4 animate-spin"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      ></circle>
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      ></path>
                                    </svg>
                                  ) : (
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  )}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-red-600 text-sm">
                        ✗ No images uploaded
                      </span>
                    )}

                    {/* Upload new images in edit mode */}
                    {sheetMode === "edit" && (
                      <div className="mt-2">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files) {
                              setNewImages(Array.from(files));
                            }
                          }}
                          className="w-full p-2 text-sm border rounded-md"
                        />
                        {newImages.length > 0 && (
                          <p className="text-xs text-green-600 mt-1">
                            {newImages.length} new image(s) selected
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Select new images to add (will be appended to existing
                          images)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 flex flex-wrap gap-2 p-6 pt-4 border-t bg-white">
                {sheetMode === "view" ? (
                  <>
                    <Button
                      onClick={() => setSheetMode("edit")}
                      disabled={!perms.canEdit}
                      title={
                        !perms.canEdit
                          ? "You do not have permission to edit"
                          : undefined
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsDetailSheetOpen(false)}
                      className="flex-1 sm:flex-none"
                    >
                      Close
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setSheetMode("view")}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveEdit}
                      disabled={!perms.canEdit}
                      title={
                        !perms.canEdit
                          ? "You do not have permission to save"
                          : undefined
                      }
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsDetailSheetOpen(false)}
                      className="flex-1 sm:flex-none"
                    >
                      Close
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
