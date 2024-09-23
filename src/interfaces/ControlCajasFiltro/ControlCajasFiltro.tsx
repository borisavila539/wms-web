export interface ControlCajaEtiquetadoFiltro {
    pedido: string,
    ruta: string,
    boxNum: string,
    lote: string,
    empleado: string,
    page: number,
    size: number,
    fecha:string
}

export interface ControlCajasEtiquetadoDetalleInterface {
    pedido: string,
    ruta: string,
    codigoCaja: string,
    numeroCaja: string,
    unidades: number,
    bfplineid: string,
    temporada: string,
    inicio: Date,
    fin: Date,
    tiempo: Date,
    empleado: string,
    paginas:number
}

export interface ControlCajasEtiquetadoDetalleInterfaceS {
    pedido: string,
    ruta: string,
    codigoCaja: string,
    numeroCaja: string,
    unidades: number,
    bfplineid: string,
    temporada: string,
    inicio: Date,
    fin: Date,
    tiempo: string,
    empleado: string,
    paginas:number
}
