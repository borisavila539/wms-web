import axios from 'axios'
import { AuditoriaInternaUrl } from '../constants/api'
import {
    AuditoriaCajaDetalle,
    AuditoriaEscaneo,
    AuditoriaFaltante,
    AuditoriaHistorial,
    AuditoriaRespuesta,
    DashboardCaja,
    DashboardContratista,
    DashboardDia,
    DashboardPendiente,
    DashboardResumen,
} from '../interfaces/AuditoriaInterna/AuditoriaInternaInterface'

const api = axios.create({
    baseURL: AuditoriaInternaUrl
})

export const AuditoriaInternaApi = {
    // ── Dashboard (fechas yyyy-MM-dd) ────────────────────────────────────────
    getResumen: (fechaIni: string, fechaFin: string) =>
        api.get<DashboardResumen>('DashboardResumen', { params: { fechaIni, fechaFin } }),

    getPorContratista: (fechaIni: string, fechaFin: string) =>
        api.get<DashboardContratista[]>('DashboardPorContratista', { params: { fechaIni, fechaFin } }),

    getPorDia: (fechaIni: string, fechaFin: string) =>
        api.get<DashboardDia[]>('DashboardPorDia', { params: { fechaIni, fechaFin } }),

    // RECEPCION: cajas recibidas en el periodo (cuadra con el resumen); AUDITORIA: auditadas en el periodo
    getCajas: (fechaIni: string, fechaFin: string, porFecha: 'RECEPCION' | 'AUDITORIA' = 'RECEPCION') =>
        api.get<DashboardCaja[]>('DashboardCajas', { params: { fechaIni, fechaFin, porFecha } }),

    getPendientes: (fechaIni: string, fechaFin: string) =>
        api.get<DashboardPendiente[]>('DashboardPendientes', { params: { fechaIni, fechaFin } }),

    // ── Detalle de una caja ──────────────────────────────────────────────────
    getCaja: (auditoriaId: number) =>
        api.get<AuditoriaCajaDetalle>(`Caja/${auditoriaId}`),

    getEscaneos: (auditoriaId: number) =>
        api.get<AuditoriaEscaneo[]>(`Escaneos/${auditoriaId}`),

    getFaltantes: (auditoriaId: number) =>
        api.get<AuditoriaFaltante[]>(`Faltantes/${auditoriaId}`),

    getHistorial: (auditoriaId: number) =>
        api.get<AuditoriaHistorial[]>(`Historial/${auditoriaId}`),

    // ── Reapertura (solo usuarios con la pantalla AuditoriaInternaReabrir) ───
    getPermisoReabrir: (usuario: string) =>
        api.get<{ puedeReabrir: boolean }>(`PermisoReabrir/${encodeURIComponent(usuario)}`),

    reabrirCaja: (auditoriaId: number, motivo: string, usuario: string) =>
        api.post<AuditoriaRespuesta>('ReabrirCaja', { auditoriaId, motivo, usuario }),

    // Borra escaneos y rechazos; la caja queda abierta en 0 (mismo permiso que reabrir)
    reiniciarCaja: (auditoriaId: number, motivo: string, usuario: string) =>
        api.post<AuditoriaRespuesta>('ReiniciarCaja', { auditoriaId, motivo, usuario }),

    // Borra la auditoria completa (queda en la bitacora); la caja vuelve a quedar pendiente (mismo permiso)
    eliminarCaja: (auditoriaId: number, motivo: string, usuario: string) =>
        api.post<AuditoriaRespuesta>('EliminarCaja', { auditoriaId, motivo, usuario }),
}
