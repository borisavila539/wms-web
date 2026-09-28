import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TallaConfiguracionPrecioDto } from "../../interfaces/GeneracionPrecioCodigos/TallaConfiguracionPrecioInterface";

interface Props {
    talla: string;
    tallas: TallaConfiguracionPrecioDto[];
}

// Muestra el valor de la celda "Talla" y, al pasar el mouse encima, un popover
// (renderizado en document.body vía portal para no quedar recortado por el
// scroll horizontal de la tabla) con las tallas normales/especiales configuradas,
// resaltando la que coincide con la fila actual.
export function TallaInfoHover({ talla, tallas }: Props) {
    const [visible, setVisible] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const spanRef = useRef<HTMLSpanElement | null>(null);

    if (!tallas || tallas.length === 0) {
        return <>{talla}</>;
    }

    const mostrar = () => {
        const rect = spanRef.current?.getBoundingClientRect();
        if (rect) {
            setPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX });
        }
        setVisible(true);
    };
    const ocultar = () => setVisible(false);

    const normales = tallas.filter(t => t.tipo.toUpperCase() !== 'ESPECIAL');
    const especiales = tallas.filter(t => t.tipo.toUpperCase() === 'ESPECIAL');

    const renderGrupo = (titulo: string, grupo: TallaConfiguracionPrecioDto[], especial: boolean) => (
        <div className="talla-popover__grupo">
            <span className="talla-popover__grupo-titulo">{titulo}</span>
            <div className="talla-popover__chips">
                {grupo.length === 0 && <span className="talla-popover__vacio">—</span>}
                {grupo.map(t => (
                    <span
                        key={t.id}
                        className={`talla-chip${especial ? ' talla-chip--especial' : ''}${t.talla.toUpperCase() === talla.toUpperCase() ? ' talla-chip--activo' : ''}`}
                    >
                        {t.talla} <em>{t.genero}</em>
                    </span>
                ))}
            </div>
        </div>
    );

    return (
        <span
            ref={spanRef}
            className="talla-hover-trigger"
            onMouseEnter={mostrar}
            onMouseLeave={ocultar}
        >
            {talla}
            {visible && createPortal(
                <div className="talla-popover" style={{ top: pos.top, left: pos.left }}>
                    <p className="talla-popover__titulo">Tallas configuradas</p>
                    {renderGrupo('Normal', normales, false)}
                    {renderGrupo('Especial', especiales, true)}
                </div>,
                document.body
            )}
        </span>
    );
}
