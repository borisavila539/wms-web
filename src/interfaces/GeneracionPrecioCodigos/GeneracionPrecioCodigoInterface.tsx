export interface GeneracionPrecioCodigoInterface {
  pedido:string,
  cuentaCliente: string,
  codigoBarra: string,
  articulo: string,
  base: string,
  estilo: string,
  idColor: string,
  referencia: string,
  descripcion: string,
  colorDescripcion: string,
  talla: string,
  descripcion2: string,
  categoria: string,
  cantidad: number,
  costo: number,
  departamento: string,
  subCategoria: string,
  precio:number
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
  imiB_BOXCODE:string
}

export interface ClientesGeneracionPrecio{
  cuentaCliente: string,
  nombre: string,
  moneda: string,
  decimal: boolean
}