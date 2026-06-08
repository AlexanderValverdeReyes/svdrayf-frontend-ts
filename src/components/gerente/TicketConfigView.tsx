// src/components/gerente/TicketConfigView.tsx
"use client"

import React, { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Printer, Save, RefreshCw, CheckCircle, AlertCircle, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ConfigTicket {
  razon_social: string
  ruc: string
  direccion_fiscal: string
  leyenda_pie?: string
}

export default function TicketConfigView(): React.JSX.Element {
  const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000"

  const [form, setForm] = useState<ConfigTicket>({
    razon_social: "",
    ruc: "",
    direccion_fiscal: "",
    leyenda_pie: ""
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")

  // Cargar configuración actual desde el backend
  const loadConfig = async () => {
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("svdrayf_token")
      const res = await axios.get(`${API_URL}/api/admin/configuracion`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.status === "OK" && res.data.data) {
        setForm(res.data.data)
      }
    } catch (err: any) {
      setError("No se pudo cargar la configuración del ticket.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  // Guardar cambios
  const handleSave = async () => {
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const token = localStorage.getItem("svdrayf_token")
      const res = await axios.put(`${API_URL}/api/admin/configuracion`, form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.status === "OK") {
        setSuccess("Configuración del ticket actualizada correctamente.")
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al guardar la configuración.")
    } finally {
      setSaving(false)
    }
  }

  // Descargar vista previa del ticket como PDF (vía impresión)
  const handlePrintPreview = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Permite ventanas emergentes para imprimir el ticket.")
      return
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Vista Previa del Ticket - SVDRAYF</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f8fafc;
            }
            .ticket {
              width: 300px;
              background: white;
              border: 1px dashed #000;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              box-shadow: 2px 2px 8px rgba(0,0,0,0.1);
            }
            .ticket h2 {
              font-size: 16px;
              margin: 0 0 10px;
              font-weight: bold;
            }
            .ticket p {
              margin: 4px 0;
            }
            .ticket .divider {
              border-top: 1px dashed #000;
              margin: 10px 0;
            }
            .ticket .footer {
              font-size: 10px;
              color: #555;
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <h2>${form.razon_social || "Razón Social"}</h2>
            <p><strong>RUC:</strong> ${form.ruc || "12345678901"}</p>
            <p>${form.direccion_fiscal || "Dirección Fiscal"}</p>
            <div class="divider"></div>
            <p>Pasaje: S/. 15.00</p>
            <p>Fecha: ${new Date().toLocaleDateString()}</p>
            <p>Hora: ${new Date().toLocaleTimeString()}</p>
            <div class="divider"></div>
            <p class="footer">${form.leyenda_pie || "¡Gracias por viajar con nosotros!"}</p>
            <p class="footer">Consulte sus derechos en www.svdrayf.com</p>
          </div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

    // Exportar plantilla HTML estándar para la app móvil
  const handleExportTemplate = () => {
    const template = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Plantilla Ticket SVDRAYF</title>
  <style>
    body {
      font-family: 'Courier New', monospace;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f8fafc;
      margin: 0;
    }
    .ticket {
      width: 300px;
      background: white;
      border: 1px dashed #000;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      box-shadow: 2px 2px 8px rgba(0,0,0,0.1);
      word-wrap: break-word;
    }
    .ticket h2 { font-size: 16px; margin: 0 0 10px; font-weight: bold; }
    .ticket p { margin: 4px 0; }
    .divider { border-top: 1px dashed #000; margin: 10px 0; }
    .footer { font-size: 10px; color: #555; }
    .qr-placeholder {
      margin: 10px auto;
      width: 100px;
      height: 100px;
      border: 1px dashed #999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #999;
      background: #f0f0f0;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <h2>{{razon_social}}</h2>
    <p><strong>RUC:</strong> {{ruc}}</p>
    <p>{{direccion_fiscal}}</p>
    <div class="divider"></div>
    <p><strong>Pasaje:</strong> S/. {{precio}}</p>
    <p><strong>Origen:</strong> {{origen}} &rarr; <strong>Destino:</strong> {{destino}}</p>
    <p><strong>Fecha:</strong> {{fecha}}</p>
    <p><strong>Hora:</strong> {{hora}}</p>
    <p><strong>Bus:</strong> {{placa}} ({{numero_padron}})</p>
    <p><strong>Cobrador:</strong> {{cobrador}}</p>
    <div class="divider"></div>
    <div class="qr-placeholder" id="qr-container">
      {{qr_image}}
    </div>
    <p class="footer" style="font-size: 9px; word-break: break-all;"><strong>Hash:</strong> {{hash_qr}}</p>
    <p class="footer">{{leyenda_pie}}</p>
    <p class="footer">Consulte sus derechos en www.svdrayf.com</p>
    <p class="footer">Ticket generado digitalmente - SVDRAYF</p>
  </div>
</body>
</html>`;

    // Rellenar los datos de la empresa actuales para que el gerente vea un ejemplo
    const filledTemplate = template
      .replace('{{razon_social}}', form.razon_social || 'Razón Social')
      .replace('{{ruc}}', form.ruc || '12345678901')
      .replace('{{direccion_fiscal}}', form.direccion_fiscal || 'Dirección Fiscal')
      .replace('{{leyenda_pie}}', form.leyenda_pie || '¡Gracias por viajar con nosotros!')
      // Los demás placeholders se mantienen para que la app los reemplace
      .replace('{{precio}}', '{{precio}}')
      .replace('{{origen}}', '{{origen}}')
      .replace('{{destino}}', '{{destino}}')
      .replace('{{fecha}}', '{{fecha}}')
      .replace('{{hora}}', '{{hora}}')
      .replace('{{placa}}', '{{placa}}')
      .replace('{{numero_padron}}', '{{numero_padron}}')
      .replace('{{cobrador}}', '{{cobrador}}')
      .replace('{{qr_image}}', '<span>QR Code</span>')
      .replace('{{hash_qr}}', '{{hash_qr}}');

    const blob = new Blob([filledTemplate], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla_ticket_svdrayf.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm font-bold text-[#1E3A8A] animate-pulse">
          Cargando parámetros del ticket térmico...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#1E3A8A] flex items-center gap-2">
            <Printer className="w-6 h-6 text-[#1E3A8A]" /> Configuración del Ticket de Cobro
          </h2>
          <p className="text-sm font-medium text-slate-400">
            Personalice los datos fiscales que aparecerán en el ticket térmico impreso desde la app móvil.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 text-green-700 text-sm font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de edición */}
        <Card className="border-none shadow-md rounded-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-black text-[#1E3A8A]">Datos Fiscales del Ticket</CardTitle>
            <CardDescription>Modifique los campos y guarde los cambios.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold uppercase text-[#1E3A8A]">Razón Social</Label>
              <Input
                value={form.razon_social}
                onChange={(e) => setForm({ ...form, razon_social: e.target.value })}
                placeholder="Ej: Transportes SVDRAYF S.A.C."
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold uppercase text-[#1E3A8A]">RUC</Label>
              <Input
                value={form.ruc}
                onChange={(e) => setForm({ ...form, ruc: e.target.value })}
                placeholder="12345678901"
                maxLength={11}
                className="rounded-xl border-slate-200 font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold uppercase text-[#1E3A8A]">Dirección Fiscal</Label>
              <Input
                value={form.direccion_fiscal}
                onChange={(e) => setForm({ ...form, direccion_fiscal: e.target.value })}
                placeholder="Av. Los Transportistas 123, Mala"
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold uppercase text-[#1E3A8A]">Leyenda al Pie (opcional)</Label>
              <Input
                value={form.leyenda_pie || ""}
                onChange={(e) => setForm({ ...form, leyenda_pie: e.target.value })}
                placeholder="¡Gracias por viajar con nosotros!"
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#1E3A8A] hover:bg-[#2c4ea3] text-white gap-2 font-bold rounded-xl"
              >
                <Save className="w-4 h-4" /> {saving ? "Guardando..." : "Guardar Configuración"}
              </Button>
              <Button
                variant="outline"
                onClick={loadConfig}
                disabled={loading}
                className="gap-2 rounded-xl border-slate-200"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refrescar
              </Button>

              <Button
  variant="outline"
  onClick={handleExportTemplate}
  className="gap-2 rounded-xl border-slate-200"
>
  <Download className="w-4 h-4" /> Exportar Plantilla HTML
</Button>
            </div>
          </CardContent>
        </Card>

        {/* Previsualización del ticket */}
        <Card className="border-none shadow-md rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black text-[#1E3A8A]">Vista Previa del Ticket</CardTitle>
              <CardDescription>Así se verá en la impresora térmica.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrintPreview}
              className="rounded-xl border-slate-200"
              title="Imprimir / Descargar Ticket"
            >
              <Printer className="w-4 h-4 text-slate-600" />
            </Button>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-[280px] bg-white border border-dashed border-slate-400 p-4 text-center font-mono text-[11px] leading-tight shadow-inner">
              <h3 className="text-sm font-bold mb-1">{form.razon_social || "Razón Social"}</h3>
              <p className="mb-1"><strong>RUC:</strong> {form.ruc || "12345678901"}</p>
              <p className="mb-1">{form.direccion_fiscal || "Dirección Fiscal"}</p>
              <hr className="my-2 border-dashed border-slate-400" />
              <p className="mb-1">Pasaje: S/. 15.00</p>
              <p className="mb-1">Fecha: {new Date().toLocaleDateString()}</p>
              <p className="mb-1">Hora: {new Date().toLocaleTimeString()}</p>
              <hr className="my-2 border-dashed border-slate-400" />
              <p className="mb-1 text-[10px] break-all"><strong>Hash:</strong> {"{{hash_qr_ejemplo}}"}</p>
              <p className="text-[10px] text-slate-500">{form.leyenda_pie || "¡Gracias por viajar con nosotros!"}</p>
              <p className="text-[10px] text-slate-500">Consulte sus derechos en www.svdrayf.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}