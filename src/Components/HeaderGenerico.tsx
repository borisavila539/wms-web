import React from 'react';
import { IcoDatabase } from './icons';

export type EstadoBadgeMode = 'consultando' | 'vacio' | 'datos' | 'procesando' | 'guardando';

interface HeaderGenericoProps {
  titulo: string;
  subtitulo?: string;
  icono?: React.ReactNode;
  estado?: EstadoBadgeMode;
  estadoLabelMap?: Record<EstadoBadgeMode, string>;
}

const DEFAULT_LABELS: Record<EstadoBadgeMode, string> = {
  consultando: 'Consultando BD…',
  vacio: 'Sin datos',
  datos: 'Datos cargados',
  procesando: 'Procesando…',
  guardando: 'Guardando…',
};

export const HeaderGenerico: React.FC<HeaderGenericoProps> = ({
  titulo,
  subtitulo,
  icono = <IcoDatabase />,
  estado,
  estadoLabelMap = DEFAULT_LABELS,
}) => {
  return (
    <header className="gen-header">
      <div className="gen-header-titulo-grupo">
        {icono && <span className="gen-header-icono">{icono}</span>}
        <div>
          <h1>{titulo}</h1>
          {subtitulo && <p>{subtitulo}</p>}
        </div>
      </div>

      {estado && (
        <span className={`gen-modo-badge gen-modo-badge--${estado}`}>
          <span className="gen-modo-badge__dot" />
          {estadoLabelMap[estado] || estado}
        </span>
      )}
    </header>
  );
};