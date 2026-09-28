// interfaces/GeneracionPrecioCodigos/CategoriaPorClienteBaseInterface.ts
// Coincide con Core.DTOs.GeneracionPrecios.CategoriaPorClienteBaseDto del backend.

export interface CategoriaPorClienteBaseDto {
    cuentaCliente: string;
    base: string;
    categoria: string;
    subCategoria: string;
    coleccion: string;
}

export const IcoSearch = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);
