// src/components/login/LoginForm.tsx
import React, { useState, FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface LoginResponse {
  status: string
  token?: string
  usuario?: {
    id_usuario: number
    nombres: string
    id_rol: number 
    requiere_cambio: boolean
  }
  message?: string
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">): React.JSX.Element {
  const navigate = useNavigate()
  
  // Estados de control para el flujo estándar
  const [identificador, setIdentificador] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)

  //  ESTADOS AGREGADOS: Orquestación del cambio obligatorio (CUS-05)
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false)
  const [newPassword, setNewPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")

  const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000"

  // Flujo 1: Intento de autenticación inicial
  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const res = await axios.post<LoginResponse>(`${API_URL}/api/auth/login`, {
        identificador: identificador.trim(),
        password: password,
        dispositivo_info: "Consola de Gestión Web Centralizada (TSX)"
      })

      if (res.data.status === "OK" && res.data.token && res.data.usuario) {
        // Almacenamos el token provisional en el cliente para heredar las cabeceras de autorización
        localStorage.setItem("svdrayf_token", res.data.token)
        localStorage.setItem("svdrayf_user", JSON.stringify(res.data.usuario))
        
        //  INTERCEPCIÓN OPERATIVA: Evaluamos el flag relacional de Neon DB
        if (res.data.usuario.requiere_cambio) {
          setSuccess("Autenticación temporal válida. Por políticas de la empresa SVDRAYF, debe actualizar su PIN provisional.")
          setMustChangePassword(true) // Switchea la interfaz al formulario obligatorio
        } else {
          navigate("/dashboard") // Acceso limpio directo si está en orden
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Fallo transaccional: Servidor central de Neon DB no responde.")
    } finally {
      setLoading(false)
    }
  }

  // Flujo 2: Despacho de la contraseña privada definitiva
  const handleForceChangeSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (newPassword !== confirmPassword) {
      setError("Las llaves de acceso ingresadas no coinciden entre sí.")
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("svdrayf_token")
      
      const res = await axios.post<{ status: string; message: string }>(
        `${API_URL}/api/auth/change-forced-password`, 
        { newPassword: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (res.data.status === "OK") {
        // Actualizamos de forma síncrona el caché local de sesión para apagar el flag
        const userRaw = localStorage.getItem("svdrayf_user")
        if (userRaw) {
          const userObj = JSON.parse(userRaw)
          userObj.requiere_cambio = false
          localStorage.setItem("svdrayf_user", JSON.stringify(userObj))
        }

        alert("Seguridad Institucional: Su contraseña definitiva ha sido encriptada. Bienvenido al sistema.")
        navigate("/dashboard") // Redirección conforme finalizada
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al registrar credencial en Neon DB.")
    } finally {
      setLoading(false)
    }
  }

  // Flujo 3: Registro de solicitud de soporte en token_recuperacion
  const handleForgotPasswordSubmit = async (e: React.MouseEvent<HTMLAnchorElement>): Promise<void> => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!identificador.trim()) {
      setError("Por favor, ingrese su DNI o correo en el campo 'Identificador Oficial' antes de solicitar el restablecimiento.")
      return
    }

    setLoading(true)
    try {
      const res = await axios.post<{ status: string; message: string }>(`${API_URL}/api/auth/recover`, {
        identificador: identificador.trim()
      })
      if (res.data.status === "OK") setSuccess(res.data.message)
    } catch (err: any) {
      setError(err.response?.data?.message || "Fallo al procesar soporte.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-none shadow-2xl rounded-2xl bg-white dark:bg-slate-900 transition-all duration-300">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-800">
            {mustChangePassword ? "Actualización Obligatoria" : "Portal SVDRAYF"}
          </CardTitle>
          <CardDescription className="text-sm font-medium text-slate-400">
            {mustChangePassword 
              ? "Establezca su contraseña institucional privada definitiva" 
              : "Autenticación mandatoria para personal autorizado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          
          {error && <div className="p-3 bg-red-50 text-[#C5221F] text-xs font-bold rounded-xl mb-4 border-l-4 border-[#C5221F] animate-in fade-in duration-200"> {error}</div>}
          {success && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl mb-4 border-l-4 border-emerald-600 animate-in fade-in duration-200"> {success}</div>}

          {/* RENDERIZADO CONDICIONAL: SI REQUIERE CAMBIO, MUESTRA EL FORMULARIO RESTRICCIONADO */}
          {mustChangePassword ? (
            <form onSubmit={handleForceChangeSubmit}>
              <FieldGroup className="space-y-4">
                
                <Field className="flex flex-col gap-1.5 animate-in slide-in-from-bottom-2 duration-200">
                  <FieldLabel htmlFor="newPassword" className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
                    Nueva Contraseña Definitiva
                  </FieldLabel>
                  <Input 
                    id="newPassword"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="rounded-xl border-slate-200 px-4 py-2.5 text-slate-900 focus-visible:ring-[#1E3A8A]"
                  />
                </Field>

                <Field className="flex flex-col gap-1.5 animate-in slide-in-from-bottom-3 duration-300">
                  <FieldLabel htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
                    Confirmar Llave de Acceso
                  </FieldLabel>
                  <Input 
                    id="confirmPassword"
                    type="password"
                    placeholder="Repita la contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="rounded-xl border-slate-200 px-4 py-2.5 text-slate-900 focus-visible:ring-[#1E3A8A]"
                  />
                </Field>

                <Field className="flex flex-col gap-3 pt-2">
                  <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all duration-200">
                    {loading ? "Cifrando Llave Privada..." : "ESTABLECER CREDENCIAL Y ENTRAR"}
                  </Button>
                </Field>

              </FieldGroup>
            </form>
          ) : (
            /* FORMULARIO DE INICIO DE SESIÓN ESTÁNDAR */
            <form onSubmit={handleLoginSubmit}>
              <FieldGroup>
                
                <Field className="flex flex-col gap-1.5">
                  <FieldLabel htmlFor="identificador" className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Identificador Oficial</FieldLabel>
                  <Input
                    id="identificador"
                    type="text"
                    placeholder="Ingrese DNI o correo electrónico"
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    required
                    disabled={loading}
                    className="rounded-xl border-slate-200 px-4 py-2.5 text-slate-900 focus-visible:ring-[#1E3A8A]"
                  />
                </Field>
                
                <Field className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Llave de Acceso</FieldLabel>
                    <a href="#" onClick={handleForgotPasswordSubmit} className="ml-auto inline-block text-xs font-semibold text-[#D4AF37] hover:underline hover:text-[#b5952f]">¿Olvidó su contraseña?</a>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    disabled={loading}
                    className="rounded-xl border-slate-200 px-4 py-2.5 text-slate-900 focus-visible:ring-[#1E3A8A]"
                  />
                </Field>
                
                <Field className="flex flex-col gap-3 pt-2">
                  <Button type="submit" disabled={loading} className="w-full bg-[#1E3A8A] hover:bg-[#2c4ea3] text-white font-bold py-3 rounded-xl shadow-lg transition-all duration-200">
                    {loading ? "Procesando flujo de seguridad..." : "INGRESAR AL SISTEMA"}
                  </Button>
                  <FieldDescription className="text-center text-xs font-medium text-slate-400 max-w-[280px] mx-auto leading-normal">Consola web restringida. Todo intento ilegítimo será registrado bajo flag de auditoría.</FieldDescription>
                </Field>

              </FieldGroup>
            </form>
          )}

        </CardContent>
      </Card>
    </div>
  )
}