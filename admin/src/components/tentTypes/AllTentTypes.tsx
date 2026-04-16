
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


interface TentType {
  id: string;
  sno: number;
  tentType: string;
  accommodationType: string;
  tentBase: string;
  dimensions: string;
  brand: string;
  features: string;
  price: number;
  amenities: string;
  isActive: boolean;
}

export default function AllTentTypesTable() {
  const tableRef = useRef(null);
  const dtRef = useRef<any>(null);
  const perms = usePermissions();
  const permsRef = useRef(perms);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"view" | "edit">("view");
  const [selectedTent, setSelectedTent] = useState<TentType | null>(null);
  const [tentTypes, setTentTypes] = useState<TentType[]>([]);
  const tentTypesRef = useRef<TentType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editTentType, setEditTentType] = useState("");
  const [editAccommodationType, setEditAccommodationType] = useState("");
  const [editTentBase, setEditTentBase] = useState("");
  const [editDimensions, setEditDimensions] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editFeatures, setEditFeatures] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editAmenities, setEditAmenities] = useState("");

  // Fetch tent types from backend
  useEffect(() => {
    const apiBase =
      (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";
    const fetchTentTypes = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`${apiBase}/api/tent-types`);
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(
            e.error || `Failed to fetch tent types (status ${res.status})`,
          );
        }
        const data = await res.json();
        // Expected shape: { tentTypes: [ ... ] }
        const list = Array.isArray(data.tentTypes) ? data.tentTypes : [];
        // Map server objects to UI TentType shape
        const mapped = list.map((t: any, idx: number) => ({
          id: t._id,
          sno: idx + 1,
          tentType: t.tentType || "",
          accommodationType: t.accommodationType || "",
          tentBase: t.tentBase || "",
          dimensions: t.dimensions || "",
          brand: t.brand || "",
          features: t.features || "",
          price: t.pricePerDay || t.price || 0,
          amenities: Array.isArray(t.amenities)
            ? t.amenities.join(", ")
            : t.amenities || "",
          isActive: !t.isDisabled,
        }));
        setTentTypes(mapped);
      } catch (err: any) {
        console.error("Failed to load tent types", err);
        setLoadError(err.message || "Failed to load tent types");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTentTypes();
  }, []);

  // keep refs up to date for DOM handlers
  useEffect(() => {
    tentTypesRef.current = tentTypes;
  }, [tentTypes]);
  useEffect(() => {
    permsRef.current = perms;
  }, [perms]);



  const openForView = (tent: TentType) => {
    setSelectedTent(tent);
    setEditTentType(tent.tentType);
    setEditAccommodationType(tent.accommodationType);
    setEditTentBase(tent.tentBase);
    setEditDimensions(tent.dimensions);
    setEditBrand(tent.brand);
    setEditFeatures(tent.features);
    setEditPrice(String(tent.price));
    setEditAmenities(tent.amenities);
    setSheetMode("view");
    setIsDetailSheetOpen(true);
  };

  const handleEdit = (tent: TentType) => {
    if (!permsRef.current.canEdit) return;
    openForView(tent);
    setSheetMode("edit");
  };

  const columns = [
    { data: "sno", title: "S.No" },
    { data: "tentType", title: "Tent Type" },
    { data: "accommodationType", title: "Accommodation Type" },
    { data: "tentBase", title: "Tent Base" },
    { data: "dimensions", title: "Dimensions" },
    { data: "brand", title: "Brand" },
    {
      data: "features",
      title: "Features",
      render: (data: string) =>
        `<div style="white-space:pre-wrap; max-width:300px">${data}</div>`,
    },
    {
      data: "price",
      title: "Price (₹)",
      render: (data: number) => `₹${data.toLocaleString()}`,
    },
    {
      data: "amenities",
      title: "Amenities",
      render: (data: string) =>
        `<div style="white-space:pre-wrap; max-width:300px">${data}</div>`,
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
      render: (_data: any, _type: any, row: TentType) => {
        return `
          <div style="display: flex; gap: 8px; align-items: center;">
            <button 
              class="view-btn" 
              data-id="${row.id}"
              style="background: #10b981; color: white; border: none; padding: 6px 12px;
                border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer;"
              title="View Tent Type"
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
              title="Edit Tent Type"
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
        const tent = tentTypesRef.current.find((t) => t.id === tentId);
        if (tent) openForView(tent);
        return;
      }
      if (button?.classList.contains("edit-btn")) {
        event.stopPropagation();
        const tentId = button.getAttribute("data-id") || "";
        const tent = tentTypesRef.current.find((t) => t.id === tentId);
        if (!tent) return;
        if (!permsRef.current.canEdit) return;
        handleEdit(tent);
        return;
      }

      // Row click opens view-only sheet
      const row = target.closest("tr");
      if (row && row.parentElement?.tagName === "TBODY") {
        const rowIndex = Array.from(row.parentElement.children).indexOf(
          row as any,
        );
        const tent = tentTypesRef.current[rowIndex];
        if (tent) openForView(tent);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="flex flex-col h-full max-h-screen overflow-hidden py-6">
      <style>{`
        @media (max-width: 768px) {
          .tent-types-table-container .dt-layout-row {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
          }

          .tent-types-table-container .dt-layout-cell {
            display: inline-flex !important;
            align-items: center !important;
            flex-wrap: nowrap !important;
          }

          .tent-types-table-container .dt-layout-start {
            order: 1 !important;
          }

          .tent-types-table-container .dt-layout-end {
            order: 2 !important;
            margin-left: auto !important;
          }

          .tent-types-table-container .dt-buttons {
            display: inline-flex !important;
          }

          .tent-types-table-container .dt-buttons button {
            font-size: 11px !important;
            padding: 4px 8px !important;
            white-space: nowrap !important;
          }

          .tent-types-table-container .dt-search {
            display: inline-flex !important;
            align-items: center !important;
          }

          .tent-types-table-container .dt-search input {
            font-size: 10px !important;
            padding: 4px 6px !important;
            width: 140px !important;
          }

          .tent-types-table-container .dt-length {
            order: 3 !important;
            flex-basis: 100% !important;
            margin-top: 8px !important;
          }

          .tent-types-table-container .dt-length select {
            font-size: 11px !important;
            padding: 4px 6px !important;
          }

          .tent-types-table-container .dt-length label {
            font-size: 11px !important;
          }

          .tent-types-table-container .dt-paging {
            order: 4 !important;
            flex-basis: 100% !important;
            margin-top: 8px !important;
            display: flex !important;
            justify-content: flex-end !important;
          }

          .tent-types-table-container .dt-paging button {
            font-size: 10px !important;
            padding: 4px 8px !important;
          }

          .tent-types-table-container .dt-info {
            display: none !important;
          }
        }
      `}</style>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold text-slate-800">Tent Types</h2>
        <ExportButton
          data={tentTypes}
          dtRef={dtRef}
          headers={[
            "S.No",
            "Tent Type",
            "Accommodation Type",
            "Tent Base",
            "Dimensions",
            "Brand",
            "Features",
            "Price (₹)",
            "Amenities",
            "Status",
          ]}
          mapRow={(tent: any) => [
            tent.sno,
            tent.tentType,
            tent.accommodationType,
            tent.tentBase,
            tent.dimensions,
            tent.brand,
            String(tent.features).replace(/\n/g, " "),
            `₹${tent.price.toLocaleString()}`,
            String(tent.amenities).replace(/\n/g, " "),
            tent.isActive ? "Active" : "Inactive"
          ]}
          filename="Tent_Types_Records.csv"
          disabled={!perms.canExport}
        />
      </div>

      <div
        ref={tableRef}
        className="tent-types-table-container flex-1 overflow-hidden"
      >
        {isLoading && <PageLoader message="Loading tent types..." />}
        {loadError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-md text-red-800 mb-3">
            {loadError}
          </div>
        )}
        <DataTable

          data={tentTypes}
          columns={columns}
          dtRef={dtRef}

        />
      </div>

      {/* Detail Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[600px] lg:w-[800px] flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>Tent Details</SheetTitle>
            <SheetDescription>
              Complete information about the selected tent type
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
                  <Label>Tent Type</Label>
                  {sheetMode === "edit" ? (
                    <Input
                      value={editTentType}
                      onChange={(e) => setEditTentType(e.target.value)}
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      {selectedTent.tentType}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Accommodation Type</Label>
                  {sheetMode === "edit" ? (
                    <Input
                      value={editAccommodationType}
                      onChange={(e) => setEditAccommodationType(e.target.value)}
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      {selectedTent.accommodationType}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Tent Base</Label>
                  {sheetMode === "edit" ? (
                    <Input
                      value={editTentBase}
                      onChange={(e) => setEditTentBase(e.target.value)}
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      {selectedTent.tentBase}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Dimensions</Label>
                  {sheetMode === "edit" ? (
                    <Input
                      value={editDimensions}
                      onChange={(e) => setEditDimensions(e.target.value)}
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      {selectedTent.dimensions}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Brand name</Label>
                  {sheetMode === "edit" ? (
                    <Input
                      value={editBrand}
                      onChange={(e) => setEditBrand(e.target.value)}
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      {selectedTent.brand}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Features</Label>
                  {sheetMode === "edit" ? (
                    <textarea
                      rows={4}
                      value={editFeatures}
                      onChange={(e) => setEditFeatures(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-slate-50"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border whitespace-pre-wrap">
                      {selectedTent.features}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Price</Label>
                  {sheetMode === "edit" ? (
                    <Input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      ₹{selectedTent.price.toLocaleString()}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Amenities</Label>
                  {sheetMode === "edit" ? (
                    <textarea
                      rows={3}
                      value={editAmenities}
                      onChange={(e) => setEditAmenities(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-slate-50"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border whitespace-pre-wrap">
                      {selectedTent.amenities}
                    </div>
                  )}
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
                      onClick={async () => {
                        if (!perms.canEdit) return;

                        try {
                          const apiBase =
                            (import.meta as any).env?.VITE_API_URL ||
                            "http://localhost:5000";
                          const token = localStorage.getItem("admin_token");

                          const updateData = {
                            tentType: editTentType,
                            accommodationType: editAccommodationType,
                            tentBase: editTentBase,
                            dimensions: editDimensions,
                            brand: editBrand,
                            features: editFeatures,
                            pricePerDay: Number(editPrice),
                            amenities: editAmenities
                              .split(",")
                              .map((a) => a.trim())
                              .filter(Boolean),
                          };

                          const headers: Record<string, string> = {
                            "Content-Type": "application/json",
                          };
                          if (token) {
                            headers["Authorization"] = `Bearer ${token}`;
                          }

                          const response = await fetch(
                            `${apiBase}/api/tent-types/${selectedTent.id}`,
                            {
                              method: "PUT",
                              headers,
                              body: JSON.stringify(updateData),
                            },
                          );

                          const data = await response.json();

                          if (!response.ok) {
                            throw new Error(
                              data.error || "Failed to update tent type",
                            );
                          }

                          // Update local state
                          setTentTypes((prev) =>
                            prev.map((t) =>
                              t.id === selectedTent.id
                                ? {
                                  ...t,
                                  tentType: editTentType,
                                  accommodationType: editAccommodationType,
                                  tentBase: editTentBase,
                                  dimensions: editDimensions,
                                  brand: editBrand,
                                  features: editFeatures,
                                  price: Number(editPrice),
                                  amenities: editAmenities,
                                }
                                : t,
                            ),
                          );
                          setSheetMode("view");
                          setIsDetailSheetOpen(false);
                          alert("Tent type updated successfully!");
                        } catch (err: any) {
                          console.error("Failed to update tent type:", err);
                          alert(
                            "Failed to update tent type: " +
                            (err.message || String(err)),
                          );
                        }
                      }}
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
