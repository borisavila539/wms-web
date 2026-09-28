// interfaces/GeneracionPrecioCodigos/TallaConfiguracionPrecioInterface.ts
// Coincide con Core.DTOs.GeneracionPrecios.TallaConfiguracionPrecioDto / RespuestaSP del backend.

export interface TallaConfiguracionPrecioDto {
    id: number;
    genero: string;
    talla: string;
    tipo: string; // 'NORMAL' | 'ESPECIAL'
}

export const initialTallaConfiguracionPrecio: TallaConfiguracionPrecioDto = {
    id: 0,
    genero: '',
    talla: '',
    tipo: 'NORMAL',
};

export interface RespuestaSP {
    exito: boolean;
    mensaje: string;
    id: number;
}

export const TIPOS_TALLA = ['NORMAL', 'ESPECIAL'] as const;

export const IcoRuler = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.3 8.7 15.3 2.7a1 1 0 0 0-1.4 0L2.7 13.9a1 1 0 0 0 0 1.4l6 6a1 1 0 0 0 1.4 0L21.3 10.1a1 1 0 0 0 0-1.4Z" />
        <path d="m7.5 10.5 2 2M10.5 7.5l2 2M13.5 4.5l2 2" />
    </svg>
);

export const IcoTrash = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);
