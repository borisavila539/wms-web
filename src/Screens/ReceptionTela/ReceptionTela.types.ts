export interface ListTelasFilter {
    journalid:              string;
    itemId:                 string;
    nameColor:              string;
    inventBatchId:          string;
    qty:                    number;
    inventserialid:         string;
    vendroll:               string;
    inventserialid_picking: string;
    is_scanning:            boolean;
    created_date:           Date;
    update_date:            null | Date;
    user:                   null | Date;
    tela_picking_id:        string;
    vendroll_picking:       string;
    reference:              string;
    telaPickingDefectoId:   null | number;
    location:               null | string;
    descriptionDefecto:     null | string;
    rowNum:                 number;
    totalRecords:           number;
    nameProveedor:          string | null;
    configid:               string | null;
}

export interface ParmsFilter {
    journalId:            string;
    color:                null | string;
    inventBatchId:        null | number;
    inventSerialId:       null | number;
    isScanning:           null | boolean;
    telaPickingDefectoId: null | number;
    reference:            null | string;
    ubicacion:            null | string;
    vendRoll:             null | string;
    pageNumber:           null | number;
    configId:             null | number;
    pageSize:             number;
}

export interface PickingDefecto {
    telaPickingDefectoId: number;
    descriptionDefecto:   string;
}

export interface TelasFilterByReference {
    totalRollos:   number;
    totalCantidad: number;
}

export interface Impresoras {
    iM_DESCRIPTION_PRINTER: string;
    iM_IPPRINTER:           string;
}