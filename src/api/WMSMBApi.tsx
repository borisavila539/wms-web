import axios from 'axios'
import { WMSMBUrl } from '../constants/api'
import {
    ComparativoMBAX,
    LiberarCaja,
    LiberarCajasRequest,
    LiberarCajasResultado,
    LiberarDespacho,
    LiberarHistorial,
    LiberarPermiso,
} from '../interfaces/MB/MBInterface'

const api = axios.create({
    baseURL: WMSMBUrl
})

export const WMSMBApi = {
    // ── Comparativo MB vs AX ─────────────────────────────────────────────────
    getComparativoAX: (articulo: string = '') =>
        api.get<ComparativoMBAX[]>('ComparativoAX', { params: { articulo } }),

    // ── Liberar cajas de despacho ────────────────────────────────────────────
    getPermisoLiberar: (usuario: string) =>
        api.get<LiberarPermiso>(`LiberarCajas/Permiso/${encodeURIComponent(usuario)}`),

    getDespachosLiberables: () =>
        api.get<LiberarDespacho[]>('LiberarCajas/Despachos'),

    // Un despacho por numero, enviado o no (lista vacia si no tiene cajas)
    getDespacho: (despachoId: number) =>
        api.get<LiberarDespacho[]>(`LiberarCajas/Despacho/${despachoId}`),

    getCajasDespacho: (despachoId: number) =>
        api.get<LiberarCaja[]>(`LiberarCajas/Cajas/${despachoId}`),

    liberarCajas: (request: LiberarCajasRequest) =>
        api.post<LiberarCajasResultado>('LiberarCajas', request),

    // fechas yyyy-MM-dd
    getHistorial: (fechaIni: string, fechaFin: string) =>
        api.get<LiberarHistorial[]>('LiberarCajas/Historial', { params: { fechaIni, fechaFin } }),
}
