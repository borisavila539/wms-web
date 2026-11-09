// Cobertura y pendientes son sobre lo RECIBIDO en el CD; enviadas es informativo
export interface DashboardResumen {
    cajasEnviadas: number
    unidadesEnviadas: number
    cajasRecibidas: number
    unidadesRecibidas: number
    cajasSinRecibir: number
    cajasRecibidasAuditadas: number
    cobertura: number
    cajasPendientes: number
    cajasEnProceso: number
    cajasAuditadas: number
    cajasConDiferencia: number
    cajasDiferenciaEtiqueta: number
    unidadesEsperadas: number
    unidadesEscaneadas: number
    unidadesFaltantes: number
    unidadesSobrantes: number
    unidadesDiferenciaEtiqueta: number
    exactitud: number
    minutosPromedioCaja: number
    // Envios y recepciones salen de un cache que se recalcula cada 10 minutos como maximo
    universoActualizado: string | null
}

// Una fila por linea: planta propia (Denim PEPE, MB, Serigrafía) o contratista externo
export interface DashboardContratista {
    origen: string
    linea: string
    cajasEnviadas: number
    unidadesEnviadas: number
    cajasRecibidas: number
    unidadesRecibidas: number
    cajasRecibidasAuditadas: number
    cobertura: number
    cajasAuditadas: number
    cajasConDiferencia: number
    cajasDiferenciaEtiqueta: number
    unidadesEsperadas: number
    unidadesEscaneadas: number
    unidadesFaltantes: number
    unidadesSobrantes: number
    unidadesDiferenciaEtiqueta: number
    exactitud: number
}

export interface DashboardDia {
    fecha: string
    cajasAuditadas: number
    cajasConDiferencia: number
    unidadesEsperadas: number
    unidadesEscaneadas: number
    unidadesFaltantes: number
    unidadesSobrantes: number
}

export interface DashboardCaja {
    id: number
    op: string
    numeroCaja: number
    estado: string
    resultado: string | null
    modoValidacion: string
    origen: string
    linea: string
    contratista: string | null
    conjunto: string | null
    categoriaInterna: string | null
    articulo: string
    estilo: string | null
    colorDescripcion: string | null
    lote: string | null
    categoriaCaja: string | null
    plDespacho: string | null
    cantidadEsperada: number
    cantidadEscaneada: number
    diferencia: number
    diferenciaEtiqueta: number
    observaciones: string | null
    fechaEnvio: string | null
    fechaRecepcion: string | null
    usuarioInicio: string
    fechaInicio: string
    usuarioCierre: string | null
    fechaCierre: string | null
    minutos: number | null
    rechazos: number
}

export interface DashboardPendiente {
    op: string
    numeroCaja: number
    origen: string
    linea: string
    contratista: string | null
    fechaEnvio: string | null
    fechaRecepcion: string | null
    unidades: number
    estado: string
}

export interface AuditoriaCaja {
    id: number
    op: string
    numeroCaja: number
    estado: string
    resultado: string | null
    modoValidacion: string
    conjunto: string | null
    origen: string
    contratista: string | null
    categoriaInterna: string | null
    articulo: string
    nombreArticulo: string | null
    productoEtiqueta: string | null
    estilo: string | null
    descripcionMB: string | null
    lote: string | null
    colorId: string | null
    colorDescripcion: string | null
    categoriaCaja: string | null
    subCategoriaCaja: string | null
    proveedor: string | null
    paisOrigen: string | null
    dimensiones: string | null
    pesoBruto: string | null
    codigoBarrasCaja: string | null
    empacadoPor: string | null
    fechaCierreEmpaque: string | null
    despachoId: number | null
    plDespacho: string | null
    fechaDespacho: string | null
    cantidadEsperada: number
    cantidadEscaneada: number
    diferencia: number
    faltantes: number
    sobrantes: number
    diferenciaEtiqueta: number
    escaneos: number
    rechazos: number
    observaciones: string | null
    usuarioInicio: string
    fechaInicio: string
    fechaUltimoEscaneo: string | null
    usuarioCierre: string | null
    fechaCierre: string | null
}

export interface AuditoriaLinea {
    id: number
    ean: string
    talla: string
    cantidadEsperada: number
    cantidadEscaneada: number
    diferencia: number
    faltantes: number
    sobrantes: number
    diferenciaEtiqueta: number
    escaneos: number
}

export interface AuditoriaCajaDetalle {
    caja: AuditoriaCaja | null
    lineas: AuditoriaLinea[]
}

export interface AuditoriaEscaneo {
    id: number
    tipo: string
    talla: string | null
    ean: string | null
    serial: string | null
    cantidad: number
    esSobrante: boolean
    codigo: string
    mensaje: string | null
    usuario: string
    fecha: string
}

export interface AuditoriaFaltante {
    id: number
    talla: string | null
    ean: string
    serial: string
    cantidad: number
    codigoEmpaque: string | null
}

export interface AuditoriaHistorial {
    id: number
    accion: string
    resultado: string | null
    cantidadEsperada: number
    cantidadEscaneada: number
    faltantes: number
    sobrantes: number
    diferenciaEtiqueta: number
    comentario: string | null
    usuario: string
    fecha: string
}

export interface AuditoriaRespuesta {
    exito: boolean
    resultado: string
    mensaje: string
    id: number
}
