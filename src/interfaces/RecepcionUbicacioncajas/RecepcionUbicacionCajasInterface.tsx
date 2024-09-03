export interface RecepcionUbicacionCajasInterface {
    lote: string,
    op: string,
    articulo: string,
    numeroDeCaja: string,
    talla: string,
    cantidadEnCaja: string,
    fechaDeEnvio: Date,
    fechaDeRecepcion: Date,
    color: string,
    ubicacion: string,
    paginas: number
}

export interface RecepcionUbicacionCajasStringInterface {
    lote: string,
    op: string,
    articulo: string,
    numeroDeCaja: string,
    talla: string,
    cantidadEnCaja: string,
    fechaDeEnvio: Date,
    fechaDeRecepcion: Date,
    color: string,
    ubicacion: string
}

export interface RecepcionUbicacionFiltro {

    lote: string,
    orden: string,
    articulo: string,
    talla: string,
    color: string,
    ubicacion: string,
    page: number,
    size: number,
    tipo:string

}
