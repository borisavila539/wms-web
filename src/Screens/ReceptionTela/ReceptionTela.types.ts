export interface ListTelasFilter {
    journalid:              string;
    itemId:                 string;
    nameColor:              string;
    inventBatchId:          string;
    qty:                    number;
    inventserialid:         string;
    vendroll:               string;
    inventserialid_picking: string;
    is_scanning:            number;
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
