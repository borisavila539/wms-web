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
    precio: number;                       // Precio en lempiras
    precioDolar: number;                  // Precio en dólares (0 = sin precio)
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
  requiereConfirmacion: boolean,
  /** Tienda según la dirección de entrega de la ruta de la caja (vacío si no está registrada). */
  tienda: string,
  /** LEMPIRAS | DOLAR. Si es DOLAR, `precio` ya viene en dólares. */
  monedaTienda: string
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
 * Payload de ImpresionPrecioCodigosSeleccionados. pedido/ruta/caja son el criterio de la última
 * búsqueda: el backend vuelve a consultar con ellos y solo imprime si las líneas siguen confirmadas
 * y con precio (no confía en requiereConfirmacion/precio que manda el navegador).
 */
export interface ImpresionPreciosSeleccionRequest {
  impresora: string;
  fecha: string;
  pedido: string;
  ruta: string;
  caja: string;
  lineas: LineaImpresionPrecioSeleccionada[];
}
