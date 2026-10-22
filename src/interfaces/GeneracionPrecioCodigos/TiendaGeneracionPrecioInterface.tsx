// interfaces/GeneracionPrecioCodigos/TiendaGeneracionPrecioInterface.ts
// Coincide con Core.DTOs.GeneracionPrecios.TiendaGeneracionPrecioDto del backend.
// idDireccion = RecId de la dirección postal en AX (dirección de entrega de la ruta de picking).
// Si la tienda es DOLAR, la impresión de etiquetas usa el Precio en Dólares de la confirmación.

export interface TiendaGeneracionPrecioDto {
    id: number;
    codigoCliente: string;
    tienda: string;
    idDireccion: number;
    descripcion: string;
    moneda: string; // 'LEMPIRAS' | 'DOLAR'
}

export const initialTiendaGeneracionPrecio: TiendaGeneracionPrecioDto = {
    id: 0,
    codigoCliente: '',
    tienda: '',
    idDireccion: 0,
    descripcion: '',
    moneda: 'LEMPIRAS',
};

export const MONEDAS_TIENDA = ['LEMPIRAS', 'DOLAR'] as const;

export const IcoStore = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l1.5-5h15L21 9" />
        <path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V9Z" />
        <path d="M5 13v8h14v-8" />
        <path d="M10 21v-5h4v5" />
    </svg>
);
