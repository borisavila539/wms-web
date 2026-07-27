export interface IMWMSDespachoPT {
  id?: number;
  driver: string;
  truck: string;
  estadoID: number;
  userCreated: number;
  createdDateTime: string;
  almacen: string;
  cajaSegundas: number;
  cajasTerceras: number;
}

export interface IMWMSDespachoPTDetalle {
  id?: number;
  prodCutSheetID: string;
  box: number;
  size: string;
  color: string;
  itemID: string;
  prodID: string;
  qty: number;
}

export interface IMWMSEstatusUnidadesOP {
  id?: number;
  prodID: string;
  size: string;
  costura1: number;
  textil1: number;
  textil2: number;
  costura2: number;
}

// Respuesta que te retorna C# tras hacer el Insert en SQL
export interface DespachoResponse {
  success: boolean;
  message: string;
  despachoID?: number;
  cabecera?: IMWMSDespachoPT;
  detalle?: IMWMSDespachoPTDetalle[];
  estatusOP?: IMWMSEstatusUnidadesOP[];
}