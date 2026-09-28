export interface GeneracionPrecioCodigoInterface {
    id: number;
    cuentaCliente: string;
    pedidoVenta: string;
    codigoBarra: string;
    articulo: string;
    base: string;
    estilo: string;
    idColor: string;
    referencia: string;
    descripcion: string;
    colorDescripcion: string;
    talla: string;
    descripcion2: string;
    categoria: string;
    cantidad: number;
    costoAX: number;                      // Nuevo
    costoConfiguracionPrecio: number;     // Nuevo
    precio: number;
    departamento: string;
    subCategoria: string;
    tieneIrregularidad: boolean;          // Nuevo estado de la fila
    confirmado?: boolean;                 // Estado local/backend de confirmación
    deliveryName: string
    coleccion: string;                    // 'B' = Bodega, 'F' = A Futuro
}
export interface ConfiguracionPrecioCodigosinterface {
  id: number,
  cuentaCliente: string,
  base: string,
  idColor: string,
  costo: number,
  precio: number
}

export interface ImpresionEtiquetaPrecio{
  nombre: string,
  codigoBarra: string,
  articulo: string,
  descripcion: string,
  estilo: string,
  talla: string,
  idColor: string,
  precio: number,
  qty: number,
  imiB_BOXCODE:string,
  /** Indica si la línea aún no tiene precio confirmado; mientras sea true no se permite seleccionarla para imprimir. */
  requiereConfirmacion: boolean
}

export interface ClientesGeneracionPrecio{
  cuentaCliente: string,
  nombre: string,
  moneda: string,
  decimal: boolean
}

/** Criterios de búsqueda (consulta contra GetPrecioCodigos). La generación libre se ignora por ahora. */
export interface ImpresionPreciosBusquedaForm {
  pedido: string;
  ruta: string;
  caja: string;
  fecha: string;
}

export const initialImpresionPreciosBusqueda: ImpresionPreciosBusquedaForm = {
  pedido: "",
  ruta: "",
  caja: "",
  fecha: "",
};

/** Filtros de refinamiento aplicados en el cliente sobre los datos ya consultados. */
export interface ImpresionPreciosFiltros {
  codigoArticulo: string;
  talla: string;
  color: string;
  caja: string;
}

export const initialImpresionPreciosFiltros: ImpresionPreciosFiltros = {
  codigoArticulo: "",
  talla: "",
  color: "",
  caja: "",
};

/** Una línea seleccionada por el usuario para imprimir (mismos parámetros que ImpresionEtiquetaPrecio). */
export type LineaImpresionPrecioSeleccionada = ImpresionEtiquetaPrecio;

/**
 * Payload propuesto para el endpoint de impresión selectiva (pendiente de implementar en el backend,
 * ver ImpresionPrecioCodigosSeleccionados). El endpoint actual `ImpresionPrecioCodigos` solo reimprime
 * todo lo que coincide con los filtros de búsqueda, no admite una lista puntual de líneas.
 */
export interface ImpresionPreciosSeleccionRequest {
  impresora: string;
  fecha: string;
  lineas: LineaImpresionPrecioSeleccionada[];
}
