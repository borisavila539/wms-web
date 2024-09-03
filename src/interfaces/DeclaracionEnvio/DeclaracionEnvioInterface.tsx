export interface DeclaracionEnvioninterface{
    caja: string,
    pais: string,
    cuentaCliente: string,
    nombreCliente: string,
    pedidoVenta: string,
    listaEmpaque: string,
    albaran:string,
    numeroCaja: number,
    cantidad: number,
    empacador: string,
    ubicacion: string,
    fecha: Date,
    factura: string,
    calle: string,
    ciudad: string,
    departamento: string,
    paginas:number
  }
export interface DeclaracionEnvioFiltro{
    caja: string,
    pais: string,
    cuentaCliente:string ,
    nombreCliente: string,
    pedidoVenta: string,
    listaEmpaque: string,
    albaran: string,
    ubicacion: string,
    factura: string,
    page: number,
    size: number
  }