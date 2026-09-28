import React from 'react';
import { IcoX, IcoRefresh, IcoDownload, IcoPlus, Spinner } from './icons';


interface SeccionBusquedaAccionesProps {
  busquedaGlobal?: string;
  onBusquedaChange?: (valor: string) => void;
  placeholderBusqueda?: string;
  onNuevoRegistro?: () => void;
  labelNuevo?: string;
  onRefrescar?: () => void;
  onExportar?: () => void;
  disabledExportar?: boolean;
  cargandoRefresco?: boolean;
}

export const SeccionBusquedaAcciones: React.FC<SeccionBusquedaAccionesProps> = ({
  busquedaGlobal,
  onBusquedaChange,
  placeholderBusqueda = 'Buscar en los registros…',
  onNuevoRegistro,
  labelNuevo = 'Nuevo registro',
  onRefrescar,
  onExportar,
  disabledExportar = false,
  cargandoRefresco = false,
}) => {
  return (
    <section className="upload-card-header">
      <div className="header-action-bar">
        {/* Campo de Búsqueda Rápida (opcional) */}
        {onBusquedaChange && (
          <div className="search-input-group">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="input-busqueda-global"
              placeholder={placeholderBusqueda}
              value={busquedaGlobal}
              onChange={(e) => onBusquedaChange(e.target.value)}
            />
            {busquedaGlobal && (
              <button className="btn-limpiar-busqueda" onClick={() => onBusquedaChange('')}>
                <IcoX />
              </button>
            )}
          </div>
        )}

        {/* Botón de Refrescar */}
        {onRefrescar && (
          <button className="btn-actualizar" onClick={onRefrescar} disabled={cargandoRefresco}>
            {cargandoRefresco ? <Spinner size={15} /> : <IcoRefresh />}
            <span>Refrescar</span>
          </button>
        )}

        {/* Botón de Exportar */}
        {onExportar && (
          <button className="btn-outline" onClick={onExportar} disabled={disabledExportar}>
            <IcoDownload />
            <span>Exportar</span>
          </button>
        )}

        {/* Acción Principal / Nuevo */}
        {onNuevoRegistro && (
          <button className="btn-submit action-spacer" onClick={onNuevoRegistro}>
            <IcoPlus />
            <span>{labelNuevo}</span>
          </button>
        )}
      </div>
    </section>
  );
}; 
