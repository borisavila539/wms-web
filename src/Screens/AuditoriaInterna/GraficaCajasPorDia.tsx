import React, { useEffect, useMemo, useRef, useState } from 'react'
import { DashboardDia } from '../../interfaces/AuditoriaInterna/AuditoriaInternaInterface'

interface Props {
    datos: DashboardDia[]
}

// Tamaño inicial; luego se usa el del contenedor (la gráfica llena la tarjeta)
const ANCHO_INICIAL = 640
const ALTO_INICIAL = 220
const MARGEN = { top: 12, right: 12, bottom: 28, left: 36 }
const RADIO = 4

const fechaCorta = (valor: string) => {
    const d = new Date(valor)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Escala "bonita" para el eje Y: 4 divisiones con paso redondo
const pasoEje = (maximo: number) => {
    if (maximo <= 4) return 1
    const bruto = maximo / 4
    const magnitud = Math.pow(10, Math.floor(Math.log10(bruto)))
    const normal = bruto / magnitud
    return (normal <= 1 ? 1 : normal <= 2 ? 2 : normal <= 5 ? 5 : 10) * magnitud
}

// Barra con solo las esquinas superiores redondeadas (apoyada en la linea base)
const pathBarra = (x: number, y: number, w: number, h: number) => {
    const r = Math.min(RADIO, w / 2, h)
    return `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`
}

export const GraficaCajasPorDia: React.FC<Props> = ({ datos }) => {
    const [activo, setActivo] = useState<number | null>(null)
    const contenedor = useRef<HTMLDivElement>(null)
    const [tamano, setTamano] = useState({ ancho: ANCHO_INICIAL, alto: ALTO_INICIAL })

    // Se dibuja en pixeles reales: llena el alto disponible y los textos no se encogen
    useEffect(() => {
        const el = contenedor.current
        if (!el) return
        const medir = () => {
            const ancho = Math.round(el.clientWidth)
            const alto = Math.round(el.clientHeight)
            if (ancho > 0 && alto > 0) setTamano(t => (t.ancho === ancho && t.alto === alto ? t : { ancho, alto }))
        }
        medir()
        if (typeof ResizeObserver === 'undefined') return
        const observador = new ResizeObserver(medir)
        observador.observe(el)
        return () => observador.disconnect()
    }, [datos.length === 0]) // eslint-disable-line react-hooks/exhaustive-deps
    const { ancho: ANCHO, alto: ALTO } = tamano

    const escala = useMemo(() => {
        const maximo = Math.max(1, ...datos.map(d => d.cajasAuditadas))
        const paso = pasoEje(maximo)
        const tope = Math.ceil(maximo / paso) * paso
        const marcas: number[] = []
        for (let v = 0; v <= tope; v += paso) marcas.push(v)
        return { tope, marcas }
    }, [datos])

    if (datos.length === 0) {
        return <div className="ai-grafica-vacia">Sin cajas auditadas en el periodo.</div>
    }

    const anchoPlot = ANCHO - MARGEN.left - MARGEN.right
    const altoPlot = ALTO - MARGEN.top - MARGEN.bottom
    const columna = anchoPlot / datos.length
    const anchoBarra = Math.max(2, Math.min(28, columna - 2))
    const y = (v: number) => MARGEN.top + altoPlot - (v / escala.tope) * altoPlot
    // Etiquetas del eje X sin encimarse
    const cadaCuanto = Math.max(1, Math.ceil(datos.length / 10))

    const itemActivo = activo !== null ? datos[activo] : null
    const xActivo = activo !== null ? MARGEN.left + columna * activo + columna / 2 : 0

    return (
        <div className="ai-grafica" ref={contenedor} onMouseLeave={() => setActivo(null)}>
            <svg width={ANCHO} height={ALTO} viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-label="Cajas auditadas por dia">
                {escala.marcas.map(m => (
                    <g key={m}>
                        <line x1={MARGEN.left} x2={ANCHO - MARGEN.right} y1={y(m)} y2={y(m)} className="ai-grafica-grid" />
                        <text x={MARGEN.left - 6} y={y(m)} className="ai-grafica-eje" textAnchor="end" dominantBaseline="middle">{m}</text>
                    </g>
                ))}

                {datos.map((d, i) => {
                    const alto = (d.cajasAuditadas / escala.tope) * altoPlot
                    const x = MARGEN.left + columna * i + (columna - anchoBarra) / 2
                    return (
                        <g key={d.fecha}>
                            {alto > 0 && (
                                <path
                                    d={pathBarra(x, y(d.cajasAuditadas), anchoBarra, alto)}
                                    className={`ai-grafica-barra ${activo === i ? 'ai-grafica-barra--activa' : ''}`}
                                />
                            )}
                            {i % cadaCuanto === 0 && (
                                <text x={MARGEN.left + columna * i + columna / 2} y={ALTO - 8} className="ai-grafica-eje" textAnchor="middle">
                                    {fechaCorta(d.fecha)}
                                </text>
                            )}
                            {/* Zona de hover mas grande que la barra */}
                            <rect
                                x={MARGEN.left + columna * i}
                                y={MARGEN.top}
                                width={columna}
                                height={altoPlot}
                                fill="transparent"
                                onMouseEnter={() => setActivo(i)}
                            />
                        </g>
                    )
                })}

                <line x1={MARGEN.left} x2={ANCHO - MARGEN.right} y1={y(0)} y2={y(0)} className="ai-grafica-base" />
            </svg>

            {itemActivo && (
                <div
                    className="ai-grafica-tooltip"
                    style={{ left: `${(xActivo / ANCHO) * 100}%` }}
                >
                    <strong>{new Date(itemActivo.fecha).toLocaleDateString('es-HN', { weekday: 'short', day: '2-digit', month: 'short' })}</strong>
                    <span>Cajas auditadas: <b>{itemActivo.cajasAuditadas}</b></span>
                    <span>Con diferencia: <b>{itemActivo.cajasConDiferencia}</b></span>
                    <span>Unidades: <b>{itemActivo.unidadesEscaneadas}</b> / {itemActivo.unidadesEsperadas}</span>
                    <span>Faltantes: <b>{itemActivo.unidadesFaltantes}</b> · Sobrantes: <b>{itemActivo.unidadesSobrantes}</b></span>
                </div>
            )}
        </div>
    )
}
