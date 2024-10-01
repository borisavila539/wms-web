export interface TrackingPedidosFiltroInterface{
    cuentaCliente: string,
    pedido: string,
    listaEmpaque: string,
    albaran: string,
    factura: string,
    page: number,
    size: number
  }
  
  export interface TrackingPedidosInterface{
    cuentaCliente: string,
    nombreCliente: string,
    fechaIngresoPedido: Date,
    pedidoVenta: string,
    listaEmpaque: string,
    fechaGeneracionListaEmpaque: Date,
    fechaListaEmpaqueCompletada: Date,
    albaran: string,
    fechaAlbaran: Date,
    factura: string,
    fechaFactura: Date,
    fechaRececpcionCD: Date,
    fechaDespacho: Date,
    ubicacion: string,
    cajas: number,
    qty: number,
    estadoPedido: string,
    paginas : number
  }