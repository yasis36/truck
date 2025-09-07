import React, { useEffect, useMemo, useState } from "react";
import {
  MaterialReactTable,
  MRT_GlobalFilterTextField,
  useMaterialReactTable,
} from "material-react-table";
import { Box } from "@mui/material";
import { Download, Filter as FilterIcon, Globe, ChevronLeft, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
// NOTE: file-saver import removed due to CDN esm export mismatch. We use a dynamic import helper below.
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ========================= i18n SETUP (self-contained demo) =========================
// In a real app, move this to its own file and load resources asynchronously.
const resources = {
  en: {
    translation: {
      common: {
        back: "Back",
        refresh: "Refresh",
        export: "Export",
        language: "Language",
      },
      table: {
        title: "Drivers",
        headers: {
          id: "ID",
          name: "Name",
          status: "Status",
          location: "Location",
          createdAt: "Created At",
          time: "Time",
        },
        empty: "No rows match your filters.",
      },
      filters: {
        title: "Filters",
        status: "Driver Status",
        location: "Location (contains)",
        dateRange: "Created Date Range",
        presets: {
          last7: "Last 7 days",
          last30: "Last 30 days",
          thisQ: "This quarter",
          lastNYears: "Last {{n}} years",
          custom: "Custom",
        },
        apply: "Apply",
        clear: "Clear All",
      },
      export: {
        csv: "CSV",
        xlsx: "Excel",
        pdf: "PDF",
        qb: "QuickBooks (JSON)",
        fmcsa: "FMCSA (PDF)",
      },
    },
  },
  Amh: {
    translation: {
      common: {
        back: "ተመለስ",
        refresh: "አድስ",
        export: "ወደ ውጪ ላክ",
        language: "ቋንቋ",
      },
      table: {
        title: "አሽከርካሪዎች",
        headers: {
          id: "መታወቂያ",
          name: "ስም",
          status: "ሁኔታ",
          location: "አካባቢ",
          createdAt: "የተፈጠረው በ",
        },
        empty: "ምንም ረድፎች ከእርስዎ ማጣሪያዎች ጋር አይዛመዱም።",
      },
      filters: {
        title: "ማጣሪያዎች",
        status: "የአሽከርካሪ ሁኔታ",
        location: "አካባቢ (ያለው)",
        dateRange: "የተፈጠረ የቀን ክልል",
        presets: {
          last7: "ያለፉት 7 ቀናት",
          last30: "ያለፉት 30 ቀናት",
          thisQ: "በዚህ ሩብ",
          lastNYears: "ያለፉት {{n}} ዓመታት",
          custom: "Custom",
        },
        apply: "ያመልክቱ",
        clear: "ሁሉንም አጽዳ",
      },
      export: {
        csv: "CSV",
        xlsx: "Excel",
        pdf: "PDF",
        qb: "QuickBooks (JSON)",
        fmcsa: "FMCSA (PDF)",
      },
    },
  },
  es: {
    translation: {
      common: {
        back: "Atrás",
        refresh: "Actualizar",
        export: "Exportar",
        language: "Idioma",
      },
      table: {
        title: "Conductores",
        headers: {
          id: "ID",
          name: "Nombre",
          status: "Estado",
          location: "Ubicación",
          createdAt: "Creado",
        },
        empty: "No hay filas que coincidan con los filtros.",
      },
      filters: {
        title: "Filtros",
        status: "Estado del conductor",
        location: "Ubicación (contiene)",
        dateRange: "Rango de fechas",
        presets: {
          last7: "Últimos 7 días",
          last30: "Últimos 30 días",
          thisQ: "Este trimestre",
          lastNYears: "Últimos {{n}} años",
          custom: "Personalizado",
        },
        apply: "Aplicar",
        clear: "Limpiar",
      },
      export: {
        csv: "CSV",
        xlsx: "Excel",
        pdf: "PDF",
        qb: "QuickBooks (JSON)",
        fmcsa: "FMCSA (PDF)",
      },
    },
  },
  
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}

// ========================= MOCK DATA (local) =========================
const mockDrivers = [
  { id: 1, name: "Aiden Cole", status: "Active", location: "Dallas, TX", createdAt: "2025-07-25",Time: "10:30 AM" },
  { id: 2, name: "Bea Flores", status: "Inactive", location: "Miami, FL", createdAt: "2025-06-18",Time: "02:15 PM" },
  { id: 3, name: "Chen Li", status: "Active", location: "Seattle, WA", createdAt: "2024-11-02",Time: "09:30 AM" },
  { id: 4, name: "Diego Soto", status: "Active", location: "Austin, TX", createdAt: "2023-03-11",Time: "01:45 PM" },
  { id: 5, name: "Emma Rossi", status: "Inactive", location: "Denver, CO", createdAt: "2022-08-30",Time: "11:00 AM" },
  { id: 6, name: "Fatima Noor", status: "Active", location: "Phoenix, AZ", createdAt: "2020-04-09",Time: "03:20 PM" },
  { id: 7, name: "Gustav Klein", status: "Inactive", location: "Boston, MA", createdAt: "2019-12-20",Time: "08:15 AM" },
  { id: 8, name: "Hana Yamada", status: "Active", location: "San Francisco, CA", createdAt: "2021-05-14",Time: "12:30 PM" },
  { id: 9, name: "Ivan Petrov", status: "Active", location: "Chicago, IL", createdAt: "2023-09-05",Time: "04:45 PM" },
  { id: 10, name: "Jade Nguyen", status: "Inactive", location: "Houston, TX", createdAt: "2024-01-22",Time: "10:00 AM" },
  { id: 11, name: "Kofi Mensah", status: "Active", location: "Atlanta, GA", createdAt: "2025-02-28",Time: "02:30 PM" },
  { id: 12, name: "Lina Svensson", status: "Inactive", location: "Minneapolis, MN", createdAt: "2022-10-16",Time: "09:45 AM" },
  { id: 13, name: "Mateo García", status: "Active", location: "Orlando, FL", createdAt: "2023-06-03",Time: "01:15 PM" },
  { id: 14, name: "Nia Johnson", status: "Active", location: "Philadelphia, PA", createdAt: "2024-12-12",Time: "11:30 AM" },
  { id: 15, name: "Omar Hassan", status: "Inactive", location: "Las Vegas, NV", createdAt: "2021-07-27",Time: "03:00 PM" },
  { id: 16, name: "Priya Singh", status: "Active", location: "San Diego, CA", createdAt: "2020-09-19",Time: "08:30 AM" },
  { id: 17, name: "Quinn Murphy", status: "Inactive", location: "Columbus, OH", createdAt: "2019-11-08",Time: "12:00 PM" },
  { id: 18, name: "Ravi Kumar", status: "Active", location: "Nashville, TN", createdAt: "2022-03-22",Time: "04:15 PM" },
  { id: 19, name: "Sofia Petrova", status: "Active", location: "Detroit, MI", createdAt: "2023-08-29",Time: "10:45 AM" },
  { id: 20, name: "Tomás Silva", status: "Inactive", location: "Portland, OR", createdAt: "2024-05-07",Time: "02:00 PM" },
];

// ========================= CONFIG =========================
// const config = {
  // Switch between mock and API
// Put this at the top of your component
  // ✅ inside your component, at the top (before any return)
export default function DriversPage() {
    const [dataSourceType, setDataSourceType] = useState("mock"); // or "api"

// Update config to use the state
const config = {

  dataSource: {
    type: dataSourceType,
    apiUrl: "/api/drivers/drivers.json",
  },
  // ...



  // dataSource: {
  //   type: "api", // "mock" | "api"
  //   apiUrl: "/api/drivers/drivers.json", // used when type === "api"
  // },
  i18nKeys: {
    headers: {
      id: "table.headers.id",
      name: "table.headers.name",
      status: "table.headers.status",
      location: "table.headers.location",
      createdAt: "table.headers.createdAt",
      time: "table.headers.time",


    },
    common: {
      back: "common.back",
      refresh: "common.refresh",
      export: "common.export",
      language: "common.language",
    },
    filters: {
      title: "filters.title",
      status: "filters.status",
      location: "filters.location",
      dateRange: "filters.dateRange",
      presets: {
        last7: "filters.presets.last7",
        last30: "filters.presets.last30",
        thisQ: "filters.presets.thisQ",
        lastNYears: "filters.presets.lastNYears",
        custom: "filters.presets.custom",
      },
      apply: "filters.apply",
      clear: "filters.clear",
    },
    export: {
      csv: "export.csv",
      xlsx: "export.xlsx",
      pdf: "export.pdf",
      qb: "export.qb",
      fmcsa: "export.fmcsa",
    },
  },
  // Filter control schema (config-driven, no hardcoding)
  filters: [
    {
      key: "status",
      type: "dropdown", // dropdown | text | daterange 
      labelKey: "filters.status",
      options: [
        { label: "Active", value: "Active" },
        { label: "Inactive", value: "Inactive" },
      ],
      multi: true,
    },
    {
      key: "location",
      type: "text",
      labelKey: "filters.location",
      placeholder: "e.g. Dallas",
    },
    {
      key: "createdAt",
      type: "daterange",
      labelKey: "filters.dateRange",
      presets: [
        { id: "last7", getRange: () => lastNDays(7) },
        { id: "last30", getRange: () => lastNDays(30) },
        { id: "thisQ", getRange: thisQuarter },
        { id: "last5y", getRange: () => lastNYears(5), labelKey: "filters.presets.lastNYears", vars: { n: 5 } },
      ],
      allowCustom: true,
    },
  ],
  // Export configuration
  export: {
    pdf: {
      title: "Driver Report",
      styles: {
        theme: "grid",
      },
    },
    custom: {
      quickbooks: { fileName: "drivers-quickbooks.json" },
      fmcsa: { fileName: "drivers-fmcsa.pdf", title: "FMCSA Driver Roster" },
    },
  },
};

// ========================= DATE HELPERS =========================
function startOfDay(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}
function endOfDay(d) {
  const dt = new Date(d);
  dt.setHours(23, 59, 59, 999);
  return dt;
}
function lastNDays(n) {
  const end = endOfDay(new Date());
  const start = startOfDay(new Date(Date.now() - (n - 1) * 24 * 60 * 60 * 1000));
  return { start, end };
}
function thisQuarter() {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const start = new Date(now.getFullYear(), q * 3, 1);
  const end = new Date(now.getFullYear(), q * 3 + 3, 0);
  return { start: startOfDay(start), end: endOfDay(end) };
}
function lastNYears(n) {
  const now = new Date();
  const start = new Date(now.getFullYear() - n + 1, 0, 1);
  const end = endOfDay(now);
  return { start: startOfDay(start), end };
}

// ========================= FILE-SAVER HELPER (DYNAMIC IMPORT)
// The build error was caused by some CDN+esm bundles not exporting `saveAs` as a named ESM export.
// To be robust we dynamically import file-saver at runtime and attempt several fallback shapes.
function saveBlob(blob, fileName) {
  // return a promise so callers can await if needed
  return import("file-saver")
    .then((mod) => {
      // many bundles export: { saveAs }, or default { saveAs }, or default is the saveAs fn
      const saveCandidate = mod.saveAs ?? (mod.default && mod.default.saveAs) ?? mod.default ?? mod;
      if (typeof saveCandidate === "function") {
        // direct function
        saveCandidate(blob, fileName);
        return;
      }
      if (saveCandidate && typeof saveCandidate.saveAs === "function") {
        saveCandidate.saveAs(blob, fileName);
        return;
      }
      // Fallback manual anchor download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    })
    .catch((err) => {
      // If dynamic import fails (e.g., blocked), fallback to anchor method
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
}

// ========================= UTIL: EXPORTS =========================
function exportCSV(rows, fileName = "drivers.csv") {
  const headers = Object.keys(rows[0] || {});
  const csv = [headers.join(",")].concat(
    rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))
  ).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  // use dynamic save
  return saveBlob(blob, fileName);
}

function exportXLSX(rows, fileName = "drivers.xlsx") {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Drivers");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  return saveBlob(blob, fileName);
}

function exportPDF(rows, columns, options = { title: "Report" }, fileName = "drivers.pdf") {
  const doc = new jsPDF({ orientation: "landscape" });
  
  doc.text(options.title || "Report", 14, 14);
  autoTable(doc, {
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => r[c.accessorKey])),
    theme: options.styles?.theme || "grid",
    styles: { fontSize: 8 },
    startY: 20,
  });
  // jsPDF saves directly in browser; keep synchronous API
  doc.save(fileName);
}

function exportQuickBooksJSON(rows, fileName = "quickbooks.json") {
  // Example mapping to a QB-like structure
  const qb = rows.map((r) => ({
    DisplayName: r.name,
    Active: r.status === "Active",
    BillAddr: { City: r.location },
    MetaData: { CreateTime: r.createdAt },
    Time:{time:r.time},

  }));
  const blob = new Blob([JSON.stringify(qb, null, 2)], { type: "application/json" });
  return saveBlob(blob, fileName);
}

function exportFMCSAPDF(rows, options = { title: "FMCSA" }, fileName = "fmcsa.pdf") {
  const doc = new jsPDF();
  doc.text(options.title || "FMCSA", 14, 16);
  autoTable(doc, {
    head: [["ID", "Name", "Status", "Location", "Created At","Time"]],
    body: rows.map((r) => [r.id, r.name, r.status, r.location, r.createdAt,r.time]),
    theme: "plain",
    styles: { fontSize: 9 },
    startY: 22,
  });
  doc.save(fileName);
}

// ========================= FILTER ENGINE =========================
function applyFilters(rows, activeFilters) {
  return rows.filter((row) => {
    // Status filter (multi-select)
    if (activeFilters.status?.length) {
      if (!activeFilters.status.includes(row.status)) return false;
    }
    // Location text contains
    if (activeFilters.location) {
      const needle = activeFilters.location.toLowerCase();
      if (!String(row.location || "").toLowerCase().includes(needle)) return false;
    }
    // Date range on createdAt
    if (activeFilters.createdAt?.start && activeFilters.createdAt?.end) {
      const ts = new Date(row.createdAt).getTime();
      if (isNaN(ts)) return false;
      if (ts < activeFilters.createdAt.start.getTime()) return false;
      if (ts > activeFilters.createdAt.end.getTime()) return false;
    }
    if(activeFilters.time){
      const time = row.time;
      if (!time || !time.includes(activeFilters.time)) return false;
    }
    return true;
  });
}

// ========================= DETACHED FILTER PANEL =========================
function FilterPanel({ t, schema, value, onChange, onApply, onClear }) {
    const [lang, setLang] = useState(i18n.language || "en");

  // value is an object holding current filter UI state
  return (
    // <div className="w-full lg:w-72 xl:w-80 2xl:w-96 bg-white rounded-2xl shadow p-4 space-y-4 border items-center">
      <div className="filter-panel">

      <div className="flex items-center gap-9 text-lg font-semibold">
        <FilterIcon className="h-5 w-5" /> {t("filters.title")}
      </div>

      {/* Status dropdown (multi) */}
      {/* {schema.find((f) => f.key === "status") && (
        <div className="space-y-1">
          <label className="text-sm font-medium">{t(schema.find((f) => f.key === "status").labelKey)}</label>
          <div className="flex flex-wrap gap-2">
            {schema
              .find((f) => f.key === "status")
              .options.map((opt) => (
                <button
                  key={opt.value}
                  className={`px-3 py-1 rounded-full border text-sm ${
                    value.status?.includes(opt.value)
                      ? "bg-gray-900 text-white"
                      : "bg-gray-50"
                  }`}
                  onClick={() => {
                    const current = new Set(value.status || []);
                    current.has(opt.value) ? current.delete(opt.value) : current.add(opt.value);
                    onChange({ ...value, status: Array.from(current) });
                  }}
                >
                  {opt.label}
                </button>
              ))}
          </div>
        </div>
      )} */}
{schema.find((f) => f.key === "status") && (
  <div className="space-y-1">
    <label htmlFor="status-dropdown" className="text-sm font-medium">
      {t(schema.find((f) => f.key === "status").labelKey)}
    </label>
    <select
      id="status-dropdown"
      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      value={value.status?.[0] || ""}
      onChange={(e) => {
        onChange({ ...value, status: [e.target.value] });
      }}
    >
      <option value=""disabled>Select a status</option>
      {schema
        .find((f) => f.key === "status")
        .options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
    </select>
  </div>
)}
      {/* Location text */}
      {schema.find((f) => f.key === "location") && (
        <div className="space-y-1">
          <label className="text-sm font-medium">{t(schema.find((f) => f.key === "location").labelKey)}</label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder={schema.find((f) => f.key === "location").placeholder}
            value={value.location || ""}
            onChange={(e) => onChange({ ...value, location: e.target.value })}
          />
        </div>
      )}

      {/* Date range with presets */}
      {schema.find((f) => f.key === "createdAt") && (
        <div className="space">

          <label className="text-sm font-medium">{t(schema.find((f) => f.key === "createdAt").labelKey)}</label>
          <div className="flex flex-wrap gap-2">
            {schema
              .find((f) => f.key === "createdAt")
              .presets.map((p) => (
                <button
                  key={p.id}
                  className="px-3 py-1 rounded-full border text-sm bg-gray-70"
                  onClick={() => onChange({ ...value, createdAt: p.getRange() })}
                >
                  {t(config.i18nKeys.filters.presets[p.id] || config.i18nKeys.filters.presets.custom, p.vars)}
                </button>
              ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              className="rounded-xl border px-3 py-2"
              value={value.createdAt?.start ? new Date(value.createdAt.start).toISOString().slice(0, 10) : ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  createdAt: {
                    start: e.target.value ? startOfDay(new Date(e.target.value)) : undefined,
                    end: value.createdAt?.end,
                  },
                })
              }
            />
            <input
              type="date"
              className="rounded-xl border px-3 py-2"
              value={value.createdAt?.end ? new Date(value.createdAt.end).toISOString().slice(0, 10) : ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  createdAt: {
                    start: value.createdAt?.start,
                    end: e.target.value ? endOfDay(new Date(e.target.value)) : undefined,
                  },
                })
              }
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-3">
        <button className="px-4 py-3 rounded-xl bg-gray-900 text-white" onClick={onApply}>{t(config.i18nKeys.filters.apply)}</button>
        <button className="px-4 py-3 rounded-xl border" onClick={onClear}>{t(config.i18nKeys.filters.clear)}</button>
      </div>
   
    {/* Language Switcher */}
        <div className="language">
          
          <Globe className="h-4 w-4 r-0" />
          <select
            className="rounded-xl border px-2 py-1"
            value={lang}
            onChange={(e) => {
              const lng = e.target.value;
              i18n.changeLanguage(lng);
              setLang(lng);
            }}
            aria-label={t(config.i18nKeys.common.language)}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
             <option value="Amh">Amharic</option>

          </select>
        </div>
         </div>
  );
}

// ========================= MAIN PAGE COMPONENT =========================//
  const { t } = useTranslation();
  const navigate = useNavigate?.() || (() => {});

  const [rawRows, setRawRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterUI, setFilterUI] = useState({ status: [], location: "", createdAt: undefined });
  const [activeFilters, setActiveFilters] = useState({});
  const [lang, setLang] = useState(i18n.language || "en");

  // Fetch data based on config (mock or API)
  const fetchData = async () => {
    setLoading(false);
    try {
      if (config.dataSource.type === "api") {
        const res = await fetch(config.dataSource.apiUrl);
        const json = await res.json();
        setRawRows(json);
      } else {
        // mock
        await new Promise((r) => setTimeout(r, 250));
        setRawRows(mockDrivers);
      }
    } catch (e) {
      console.error(e);
      setRawRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [config.dataSource.type, config.dataSource.apiUrl]);

  const filteredRows = useMemo(() => applyFilters(rawRows, activeFilters), [rawRows, activeFilters]);

  // MRT columns with i18n keys
  const columns = useMemo(
    () => [
      { accessorKey: "id", header: t(config.i18nKeys.headers.id) },
      { accessorKey: "name", header: t(config.i18nKeys.headers.name) },
      { accessorKey: "status", header: t(config.i18nKeys.headers.status) },
      { accessorKey: "location", header: t(config.i18nKeys.headers.location) },
      { accessorKey: "createdAt", header: t(config.i18nKeys.headers.createdAt) },
      { accessorKey: "Time", header: t(config.i18nKeys.headers.time) },
    ], [t, lang]
  );

  const table = useMaterialReactTable({
    columns,
    data: filteredRows,
    enableFilters: true, // we are using a detached panel
    enablePagination: true,
    enableSorting: true,
    muiTableContainerProps: { sx: { maxHeight: 800 } },
    state: { isLoading: loading },
    initialState: { density: "compact" },
    renderTopToolbarCustomActions: () => (
      
      <div className="flex flex-wrap gap-2 items-center">
        <div className="pages">
        <button
          className="px-3 py-2 rounded-xl border flex items-center gap-2"
          onClick={() => (window.history?.length ? window.history.back() : navigate(-1))}
        >
          <ChevronLeft className="h-4 w-4" /> {t(config.i18nKeys.common.back)}
        </button>
        <button className="px-3 py-2 rounded-xl border flex items-center gap-2" onClick={fetchData}>
          <RefreshCcw className="h-4 w-4" /> {t(config.i18nKeys.common.refresh)}
        </button> 

        <button
  className="px-3 py-2 rounded-xl border flex items-center gap-2 h-4 w-4 px-2"
  onClick={() =>
    setDataSourceType((prev) => (prev === "mock" ? "api" : "mock"))
  }
>
  Switch to {dataSourceType === "mock" ? "API" : "Mock"} Data
</button>

        </div>
        
      </div>
    ),
    renderBottomToolbarCustomActions: () => (
<div className="export">
      <div className="flex flex-wrap gap-2 items-center">
        <Download className="h-4 w-4" /> <span className="font-medium">{t(config.i18nKeys.common.export)}</span>
        <button className="px-3 py-2 rounded-xl border" onClick={() => exportCSV(filteredRows, "drivers.csv")}>{t(config.i18nKeys.export.csv)}</button>
        <button className="px-3 py-2 rounded-xl border" onClick={() => exportXLSX(filteredRows, "drivers.xlsx")}>{t(config.i18nKeys.export.xlsx)}</button>
        <button className="px-3 py-2 rounded-xl border" onClick={() => exportPDF(filteredRows, columns, config.export.pdf, "drivers.pdf")}>
          {t(config.i18nKeys.export.pdf)}
        </button>
        <button className="px-3 py-2 rounded-xl border" onClick={() => exportQuickBooksJSON(filteredRows, config.export.custom.quickbooks.fileName)}>
          {t(config.i18nKeys.export.qb)}
        </button>
        <button className="px-3 py-2 rounded-xl border" onClick={() => exportFMCSAPDF(filteredRows, { title: config.export.custom.fmcsa.title }, config.export.custom.fmcsa.fileName)}>
          {t(config.i18nKeys.export.fmcsa)}
        </button>
      </div>
      </div>
    ),
    localization: {
      noRecordsToDisplay: t("table.empty"),
    },
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="title_table">
      <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 mb-6">
        <div className="title-2">
          <h1 className="text-2xl md:text-3xl font-bold items-center ">{t("table.title")}</h1>
          <h3 className="text-sm text-gray-500 items-center">Driver's Status Dashoard </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Detached Filter Panel */}
        <div className="lg:col-span-1">
          <FilterPanel
            t={t}
            schema={config.filters}
            value={filterUI}
            onChange={setFilterUI}
            onApply={() => setActiveFilters(filterUI)}
            onClear={() => {
              setFilterUI({ status: [], location: "", createdAt: undefined });
              setActiveFilters({});
            }}
          />
        </div>

        <div className="lg-col-span-3 table-wrapper">
  <MaterialReactTable table={table} />
</div>
      </div>
      </div>
    </div>
  );
}
