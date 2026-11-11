// Mott & Bow: comparativo vs AX (almacen 22, ubicacion MB-CAJAS) y liberar cajas de despacho

export type EstadoComparativo = '' | 'CUADRA' | 'DIFERENCIA' | 'SOLO MB' | 'SOLO AX'

export interface ComparativoMBAX {
    articulo: string
    descripcion: string
    talla: string
    color: string
    nombreColor: string
    // Disponible: MB sin despacho vs AX disponible fisico
    mbSinDespacho: number
    cajasSinDespacho: number
    axDisponible: number
    diferenciaDisponible: number
    estadoDisponible: EstadoComparativo
    // Despacho: MB en despacho no enviado vs AX en pedido
    mbEnDespacho: number
    cajasEnDespacho: number
    axEnPedido: number
    diferenciaDespacho: number
    estadoDespacho: EstadoComparativo
}

export interface LiberarPermiso {
    puedeLiberar: boolean
}

export interface LiberarDespacho {
    despachoID: number
    usuarioCreacion: string
    fechaCreacion: string
    cajasPrincipales: number
    cajas: number
    unidades: number
    cajasPicking: number
    cajasPacking: number
    // Solo en LiberarCajas/Despacho/{id}: true = packing completo
    enviado?: boolean
}

export interface LiberarCaja {
    id: number
    orden: string
    lote: string
    numeroCaja: number
    articulo: string
    descripcion: string
    talla: string
    color: string
    nombreColor: string
    cantidadTotal: number
    cantidadCajas: number
    cajasConsolidadas: string
    picking: boolean
    userPicking: string
    fechaPicking: string
    packing: boolean
    userPacking: string
    fechaPacking: string
    pallet: string
    ubicacionRecepcion: string
}

export interface LiberarCajasRequest {
    despachoID: number
    ids: number[]
    usuario: string
    motivo: string
}

export interface LiberarCajasResultado {
    ok: boolean
    mensaje: string
    cajasLiberadas: number
    unidades: number
}

export interface LiberarHistorial {
    id: number
    fecha: string
    usuario: string
    motivo: string
    despachoID: number
    cajaID: number
    idConsolidado: number
    orden: string
    numeroCaja: number
    articulo: string
    talla: string
    color: string
    cantidad: number
    picking: boolean
    packing: boolean
    pallet: string
}
