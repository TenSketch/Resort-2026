import React, { useEffect, useRef } from "react";
import $ from "jquery";

import "datatables.net-dt";
import "datatables.net-buttons";
import "datatables.net-buttons/js/buttons.html5";
import "datatables.net-buttons/js/buttons.colVis";

import "datatables.net-dt/css/dataTables.dataTables.css";
import "datatables.net-buttons-dt/css/buttons.dataTables.css";
import "datatables.net-columncontrol-dt";
import "datatables.net-columncontrol-dt/css/columnControl.dataTables.css";
import "../dataTable/DataTable.css";

(window as any).$ = $;
(window as any).jQuery = $;

interface Props {
  data: any[];
  columns: any[];
  height?: string;
  dtRef?: React.MutableRefObject<any>;
}

const DataTable: React.FC<Props> = ({
  data,
  columns,
  height = "400px",
  dtRef,
}) => {
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (!tableRef.current) return;

    const table = $(tableRef.current).DataTable({
      data,
      columns,
      destroy: true,

      pageLength: 10,
      lengthMenu: [5, 10, 25, 50, 100],
      order: [[0, "asc"]],
      searching: true,
      paging: true,
      info: true,
      scrollX: true,
      scrollCollapse: true,
      scrollY: height || "400px",

      columnControl: [
        "order",
        ["orderAsc", "orderDesc", "spacer", "search"],
      ],

      language: {
        paginate: {
          first: "«",
          last: "»",
          next: "›",
          previous: "‹",
        },
      },

      layout: {
        topStart: ["info", "buttons"],
        topEnd: "search",
        bottomStart: "pageLength",
        bottomEnd: "paging",
      },

      buttons: [
        {
          extend: "colvis",
          text: "Column Visibility",
          collectionLayout: "fixed two-column",
        },
      ],

      initComplete: function () {
        const api = (this as any).api();
        const wrapper = api.table().container();

        const moveResetButton = () => {
          const btn = wrapper.querySelector(".reset-filters-btn") as HTMLElement;
          if (!btn) return;

          const isMobile = window.innerWidth < 1024;
          const buttonsContainer = wrapper.querySelector(".dt-buttons");
          const searchContainer = wrapper.querySelector(".dt-search");

          if (isMobile && buttonsContainer) {
            if (btn.parentElement !== buttonsContainer) {
              buttonsContainer.appendChild(btn);
            }
          } else if (!isMobile && searchContainer) {
            if (btn.parentElement !== searchContainer) {
              searchContainer.appendChild(btn);
            }
          }
        };

        if (!wrapper.querySelector(".reset-filters-btn")) {
          const btn = document.createElement("button");
          btn.className = "reset-filters-btn";
          btn.textContent = "Reset Filters";

          btn.onclick = () => {
            api.search("").columns().search("");

            wrapper.querySelectorAll("input").forEach((input: any) => {
              input.value = "";
              input.dispatchEvent(new Event("input", { bubbles: true }));
              input.dispatchEvent(new Event("change", { bubbles: true }));
            });

            wrapper.querySelectorAll("select").forEach((select: any) => {
              if (select.options.length > 0) {
                select.selectedIndex = 0;
                select.dispatchEvent(new Event("change", { bubbles: true }));
              }
            });

            wrapper.querySelectorAll(".dtcc-button_active").forEach((btn: any) => {
              btn.classList.remove("dtcc-button_active");
            });

            api.draw();
          };

          const initialTarget =
            window.innerWidth < 1024
              ? wrapper.querySelector(".dt-buttons")
              : wrapper.querySelector(".dt-search");

          if (initialTarget) {
            initialTarget.appendChild(btn);
          } else {
            wrapper.appendChild(btn);
          }

          window.addEventListener("resize", moveResetButton);
        }
      },
    } as any);

    if (dtRef) {
      dtRef.current = table;
    }

    return () => {
      table.destroy();
      if (dtRef) {
        dtRef.current = null;
      }
    };
  }, [data, columns, height, dtRef]);

  return (
    <div className="w-full">
      <table ref={tableRef} className="display nowrap w-full" />
    </div>
  );
};

export default DataTable;