// Fila devuelta por dbo.usp_PedidosFacturasRecibidasCD
export interface FacturaRecepcionCD {
    pv: string
    ruta: string | null
    nombreCliente: string | null
    cuenta: string | null
    factura: string
    fechaGeneracionFactura: string
    fechaRecibidaEnCD: string | null
    ubicacion: string | null
    recibido: 'SI' | 'NO'
}

// Registro de IM_WMS_RecepcionFacturasCD_CuentasExcluidas
export interface CuentaExcluidaRecepcionCD {
    id: number
    cuentaCliente: string
    nombreCliente: string | null
    motivo: string
    usuarioCreacion: string
    fechaCreacion: string
}

export interface CuentaExcluidaRecepcionCDRequest {
    cuentaCliente: string
    motivo: string
    usuario: string
}

// Mismo contrato Exito / Mensaje / Id de los SP de administración
export interface RespuestaSP {
    exito: boolean
    mensaje: string
    id: number
}

// Alta de varias cuentas a la vez, con el mismo motivo
export interface CuentasExcluidasRecepcionCDRequest {
    cuentas: string[]
    motivo: string
    usuario: string
}

// Resultado por cuenta del alta múltiple
export interface ResultadoCuentaExcluidaRecepcionCD {
    cuentaCliente: string
    exito: boolean
    mensaje: string
    id: number
}
