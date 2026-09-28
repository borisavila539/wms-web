import React from 'react';
import { IcoEditar } from './icons';

export interface ColumnConfig<T> {
  header: string;
  accessor?: keyof T;
  render?: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  isId?: boolean;
}

interface TablaGenericaProps<T> {
  columns: ColumnConfig<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  onPaginaChange: (nuevaPagina: number) => void;
  onEditItem?: (item: T, index: number) => void;
  emptyMessage?: string;
}

export function TablaGenerica<T>({
  columns,
  data,
  keyExtractor,
  paginaActual,
  totalPaginas,
  totalRegistros,
  onPaginaChange,
  onEditItem,
  emptyMessage = 'No se encontraron registros.',
}: TablaGenericaProps<T>) {
  return (
    <div className="gen-table-container">
      <div className="gen-table-wrapper">
        <table className="gen-data-table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={col.align === 'right' ? 'gen-col-num' : ''}
                  style={{ textAlign: col.align || 'left' }}
                >
                  {col.header}
                </th>
              ))}
              {onEditItem && <th className="gen-col-acciones"></th>}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item, index) => (
                <tr key={keyExtractor(item, index)}>
                  {columns.map((col, cIdx) => {
                    let content: React.ReactNode = null;
                    if (col.render) {
                      content = col.render(item, index);
                    } else if (col.accessor) {
                      content = String(item[col.accessor] ?? '');
                    }

                    return (
                      <td
                        key={cIdx}
                        className={`${col.align === 'right' ? 'gen-col-num' : ''} ${
                          col.isId ? 'gen-td-id' : ''
                        }`}
                        style={{ textAlign: col.align || 'left' }}
                      >
                        {content}
                      </td>
                    );
                  })}
                  {onEditItem && (
                    <td className="gen-col-acciones">
                      <button
                        className="gen-btn-editar-fila"
                        title="Editar fila"
                        onClick={() => onEditItem(item, index)}
                      >
                        <IcoEditar />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (onEditItem ? 1 : 0)}
                  className="gen-empty-row"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <footer className="gen-footer">
        <div className="gen-footer-resumen">
          <div className="gen-resumen-item">
            <span className="gen-resumen-label">Total Registros</span>
            <span className="gen-resumen-valor">{totalRegistros}</span>
          </div>
        </div>

        <div className="gen-footer-paginacion">
          <button
            className="gen-btn-paginacion"
            onClick={() => onPaginaChange(Math.max(1, paginaActual - 1))}
            disabled={paginaActual <= 1}
          >
            ← Anterior
          </button>
          <span className="gen-paginacion-info">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            className="gen-btn-paginacion"
            onClick={() => onPaginaChange(Math.min(totalPaginas, paginaActual + 1))}
            disabled={paginaActual >= totalPaginas}
          >
            Siguiente →
          </button>
        </div>
      </footer>
    </div>
  );
}