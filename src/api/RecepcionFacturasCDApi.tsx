import axios from 'axios'
import { RecepcionFacturasCDUrl } from '../constants/api'
import {
    CuentaExcluidaRecepcionCD,
    CuentaExcluidaRecepcionCDRequest,
    CuentasExcluidasRecepcionCDRequest,
    FacturaRecepcionCD,
    ResultadoCuentaExcluidaRecepcionCD,
    RespuestaSP,
} from '../interfaces/RecepcionFacturasCD/RecepcionFacturasCDInterface'

const api = axios.create({
    baseURL: RecepcionFacturasCDUrl
})

export const RecepcionFacturasCDApi = {
    // GET: Facturas con pedido de venta y su recepción en CD (fechas yyyy-MM-dd)
    getFacturasRecepcionCD: (fechaIni: string, fechaFin: string) =>
        api.get<FacturaRecepcionCD[]>('GetFacturasRecepcionCD', { params: { fechaIni, fechaFin } }),

    // ── Cuentas de cliente excluidas del reporte ─────────────────────────────
    getCuentasExcluidas: () =>
        api.get<CuentaExcluidaRecepcionCD[]>('GetCuentasExcluidas'),

    insertCuentaExcluida: (item: CuentaExcluidaRecepcionCDRequest) =>
        api.post<RespuestaSP>('InsertCuentaExcluida', item),

    // POST: Excluir varias cuentas a la vez; devuelve el resultado de cada una
    insertCuentasExcluidas: (request: CuentasExcluidasRecepcionCDRequest) =>
        api.post<ResultadoCuentaExcluidaRecepcionCD[]>('InsertCuentasExcluidas', request),

    deleteCuentaExcluida: (id: number, usuario: string) =>
        api.post<RespuestaSP>(`DeleteCuentaExcluida/${id}`, null, { params: { usuario } }),
}
