import React, { useState } from 'react';
import { IcoFilter } from './icons';


export interface FiltroCampoTexto {
  key: string;
  label: string;
  placeholder?: string;
}

export interface FiltroCampoRango {
  keyMin: string;
  keyMax: string;
  label: string;
}

export interface FiltroOpcionSelect {
  value: string;
  label: string;
}

export interface FiltroCampoSelect {
  key: string;
  label: string;
  opciones: FiltroOpcionSelect[];
}

interface FiltrosGenericosProps {
  camposTexto?: FiltroCampoTexto[];
  camposRango?: FiltroCampoRango[];
  camposSelect?: FiltroCampoSelect[];
  valoresTexto: Record<string, string>;
  valoresNum: Record<string, string>;
  valoresSelect?: Record<string, string>;
  onTextoChange: (key: string, valor: string) => void;
  onNumChange: (key: string, valor: string) => void;
  onSelectChange?: (key: string, valor: string) => void;
  onLimpiar: () => void;
  hayFiltrosActivos: boolean;
  abiertoPorDefecto?: boolean;
}

export const FiltrosGenericos: React.FC<FiltrosGenericosProps> = ({
  camposTexto = [],
  camposRango = [],
  camposSelect = [],
  valoresTexto,
  valoresNum,
  valoresSelect = {},
  onTextoChange,
  onNumChange,
  onSelectChange,
  onLimpiar,
  hayFiltrosActivos,
  abiertoPorDefecto = false,
}) => {
  const [mostrarFiltros, setMostrarFiltros] = useState(abiertoPorDefecto);

  return (
    <div className="filtros-container">
      <button
        className="filtros-toggle-btn"
        onClick={() => setMostrarFiltros((prev) => !prev)}
        type="button"
      >
        <div className="filtros-toggle-info">
          <IcoFilter />
          <span className="titulo">Filtros de búsqueda</span>
          {hayFiltrosActivos && <span className="badge-activo">Activos</span>}
        </div>
        <span className={`chevron${mostrarFiltros ? ' chevron--abierto' : ''}`}>▼</span>
      </button>

      {mostrarFiltros && (
        <div className="filtros-bar">
          {camposTexto.map((campo) => (
            <div className="filtro-grupo" key={campo.key}>
              <label>{campo.label}</label>
              <input
                type="text"
                placeholder={campo.placeholder || 'Filtrar…'}
                value={valoresTexto[campo.key] || ''}
                onChange={(e) => onTextoChange(campo.key, e.target.value)}
              />
            </div>
          ))}

          {camposSelect.map((campo) => (
            <div className="filtro-grupo" key={campo.key}>
              <label>{campo.label}</label>
              <select
                value={valoresSelect[campo.key] || ''}
                onChange={(e) => onSelectChange && onSelectChange(campo.key, e.target.value)}
              >
                {campo.opciones.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
                ))}
              </select>
            </div>
          ))}

          {camposRango.map((rango) => (
            <div className="filtro-grupo filtro-rango" key={rango.label}>
              <label>{rango.label}</label>
              <div className="filtro-rango-inputs">
                <input
                  type="number"
                  placeholder="Mín"
                  value={valoresNum[rango.keyMin] || ''}
                  onChange={(e) => onNumChange(rango.keyMin, e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Máx"
                  value={valoresNum[rango.keyMax] || ''}
                  onChange={(e) => onNumChange(rango.keyMax, e.target.value)}
                />
              </div>
            </div>
          ))}

          <button
            className="btn-limpiar"
            onClick={onLimpiar}
            disabled={!hayFiltrosActivos}
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
};