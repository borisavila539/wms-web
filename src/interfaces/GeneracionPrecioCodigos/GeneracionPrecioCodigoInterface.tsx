export interface GeneracionPrecioCodigoInterface {
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