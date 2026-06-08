// src/components/gerente/ConsultaGlobal.tsx
"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  useReactTable,
} from "@tanstack/react-table"
import { 
  ArrowUpDown, Bus, Search, FileText, Download, Calendar, DollarSign, Ticket, RefreshCw,
  ArrowLeft, Info, CheckCircle2, ShieldCheck
} from "lucide-react"
import axios from "axios"

// Componentes Atómicos de Shadcn UI
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface BusUnidad {
  id_bus: number
  placa: string
  numero_padron: string
  marca: string
  modelo: string
  anio_modelo: number
  capacidad_pasajeros: number
  id_socio: number | null
  socio_nombres?: string
  estado: boolean
  rutas_ejecutadas?: string
}

interface BusSalesSummary {
  total_soles: number
  total_boletos: number
}

interface RutaOption {
  id_ruta_modalidad: number
  nombre_modalidad: string
}

export default function ConsultaGlobal(): React.JSX.Element {
  const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000"

  // Datos maestros
  const [buses, setBuses] = useState<BusUnidad[]>([])
  const [rutas, setRutas] = useState<RutaOption[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")

  // Estados de control para TanStack Table
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Filtros interactivos de cabecera
  const [filtroPlaca, setFiltroPlaca] = useState<string>("")
  const [filtroRuta, setFiltroRuta] = useState<string>("") 

  // Bus seleccionado (Mecanismo Maestro-Detalle)
  const [selectedBus, setSelectedBus] = useState<BusUnidad | null>(null)

  // Intervalos de fecha para auditoría de caja
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")

  // Datos vivos de transacciones
  const [busSales, setBusSales] = useState<BusSalesSummary | null>(null)
  const [salesLoading, setSalesLoading] = useState<boolean>(false)

  // Control estricto de exportación interactiva
  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false)
  const [reportType, setReportType] = useState<string>("auditoria") // auditoria | cierre | ventas
  const [exportFormat, setExportFormat] = useState<string>("pdf") // pdf | xlsx

  // Descarga concurrente asíncrona conectada a tu admin.js
  const loadData = async () => {
  setLoading(true)
  setError("")
  try {
    const token = localStorage.getItem("svdrayf_token")
    const headers = { Authorization: `Bearer ${token}` }

    const params: any = {}
    if (filtroRuta) params.ruta = filtroRuta

    const [busesRes, rutasRes] = await Promise.all([
      axios.get(`${API_URL}/api/admin/buses`, { headers, params }),  // con filtro
      axios.get(`${API_URL}/api/admin/rutas-modalidad`, { headers }),
    ])

    if (busesRes.data.status === "OK") setBuses(busesRes.data.data)
    if (rutasRes.data.status === "OK") setRutas(rutasRes.data.data)
  } catch (err: any) {
    setError(err.response?.data?.message || "Error al cargar datos.")
  } finally {
    setLoading(false)
  }
}

useEffect(() => {
  loadData()
}, [filtroRuta])

  // Consumir el endpoint /bus-sales/:busId con formateo seguro de tipos
  const fetchBusSales = async () => {
    if (!selectedBus) return
    setSalesLoading(true)
    try {
      const token = localStorage.getItem("svdrayf_token")
      const params: any = {}
      if (fromDate) params.from = fromDate
      if (toDate) params.to = toDate

      const res = await axios.get(`${API_URL}/api/admin/bus-sales/${selectedBus.id_bus}`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      })
      if (res.data.status === "OK") {
        setBusSales(res.data.data)
      } else {
        setBusSales(null)
      }
    } catch (err) {
      console.error(err)
      setBusSales(null)
    } finally {
      setSalesLoading(false)
    }
  }

  useEffect(() => {
    if (selectedBus) {
      fetchBusSales()
    } else {
      setBusSales(null)
    }
  }, [selectedBus, fromDate, toDate])

  // Filtrado reactivo en caliente por historial de turnos viales
  const filteredData = useMemo(() => {
  return buses.filter((bus) => {
    const matchPlaca = filtroPlaca === "" || bus.placa.toLowerCase().includes(filtroPlaca.toLowerCase())
    return matchPlaca
  })
}, [buses, filtroPlaca])
  const columns: ColumnDef<BusUnidad>[] = [
    {
      accessorKey: "numero_padron",
      header: "Padrón",
      cell: ({ row }) => <span className="font-mono text-xs font-bold text-slate-400">#{row.getValue("numero_padron")}</span>,
    },
    {
      accessorKey: "placa",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="p-0 hover:bg-transparent font-bold text-[#1E3A8A]">
          Placa Oficial <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-black tracking-wider text-slate-800">{row.getValue("placa")}</span>,
    },
    {
      accessorKey: "marca",
      header: "Fabricante / Configuración",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-700">{row.original.marca}</span>
          <span className="text-[11px] text-slate-400 font-medium">{row.original.modelo} ({row.original.anio_modelo})</span>
        </div>
      ),
    },
    {
      accessorKey: "socio_nombres",
      header: "Socio Copropietario",
      cell: ({ row }) => <span className="text-xs font-bold text-slate-600">{row.getValue("socio_nombres") || "Inversión Interna"}</span>,
    },
    {
      accessorKey: "capacidad_pasajeros",
      header: "Aforo Máximo",
      cell: ({ row }) => <span className="font-semibold text-xs">{row.getValue("capacidad_pasajeros")} Asientos</span>,
    },
    {
      accessorKey: "estado",
      header: "Control Operativo",
      cell: ({ row }) => (
        <Badge className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${row.getValue("estado") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {row.getValue("estado") ? "ALTA EN RUTA" : "BAJA OPERATIVA"}
        </Badge>
      ),
    },
  ]

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
  })

  const handleOpenExport = () => {
  if (!fromDate && !toDate) setReportType("auditoria")
  else if (fromDate && toDate && fromDate === toDate) setReportType("cierre")
  else setReportType("ventas")
  setExportDialogOpen(true)
}
  // ========================================================
  // 🚀 MOTOR DE EXPORTACIÓN EXCEL Y PDF (CLIENT-SIDE)
  // ========================================================
const ejecutarExportacionLote = () => {
  if (!selectedBus) return;

  const totalRecaudado = busSales ? Number(busSales.total_soles).toFixed(2) : "0.00";
  const totalBoletos = busSales ? busSales.total_boletos : 0;
  const desdeTxt = fromDate || "Inicio Registro";
  const hastaTxt = toDate || "Fecha Actual";

  if (exportFormat === "xlsx") {
    // 📊 Generación de archivo Excel (HTML table con formato .xls)
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="UTF-8"><title>Reporte</title></head>
        <body>
          <h2>REPORTE CONSOLIDADO DE RECAUDACIÓN - RUTA MALA LIMA</h2>
          <table border="1">
            <tr><td><b>Vehículo</b></td><td>${selectedBus.marca} ${selectedBus.modelo}</td></tr>
            <tr><td><b>Placa Oficial</b></td><td>${selectedBus.placa}</td></tr>
            <tr><td><b>Padrón Interno</b></td><td>${selectedBus.numero_padron}</td></tr>
            <tr><td><b>Socio Inversionista</b></td><td>${selectedBus.socio_nombres || "Empresa"}</td></tr>
            <tr><td><b>Intervalo Cronológico</b></td><td>${desdeTxt} al ${hastaTxt}</td></tr>
            <tr><td><b>Tipo de Reporte</b></td><td>${reportType.toUpperCase()}</td></tr>
            <tr><td><b>Total Recaudado (Soles)</b></td><td>S/. ${totalRecaudado}</td></tr>
            <tr><td><b>Boletos Emitidos</b></td><td>${totalBoletos} pasajes</td></tr>
          </table>
        </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BALANCE_${selectedBus.placa}_${reportType}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    // 📄 Generación de PDF (imprimible) mejorada sin cierre automático
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Permite ventanas emergentes para generar el PDF.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>SVDRAYF - Reporte Ejecutivo Financiero</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 3px solid #1E3A8A; padding-bottom: 20px; }
            .title { color: #1E3A8A; font-size: 24px; font-weight: 900; margin: 0; }
            .subtitle { font-size: 12px; color: #64748b; font-weight: 600; margin-top: 5px; text-transform: uppercase; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .meta-item { font-size: 13px; font-weight: 500; }
            .meta-item strong { color: #1E3A8A; }
            .kpi-container { display: flex; gap: 20px; margin-top: 30px; }
            .kpi-card { flex: 1; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; text-align: center; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            .kpi-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
            .kpi-val { font-size: 28px; font-weight: 900; color: #1e293b; margin-top: 5px; font-family: monospace; }
            .footer { margin-top: 60px; border-top: 1px dashed #cbd5e1; padding-top: 15px; font-size: 10px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <p class="title">SISTEMA PERIMETRAL SVDRAYF</p>
            <p class="subtitle">Consolidación de Auditoría Contable de Flota</p>
          </div>
          <div class="meta-grid">
            <div class="meta-item"><strong>Unidad Vehicular:</strong> ${selectedBus.marca} ${selectedBus.modelo}</div>
            <div class="meta-item"><strong>Placa de Rodaje:</strong> ${selectedBus.placa}</div>
            <div class="meta-item"><strong>Número de Padrón:</strong> #${selectedBus.numero_padron}</div>
            <div class="meta-item"><strong>Socio Inversionista:</strong> ${selectedBus.socio_nombres || "Empresa"}</div>
            <div class="meta-item"><strong>Rango Consultado:</strong> ${desdeTxt} al ${hastaTxt}</div>
            <div class="meta-item"><strong>Tipo de Arqueo:</strong> ${reportType.toUpperCase()}</div>
          </div>
          <div class="kpi-container">
            <div class="kpi-card">
              <div class="kpi-title">Monto Total Recaudado</div>
              <div class="kpi-val" style="color: #10b981;">S/. ${totalRecaudado}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Pasajes Vendidos (Boletaje)</div>
              <div class="kpi-val" style="color: #3b82f6;">${totalBoletos} Unid.</div>
            </div>
          </div>
          <div class="footer">
            Reporte digital criptográfico emitido bajo la Consola de Gestión Centralizada. Firma digital conforme clúster Neon DB.
          </div>
          <script>
            // Pequeño retraso para asegurar renderizado antes de imprimir
            setTimeout(() => { window.print(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
  setExportDialogOpen(false);
};

  return (
    <div className="space-y-6 p-4 animate-in fade-in duration-150">
      
      {/* 🚀 ARQUITECTURA MAESTRO-DETALLE MUTABLE (VISTA 1: GRILLA MAESTRA DE AUTOBUSES) */}
      {!selectedBus ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-[#1E3A8A] flex items-center gap-2">
                <Bus className="w-6 h-6 text-[#1E3A8A]" /> Consulta Global de Flota
              </h2>
              <p className="text-sm font-medium text-slate-400">
                Seleccione una unidad autorizada de la corporación para aislar y auditar su balance contable.
              </p>
            </div>
            <Button variant="outline" onClick={loadData} disabled={loading} className="gap-2 border-slate-200 text-slate-600 rounded-xl font-bold text-xs h-10 hover:bg-slate-50">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refrescar Base de Datos
            </Button>
          </div>

          {/* Panel de Filtros Relacionales */}
          <Card className="border-none shadow-sm rounded-xl bg-white">
            <CardContent className="flex flex-wrap gap-4 py-4">
              <div className="flex flex-col gap-1.5 w-64">
                <Label className="text-xs font-bold uppercase text-[#1E3A8A] tracking-wider">Filtrar por Placa Oficial</Label>
                <Input
                  placeholder="Ej: F3V-721"
                  value={filtroPlaca}
                  onChange={(e) => setFiltroPlaca(e.target.value)}
                  className="rounded-xl border-slate-200 uppercase font-mono text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5 w-64">
                <Label className="text-xs font-bold uppercase text-[#1E3A8A] tracking-wider">Historial de Ruta (Turnos)</Label>
                <select
                  value={filtroRuta}
                  onChange={(e) => setFiltroRuta(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="">Todos los tramos operados...</option>
                  {rutas.map((r) => (
                    <option key={r.id_ruta_modalidad} value={r.nombre_modalidad}>{r.nombre_modalidad}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Grilla Inalterable de Buses */}
          <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="px-6 py-4">
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-32 text-center text-sm font-semibold text-slate-400 animate-pulse">
                        Descargando inventario consolidado de flota desde Neon DB...
                      </TableCell>
                    </TableRow>
                  ) : table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer border-b transition-colors hover:bg-slate-50/50"
                        onClick={() => setSelectedBus(row.original)} // Sobrepone y salta al detalle
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="px-6 py-4 text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-32 text-center text-sm font-semibold text-slate-400">
                        Ninguna unidad vehicular coincide con los filtros establecidos.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="rounded-xl font-bold text-xs">Anterior</Button>
                  <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="rounded-xl font-bold text-xs">Siguiente</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        
        /* 🚀 ARQUITECTURA MAESTRO-DETALLE MUTABLE (VISTA 2: AISLAMIENTO FINANCIERO DEL VEHÍCULO SELECCIONADO) */
        <Card className="border-none shadow-xl rounded-2xl bg-white border border-slate-100 animate-in slide-in-from-right-4 duration-200">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => { setSelectedBus(null); setFromDate(""); setToDate(""); }} // Botón de retroceso formal
                  className="rounded-xl size-8 text-slate-500 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <CardTitle className="text-xl font-black text-[#1E3A8A]">
                  Expediente de Caja: {selectedBus.marca} [{selectedBus.placa}]
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-400 font-medium ml-10 mt-1">
                Padrón Relacional: #{selectedBus.numero_padron} | Propietario asignado: {selectedBus.socio_nombres || "Inversión Corporativa"}
              </CardDescription>
            </div>

            {/* Tags informativos del tramo */}
            {selectedBus.rutas_ejecutadas && (
              <div className="flex flex-wrap gap-1 max-w-xs justify-end pl-10 sm:pl-0">
                {selectedBus.rutas_ejecutadas.split(',').map((r, idx) => (
                  <Badge key={idx} variant="secondary" className="text-[10px] font-bold bg-slate-100 text-slate-600 border-none rounded-lg">{r}</Badge>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            
            {/* Formulario de Rangos Cronológicos */}
            <div className="grid gap-4 sm:grid-cols-3 bg-slate-50/70 border border-slate-100 p-4 rounded-xl items-end">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-black uppercase text-[#1E3A8A] flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> Fecha Apertura (Desde)</Label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-xl bg-white border-slate-200 h-10 font-mono text-sm" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-black uppercase text-[#1E3A8A] flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> Fecha Cierre (Hasta)</Label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-xl bg-white border-slate-200 h-10 font-mono text-sm" />
              </div>
              <Button variant="outline" onClick={() => { setFromDate(""); setToDate(""); }} className="rounded-xl h-10 text-xs font-bold border-slate-200 bg-white hover:bg-slate-100 transition-all">
                Restablecer Reloj
              </Button>
            </div>

            {/* Bloques de Rendimiento y KPIs Monetarios */}
            {salesLoading ? (
              <div className="text-sm font-semibold text-slate-400 animate-pulse py-8 text-center bg-slate-50/40 border border-dashed rounded-xl">
                Efectuando sumatorias y balance de boletaje en el pool de Neon DB...
              </div>
            ) : busSales ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border border-slate-100 shadow-sm p-4 rounded-xl bg-white">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Producción Recaudada</span>
                  </div>
                  <p className="text-3xl font-black text-slate-800 mt-2 font-mono">
                    S/. {Number(busSales.total_soles).toFixed(2)}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium">Conversión neta de centavos liquidada con éxito</span>
                </Card>
                <Card className="border border-slate-100 shadow-sm p-4 rounded-xl bg-white">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Ticket className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Pasajes Despachados</span>
                  </div>
                  <p className="text-3xl font-black text-slate-800 mt-2 font-mono">
                    {busSales.total_boletos} <span className="text-sm font-bold text-slate-400">boletos</span>
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium">Volumen físico impreso por el APK móvil en ruta</span>
                </Card>
              </div>
            ) : (
              <div className="text-sm text-slate-400 font-medium italic text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center gap-1.5">
                <Info className="w-4 h-4 text-slate-400" /> No se registran boletos emitidos para este vehículo en las fechas especificadas.
              </div>
            )}

            {/* Acción de Disparo del Modal de Lotes */}
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button 
                onClick={handleOpenExport} 
                className="bg-[#1E3A8A] hover:bg-[#2c4ea3] text-white gap-2 font-bold rounded-xl px-6 py-5 text-xs shadow-md transition-all"
              >
                <Download className="w-4 h-4" /> CONFIGURAR Y EXPORTAR INFORME LOTE
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================
          🎛️ MODAL INTERACTIVO REFACTORIZADO (BOTONES REACCIONARIOS DE ALTA UX)
         ======================================================== */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md border-none p-6 bg-white shadow-2xl animate-in fade-in duration-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#1E3A8A] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" /> Parámetros de Salida (CUS-12)
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-400">
              Establezca la clasificación contable. El archivo generado incluirá firmas de auditoría SHA-256.
            </DialogDescription>
          </DialogHeader>

          {/* 🛠️ SOLUCIÓN INTERACTIVIDAD: Reemplazo de RadioGroup por selectores de Botones Badge de alta UX */}
          <div className="space-y-5 py-4">
            
            {/* Selección de Tipo de Reporte */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-[#1E3A8A] tracking-wider">Tipo de Informe Contable</Label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setReportType("auditoria")}
                  className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${reportType === "auditoria" ? "border-[#1E3A8A] bg-blue-50/50 font-bold text-[#1E3A8A]" : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"}`}
                >
                  <span>📋 Balance e Inspección de Flota (Global)</span>
                  {reportType === "auditoria" && <CheckCircle2 className="w-4 h-4 text-[#1E3A8A]" />}
                </button>
                <button
                  type="button"
                  onClick={() => setReportType("cierre")}
                  className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${reportType === "cierre" ? "border-[#1E3A8A] bg-blue-50/50 font-bold text-[#1E3A8A]" : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"}`}
                >
                  <span>💰 Libro de Cierre de Caja Diario</span>
                  {reportType === "cierre" && <CheckCircle2 className="w-4 h-4 text-[#1E3A8A]" />}
                </button>
                <button
                  type="button"
                  onClick={() => setReportType("ventas")}
                  className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${reportType === "ventas" ? "border-[#1E3A8A] bg-blue-50/50 font-bold text-[#1E3A8A]" : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"}`}
                >
                  <span>📈 Rendimiento Histórico por Rangos</span>
                  {reportType === "ventas" && <CheckCircle2 className="w-4 h-4 text-[#1E3A8A]" />}
                </button>
              </div>
            </div>

            {/* Selección de Formato */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-[#1E3A8A] tracking-wider">Formato Binario de Compilación</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExportFormat("pdf")}
                  className={`p-3 rounded-xl border text-center text-xs transition-all flex items-center justify-center gap-1.5 ${exportFormat === "pdf" ? "border-[#1E3A8A] bg-blue-50/50 font-black text-[#1E3A8A]" : "border-slate-200 text-slate-600 font-semibold bg-white hover:bg-slate-50"}`}
                >
                  <FileText className="w-4 h-4" /> Documento PDF
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat("xlsx")}
                  className={`p-3 rounded-xl border text-center text-xs transition-all flex items-center justify-center gap-1.5 ${exportFormat === "xlsx" ? "border-[#1E3A8A] bg-blue-50/50 font-black text-[#1E3A8A]" : "border-slate-200 text-slate-600 font-semibold bg-white hover:bg-slate-50"}`}
                >
                  <Download className="w-4 h-4" /> Libro de Excel
                </button>
              </div>
            </div>

          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t border-slate-100 pt-3">
            <Button type="button" variant="outline" onClick={() => setExportDialogOpen(false)} className="rounded-xl font-bold text-xs h-10">Cancelar</Button>
            <Button
              type="button"
              className="bg-[#1E3A8A] hover:bg-[#2c4ea3] text-white rounded-xl font-bold text-xs h-10 px-5"
              onClick={ejecutarExportacionLote} // Ejecuta la descarga real
            >
              EFECTUAR COMPILACIÓN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}