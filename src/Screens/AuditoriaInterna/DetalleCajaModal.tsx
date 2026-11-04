import React, { useCallback, useEffect, useState } from 'react'
import { RotateCcw, Eraser } from 'lucide-react'
import { AuditoriaInternaApi } from '../../api/AuditoriaInternaApi'
import { AuditoriaCajaDetalle, AuditoriaEscaneo, AuditoriaFaltante, AuditoriaHistorial } from '../../interfaces/AuditoriaInterna/AuditoriaInternaInterface'
import { IcoX, Spinner } from '../../Components/icons'

interface Props {
    auditoriaId: number
    usuario: string
    puedeReabrir: boolean
    onCerrar: () => void
    // Se llama despues de reabrir o reiniciar para refrescar el dashboard
    onCambio: () => void
}

type Pestana = 'tallas' | 'escaneos' | 'faltantes' | 'historial'
type Accion = 'reabrir' | 'reiniciar'

const TEXTO_ACCION: Record<Accion, { label: string; placeholder: string; nota: string; confirmar: string; procesando: string; error: string }> = {
    reabrir: {
        label: 'Motivo de la reapertura (obligatorio)',
        placeholder: 'Ej. Se encontraron 2 paquetes en otra tarima, completar auditoría.',
        nota: 'La caja vuelve a la lista de cajas abiertas de la app. Se conservan los escaneos.',
        confirmar: 'Confirmar reapertura',
        procesando: 'Reabriendo…',
        error: 'Error al reabrir la caja.',
    },
    reiniciar: {
        label: 'Motivo del reinicio (obligatorio)',
        placeholder: 'Ej. Se escaneó con piezas de otra caja, hay que auditarla desde cero.',
        nota: 'Se borran todos los escaneos y rechazos de la caja; queda abierta en 0 en la app para escanearla de nuevo. El historial se conserva.',
        confirmar: 'Confirmar reinicio',
        procesando: 'Reiniciando…',
        error: 'Error al reiniciar la caja.',
    },
}

const ETIQUETA_HISTORIAL: Record<string, { texto: string; clase: string }> = {
    CIERRE: { texto: 'Cierre', clase: 'pendiente' },
    REAPERTURA: { texto: 'Reapertura', clase: 'proceso' },
    REINICIO: { texto: 'Reinicio', clase: 'faltante' },
}

export const formatearFechaHora = (valor: string | null | undefined) => {
    if (!valor) return ''
    const d = new Date(valor)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}

export const etiquetaResultado = (estado: string, resultado: string | null) => {
    if (estado === 'ABIERTA') return { texto: 'En proceso', clase: 'proceso' }
    switch (resultado) {
        case 'COMPLETA': return { texto: 'Completa', clase: 'completa' }
        case 'FALTANTE': return { texto: 'Faltante', clase: 'faltante' }
        case 'SOBRANTE': return { texto: 'Sobrante', clase: 'sobrante' }
        case 'MIXTO': return { texto: 'Faltante y sobrante', clase: 'faltante' }
        default: return { texto: resultado ?? '', clase: 'proceso' }
    }
}

export const DetalleCajaModal: React.FC<Props> = ({ auditoriaId, usuario, puedeReabrir, onCerrar, onCambio }) => {
    const [detalle, setDetalle] = useState<AuditoriaCajaDetalle | null>(null)
    const [escaneos, setEscaneos] = useState<AuditoriaEscaneo[]>([])
    const [faltantes, setFaltantes] = useState<AuditoriaFaltante[]>([])
    const [historial, setHistorial] = useState<AuditoriaHistorial[]>([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [pestana, setPestana] = useState<Pestana>('tallas')

    // Reapertura / reinicio
    const [accion, setAccion] = useState<Accion | null>(null)
    const [motivo, setMotivo] = useState('')
    const [guardando, setGuardando] = useState(false)
    const [exito, setExito] = useState<string | null>(null)

    const cargar = useCallback(async () => {
        setCargando(true)
        try {
            const [caja, esc, fal, his] = await Promise.all([
                AuditoriaInternaApi.getCaja(auditoriaId),
                AuditoriaInternaApi.getEscaneos(auditoriaId),
                AuditoriaInternaApi.getFaltantes(auditoriaId),
                AuditoriaInternaApi.getHistorial(auditoriaId),
            ])
            setDetalle(caja.data)
            setEscaneos(esc.data)
            setFaltantes(fal.data)
            setHistorial(his.data)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al cargar el detalle de la caja.')
        }
        setCargando(false)
    }, [auditoriaId])

    useEffect(() => { cargar() }, [cargar])

    const iniciarAccion = (a: Accion) => { setAccion(a); setMotivo(''); setError(null); setExito(null) }

    const handleConfirmar = async () => {
        if (!accion) return
        if (!motivo.trim()) {
            setError(`Escriba el motivo ${accion === 'reabrir' ? 'de la reapertura' : 'del reinicio'}.`)
            return
        }
        setGuardando(true)
        setError(null)
        try {
            const llamada = accion === 'reabrir' ? AuditoriaInternaApi.reabrirCaja : AuditoriaInternaApi.reiniciarCaja
            const resp = await llamada(auditoriaId, motivo.trim(), usuario)
            if (resp.data.exito) {
                setExito(resp.data.mensaje)
                setAccion(null)
                setMotivo('')
                setPestana('historial')
                await cargar()
                onCambio()
            } else {
                setError(resp.data.mensaje)
            }
        } catch (err: any) {
            setError(err.response?.data?.message || TEXTO_ACCION[accion].error)
        }
        setGuardando(false)
    }

    useEffect(() => {
        const alPresionar = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
        window.addEventListener('keydown', alPresionar)
        return () => window.removeEventListener('keydown', alPresionar)
    }, [onCerrar])

    const caja = detalle?.caja
    const resultado = caja ? etiquetaResultado(caja.estado, caja.resultado) : null

    const dato = (etiqueta: string, valor: React.ReactNode) => (
        <div className="ai-dato">
            <span className="ai-dato__label">{etiqueta}</span>
            <span className="ai-dato__valor">{valor || <span className="ai-sin-dato">—</span>}</span>
        </div>
    )

    return (
        <div className="ai-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onCerrar() }}>
            <div className="ai-modal" role="dialog" aria-modal="true" aria-labelledby="ai-modal-titulo">
                <div className="ai-modal__header">
                    <div>
                        <h2 id="ai-modal-titulo">{caja ? `${caja.op} · Caja ${caja.numeroCaja}` : 'Detalle de caja'}</h2>
                        {caja && (
                            <p>
                                {caja.articulo} {caja.estilo ? `· ${caja.estilo}` : ''} {caja.colorDescripcion ? `· ${caja.colorDescripcion}` : ''}
                                {resultado && <span className={`ai-badge ai-badge--${resultado.clase}`}>{resultado.texto}</span>}
                            </p>
                        )}
                    </div>
                    <button className="ai-modal__cerrar" onClick={onCerrar} aria-label="Cerrar"><IcoX /></button>
                </div>

                <div className="ai-modal__body">
                    {cargando && <div className="ai-cargando"><Spinner size={18} /> Cargando…</div>}
                    {error && <div className="alert-box alert-error">{error}</div>}
                    {exito && <div className="alert-box alert-success">{exito}</div>}

                    {/* Reabrir (solo cerradas) y reiniciar (abiertas o cerradas): solo usuarios con permiso */}
                    {caja && puedeReabrir && (
                        <div className="ai-reabrir">
                            {!accion ? (
                                <div className="ai-reabrir__botones">
                                    {caja.estado === 'CERRADA' && (
                                        <button className="gen-btn-outline" onClick={() => iniciarAccion('reabrir')}>
                                            <RotateCcw size={15} />
                                            <span>Reabrir caja</span>
                                        </button>
                                    )}
                                    <button className="gen-btn-outline ai-btn-peligro" onClick={() => iniciarAccion('reiniciar')}>
                                        <Eraser size={15} />
                                        <span>Reiniciar caja</span>
                                    </button>
                                </div>
                            ) : (
                                <div className={`ai-reabrir__form ${accion === 'reiniciar' ? 'ai-reabrir__form--peligro' : ''}`}>
                                    <label htmlFor="ai-motivo">{TEXTO_ACCION[accion].label}</label>
                                    <textarea
                                        id="ai-motivo"
                                        value={motivo}
                                        maxLength={500}
                                        rows={3}
                                        placeholder={TEXTO_ACCION[accion].placeholder}
                                        onChange={e => setMotivo(e.target.value)}
                                        autoFocus
                                    />
                                    <span className="ai-reabrir__nota">
                                        {accion === 'reiniciar'
                                            ? `Se borran ${caja.cantidadEscaneada} unidades escaneadas (${escaneos.length} lecturas) y la caja queda abierta en 0 en la app para escanearla de nuevo. El historial se conserva.`
                                            : TEXTO_ACCION[accion].nota}
                                    </span>
                                    <div className="ai-reabrir__botones">
                                        <button className={`gen-btn-submit ${accion === 'reiniciar' ? 'ai-btn-peligro--solido' : ''}`}
                                            onClick={handleConfirmar} disabled={guardando || !motivo.trim()}>
                                            {guardando ? <Spinner size={15} /> : accion === 'reabrir' ? <RotateCcw size={15} /> : <Eraser size={15} />}
                                            <span>{guardando ? TEXTO_ACCION[accion].procesando : TEXTO_ACCION[accion].confirmar}</span>
                                        </button>
                                        <button className="gen-btn-outline" onClick={() => { setAccion(null); setMotivo('') }} disabled={guardando}>
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {caja && (
                        <>
                            <div className="ai-datos-grid">
                                {dato('Origen', caja.origen === 'PLANTA' ? 'Planta' : 'Contratista')}
                                {dato('Contratista / Conjunto', `${caja.contratista ?? ''}${caja.conjunto ? ` (${caja.conjunto})` : ''}`)}
                                {dato('Categoría', caja.categoriaInterna)}
                                {dato('Calidad', caja.categoriaCaja)}
                                {dato('Lote', caja.lote)}
                                {dato('PL despacho', caja.plDespacho)}
                                {dato('Producto (etiqueta)', caja.productoEtiqueta)}
                                {dato('Descripción', caja.descripcionMB ?? caja.nombreArticulo)}
                                {dato('Proveedor', caja.proveedor)}
                                {dato('País origen', caja.paisOrigen)}
                                {dato('Dimensiones / Peso', [caja.dimensiones, caja.pesoBruto].filter(Boolean).join(' · '))}
                                {dato('Empacado por', `${caja.empacadoPor ?? ''} ${formatearFechaHora(caja.fechaCierreEmpaque)}`)}
                                {dato('Validación', caja.modoValidacion === 'PIEZA' ? 'Pieza exacta' : 'Solo cantidad')}
                                {dato('Auditó', `${caja.usuarioInicio} · ${formatearFechaHora(caja.fechaInicio)}`)}
                                {dato('Cerró', caja.usuarioCierre ? `${caja.usuarioCierre} · ${formatearFechaHora(caja.fechaCierre)}` : '')}
                                {dato('Observaciones', caja.observaciones)}
                            </div>

                            <div className="ai-totales">
                                <div><span>Esperado</span><b>{caja.cantidadEsperada}</b></div>
                                <div><span>Escaneado</span><b>{caja.cantidadEscaneada}</b></div>
                                <div><span>Faltantes</span><b className={caja.faltantes > 0 ? 'ai-num--alerta' : ''}>{caja.faltantes}</b></div>
                                <div><span>Sobrantes</span><b className={caja.sobrantes > 0 ? 'ai-num--alerta' : ''}>{caja.sobrantes}</b></div>
                                <div><span>Rechazos</span><b>{caja.rechazos}</b></div>
                            </div>

                            <div className="ai-segmentado" role="tablist">
                                {([
                                    ['tallas', `Por talla (${detalle?.lineas.length ?? 0})`],
                                    ['escaneos', `Escaneos (${escaneos.length})`],
                                    ['faltantes', `Piezas faltantes (${faltantes.length})`],
                                    ['historial', `Historial (${historial.length})`],
                                ] as [Pestana, string][]).map(([valor, texto]) => (
                                    <button key={valor} role="tab" aria-selected={pestana === valor}
                                        className={pestana === valor ? 'ai-segmentado--activo' : ''}
                                        onClick={() => setPestana(valor)}>{texto}</button>
                                ))}
                            </div>

                            <div className="ai-tabla-wrapper">
                                {pestana === 'tallas' && (
                                    <table className="gen-data-table">
                                        <thead><tr><th>Talla</th><th>EAN</th><th className="ai-num">Esperado</th><th className="ai-num">Escaneado</th><th className="ai-num">Faltantes</th><th className="ai-num">Sobrantes</th></tr></thead>
                                        <tbody>
                                            {detalle?.lineas.map(l => (
                                                <tr key={l.id}>
                                                    <td>{l.talla}</td><td>{l.ean}</td>
                                                    <td className="ai-num">{l.cantidadEsperada}</td><td className="ai-num">{l.cantidadEscaneada}</td>
                                                    <td className={`ai-num ${l.faltantes > 0 ? 'ai-num--alerta' : ''}`}>{l.faltantes}</td>
                                                    <td className={`ai-num ${l.sobrantes > 0 ? 'ai-num--alerta' : ''}`}>{l.sobrantes}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {pestana === 'escaneos' && (
                                    <table className="gen-data-table">
                                        <thead><tr><th>Fecha</th><th>Resultado</th><th>Talla</th><th>Serial</th><th className="ai-num">Cant.</th><th>Código / mensaje</th><th>Usuario</th></tr></thead>
                                        <tbody>
                                            {escaneos.length === 0 && <tr><td colSpan={7} className="ai-sin-dato">Sin escaneos.</td></tr>}
                                            {escaneos.map(e => (
                                                <tr key={`${e.tipo}-${e.id}`}>
                                                    <td>{formatearFechaHora(e.fecha)}</td>
                                                    <td>
                                                        <span className={`ai-badge ai-badge--${e.tipo === 'ACEPTADO' ? (e.esSobrante ? 'sobrante' : 'completa') : 'rechazo'}`}>
                                                            {e.tipo === 'ACEPTADO' ? (e.esSobrante ? 'Sobrante' : 'Aceptado') : e.tipo.replace(/_/g, ' ').toLowerCase()}
                                                        </span>
                                                    </td>
                                                    <td>{e.talla ?? ''}</td>
                                                    <td>{e.serial ?? ''}</td>
                                                    <td className="ai-num">{e.cantidad || ''}</td>
                                                    <td className="ai-codigo">{e.mensaje ?? e.codigo}</td>
                                                    <td>{e.usuario}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {pestana === 'faltantes' && (
                                    <table className="gen-data-table">
                                        <thead><tr><th>Talla</th><th>EAN</th><th>Serial</th><th className="ai-num">Cant.</th><th>Código de empaque</th></tr></thead>
                                        <tbody>
                                            {faltantes.length === 0 && (
                                                <tr><td colSpan={5} className="ai-sin-dato">
                                                    {caja.modoValidacion === 'PIEZA' ? 'No faltan piezas.' : 'Caja de empaque manual: no hay registro por pieza.'}
                                                </td></tr>
                                            )}
                                            {faltantes.map(f => (
                                                <tr key={f.id}>
                                                    <td>{f.talla ?? ''}</td><td>{f.ean}</td><td>{f.serial}</td>
                                                    <td className="ai-num">{f.cantidad}</td><td className="ai-codigo">{f.codigoEmpaque ?? ''}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {pestana === 'historial' && (
                                    <table className="gen-data-table">
                                        <thead><tr><th>Fecha</th><th>Acción</th><th>Resultado</th><th className="ai-num">Escaneado</th><th className="ai-num">Faltantes</th><th className="ai-num">Sobrantes</th><th>Motivo / observaciones</th><th>Usuario</th></tr></thead>
                                        <tbody>
                                            {historial.length === 0 && <tr><td colSpan={8} className="ai-sin-dato">Sin cierres, reaperturas ni reinicios.</td></tr>}
                                            {historial.map(h => {
                                                const r = etiquetaResultado('CERRADA', h.resultado)
                                                const a = ETIQUETA_HISTORIAL[h.accion] ?? { texto: h.accion, clase: 'proceso' }
                                                return (
                                                    <tr key={h.id}>
                                                        <td>{formatearFechaHora(h.fecha)}</td>
                                                        <td><span className={`ai-badge ai-badge--${a.clase}`}>{a.texto}</span></td>
                                                        <td>{h.resultado ? <span className={`ai-badge ai-badge--${r.clase}`}>{r.texto}</span> : ''}</td>
                                                        <td className="ai-num">{h.cantidadEscaneada} / {h.cantidadEsperada}</td>
                                                        <td className={`ai-num ${h.faltantes > 0 ? 'ai-num--alerta' : ''}`}>{h.faltantes}</td>
                                                        <td className={`ai-num ${h.sobrantes > 0 ? 'ai-num--alerta' : ''}`}>{h.sobrantes}</td>
                                                        <td>{h.comentario ?? ''}</td>
                                                        <td>{h.usuario}</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
