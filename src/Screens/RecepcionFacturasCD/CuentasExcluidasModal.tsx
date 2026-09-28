import React, { useMemo, useState } from 'react'
import { Trash2, UserX } from 'lucide-react'
import { RecepcionFacturasCDApi } from '../../api/RecepcionFacturasCDApi'
import { CuentaExcluidaRecepcionCD, RespuestaSP } from '../../interfaces/RecepcionFacturasCD/RecepcionFacturasCDInterface'
import { IcoPlus, IcoX, Spinner } from '../../Components/icons'

export interface SugerenciaCuenta {
    cuenta: string
    nombre: string
    facturas: number
}

interface Props {
    cuentas: CuentaExcluidaRecepcionCD[]
    usuario: string
    // Cuentas presentes en la consulta actual, para seleccionarlas en lote
    sugerencias: SugerenciaCuenta[]
    onCambio: (cuentas: CuentaExcluidaRecepcionCD[], huboEliminacion: boolean) => void
    onCerrar: () => void
}

interface Mensaje {
    tipo: 'error' | 'success'
    texto: string
    detalle?: string[]
}

const formatearFecha = (valor: string) => {
    const d = new Date(valor)
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Cuentas escritas a mano: separadas por coma, punto y coma, espacio o salto de línea
const parsearCuentas = (texto: string) =>
    texto.split(/[\s,;]+/).map(c => c.trim().toUpperCase()).filter(c => c !== '')

const IconoBuscar = () => (
    <svg className="gen-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
)

export function CuentasExcluidasModal({ cuentas, usuario, sugerencias, onCambio, onCerrar }: Props) {
    // ── Alta múltiple ────────────────────────────────────────────────────────
    const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set())
    const [busquedaDisponibles, setBusquedaDisponibles] = useState('')
    const [otrasCuentas, setOtrasCuentas] = useState('')
    const [motivo, setMotivo] = useState('')
    const [guardando, setGuardando] = useState(false)

    // ── Lista de excluidas ───────────────────────────────────────────────────
    const [busqueda, setBusqueda] = useState('')
    const [idEliminando, setIdEliminando] = useState<number | null>(null)
    const [mensaje, setMensaje] = useState<Mensaje | null>(null)

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onCerrar()
    }

    const refrescar = async (huboEliminacion: boolean) => {
        const resp = await RecepcionFacturasCDApi.getCuentasExcluidas()
        onCambio(resp.data, huboEliminacion)
    }

    const cuentasYaExcluidas = useMemo(
        () => new Set(cuentas.map(c => c.cuentaCliente.toUpperCase())),
        [cuentas]
    )

    // Cuentas de la consulta que todavía no están excluidas
    const disponibles = useMemo(
        () => sugerencias.filter(s => !cuentasYaExcluidas.has(s.cuenta.toUpperCase())),
        [sugerencias, cuentasYaExcluidas]
    )

    const disponiblesFiltradas = useMemo(() => {
        const q = busquedaDisponibles.trim().toLowerCase()
        if (!q) return disponibles
        return disponibles.filter(s => `${s.cuenta} ${s.nombre}`.toLowerCase().includes(q))
    }, [disponibles, busquedaDisponibles])

    const todasVisiblesMarcadas = disponiblesFiltradas.length > 0 && disponiblesFiltradas.every(s => seleccionadas.has(s.cuenta))
    const algunaVisibleMarcada = disponiblesFiltradas.some(s => seleccionadas.has(s.cuenta))

    const toggleCuenta = (cuenta: string) => {
        setSeleccionadas(prev => {
            const nuevo = new Set(prev)
            if (nuevo.has(cuenta)) nuevo.delete(cuenta)
            else nuevo.add(cuenta)
            return nuevo
        })
    }

    const toggleTodasVisibles = () => {
        setSeleccionadas(prev => {
            const nuevo = new Set(prev)
            disponiblesFiltradas.forEach(s => todasVisiblesMarcadas ? nuevo.delete(s.cuenta) : nuevo.add(s.cuenta))
            return nuevo
        })
    }

    // Seleccionadas de la lista + escritas a mano, sin repetir ni incluir las ya excluidas
    const cuentasAExcluir = useMemo(() => {
        const todas = new Set<string>()
        seleccionadas.forEach(c => todas.add(c.toUpperCase()))
        parsearCuentas(otrasCuentas).forEach(c => todas.add(c))
        return Array.from(todas).filter(c => !cuentasYaExcluidas.has(c))
    }, [seleccionadas, otrasCuentas, cuentasYaExcluidas])

    const cuentasFiltradas = useMemo(() => {
        const q = busqueda.trim().toLowerCase()
        if (!q) return cuentas
        return cuentas.filter(c =>
            [c.cuentaCliente, c.nombreCliente, c.motivo, c.usuarioCreacion]
                .some(v => String(v ?? '').toLowerCase().includes(q))
        )
    }, [cuentas, busqueda])

    const handleExcluir = async (e: React.FormEvent) => {
        e.preventDefault()
        setMensaje(null)
        if (cuentasAExcluir.length === 0) {
            setMensaje({ tipo: 'error', texto: 'Seleccione o escriba al menos una cuenta que no esté excluida.' })
            return
        }
        setGuardando(true)
        try {
            const resp = await RecepcionFacturasCDApi.insertCuentasExcluidas({ cuentas: cuentasAExcluir, motivo: motivo.trim(), usuario })
            const resultados = resp.data
            const exitosas = resultados.filter(r => r.exito).map(r => r.cuentaCliente.toUpperCase())
            const fallidas = resultados.filter(r => !r.exito)

            if (exitosas.length > 0) await refrescar(false)

            // Se limpian las exitosas; las fallidas quedan para corregirlas
            setSeleccionadas(prev => new Set(Array.from(prev).filter(c => !exitosas.includes(c.toUpperCase()))))
            setOtrasCuentas(parsearCuentas(otrasCuentas).filter(c => !exitosas.includes(c)).join(', '))
            if (fallidas.length === 0) setMotivo('')

            if (fallidas.length === 0) {
                setMensaje({ tipo: 'success', texto: `${exitosas.length} cuenta(s) excluida(s) correctamente.` })
            } else {
                setMensaje({
                    tipo: 'error',
                    texto: `${exitosas.length} cuenta(s) excluida(s). ${fallidas.length} no se pudieron excluir:`,
                    detalle: fallidas.map(f => f.mensaje),
                })
            }
        } catch (err: any) {
            setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'Error al guardar las exclusiones.' })
        } finally {
            setGuardando(false)
        }
    }

    const handleEliminar = async (item: CuentaExcluidaRecepcionCD) => {
        const confirmado = window.confirm(`¿Quitar la cuenta "${item.cuentaCliente}" de las exclusiones? Sus facturas volverán a aparecer en el reporte.`)
        if (!confirmado) return
        setMensaje(null)
        setIdEliminando(item.id)
        try {
            const resp = await RecepcionFacturasCDApi.deleteCuentaExcluida(item.id, usuario)
            const r: RespuestaSP = resp.data
            if (!r.exito) {
                setMensaje({ tipo: 'error', texto: r.mensaje })
                return
            }
            await refrescar(true)
            setMensaje({ tipo: 'success', texto: r.mensaje })
        } catch (err: any) {
            setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'Error al quitar la exclusión.' })
        } finally {
            setIdEliminando(null)
        }
    }

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-panel rfc-modal-panel" role="dialog" aria-modal="true" aria-labelledby="rfc-excluidas-titulo">
                <div className="modal-header">
                    <div>
                        <h2 className="modal-titulo" id="rfc-excluidas-titulo">Cuentas excluidas</h2>
                        <p className="modal-subtitulo">Las facturas de estas cuentas de cliente no se muestran en la recepción de facturas en CD.</p>
                    </div>
                    <button className="modal-close" onClick={onCerrar} aria-label="Cerrar"><IcoX /></button>
                </div>

                <div className="rfc-modal-body">
                    {mensaje && (
                        <div className={`alert-box alert-${mensaje.tipo} fade-in`} style={{ marginBottom: 0 }}>
                            <div>
                                <span>{mensaje.texto}</span>
                                {mensaje.detalle && (
                                    <ul className="rfc-alert-detalle">
                                        {mensaje.detalle.map((d, i) => <li key={i}>{d}</li>)}
                                    </ul>
                                )}
                            </div>
                            <button className="alert-close" onClick={() => setMensaje(null)}><IcoX /></button>
                        </div>
                    )}

                    {/* ── Alta múltiple ───────────────────────────────────── */}
                    <form className="rfc-seccion" onSubmit={handleExcluir} noValidate>
                        <div className="rfc-seccion-header">
                            <h3 className="rfc-seccion-titulo">Agregar exclusiones</h3>
                            <span className="rfc-lista-total">{seleccionadas.size} seleccionada(s) de la consulta</span>
                        </div>

                        <div className="gen-search-input-group">
                            <IconoBuscar />
                            <input
                                type="text"
                                className="gen-input-busqueda-global"
                                placeholder="Buscar cliente de la consulta por cuenta o nombre…"
                                value={busquedaDisponibles}
                                onChange={e => setBusquedaDisponibles(e.target.value)}
                            />
                            {busquedaDisponibles && (
                                <button type="button" className="gen-btn-limpiar-busqueda" onClick={() => setBusquedaDisponibles('')}><IcoX /></button>
                            )}
                        </div>

                        <div className="rfc-lista-wrapper rfc-lista-wrapper--seleccion">
                            <table className="gen-data-table">
                                <thead>
                                    <tr>
                                        <th className="rfc-col-check">
                                            <input
                                                type="checkbox"
                                                aria-label="Seleccionar todas las visibles"
                                                checked={todasVisiblesMarcadas}
                                                ref={el => { if (el) el.indeterminate = algunaVisibleMarcada && !todasVisiblesMarcadas }}
                                                onChange={toggleTodasVisibles}
                                                disabled={disponiblesFiltradas.length === 0}
                                            />
                                        </th>
                                        <th>Cuenta</th>
                                        <th>Cliente</th>
                                        <th className="gen-col-num">Facturas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {disponiblesFiltradas.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="gen-empty-row rfc-empty-compacto">
                                                {sugerencias.length === 0
                                                    ? 'Consulte un rango de fechas para elegir clientes de la lista, o escriba las cuentas abajo.'
                                                    : disponibles.length === 0
                                                        ? 'Todos los clientes de la consulta ya están excluidos.'
                                                        : 'Ningún cliente coincide con la búsqueda.'}
                                            </td>
                                        </tr>
                                    ) : disponiblesFiltradas.map(s => {
                                        const marcada = seleccionadas.has(s.cuenta)
                                        return (
                                            <tr
                                                key={s.cuenta}
                                                className={`rfc-fila-seleccionable${marcada ? ' rfc-fila--marcada' : ''}`}
                                                onClick={e => { if ((e.target as HTMLElement).tagName !== 'INPUT') toggleCuenta(s.cuenta) }}
                                            >
                                                <td className="rfc-col-check">
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`Seleccionar ${s.cuenta}`}
                                                        checked={marcada}
                                                        onChange={() => toggleCuenta(s.cuenta)}
                                                    />
                                                </td>
                                                <td className="gen-td-id">{s.cuenta}</td>
                                                <td>{s.nombre || <span className="rfc-sin-dato">—</span>}</td>
                                                <td className="gen-col-num">{s.facturas}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="rfc-alta-campos">
                            <div className="modal-campo">
                                <label className="modal-label">Otras cuentas</label>
                                <input
                                    className="modal-input"
                                    placeholder="Ej.: C000123, C000456 C000789"
                                    value={otrasCuentas}
                                    onChange={e => setOtrasCuentas(e.target.value)}
                                />
                            </div>
                            <div className="modal-campo">
                                <label className="modal-label">Motivo (aplica a todas)</label>
                                <input
                                    className="modal-input"
                                    placeholder="Opcional"
                                    maxLength={250}
                                    value={motivo}
                                    onChange={e => setMotivo(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="gen-btn-submit" disabled={guardando || cuentasAExcluir.length === 0}>
                                {guardando ? <Spinner size={15} /> : <IcoPlus />}
                                <span>Excluir ({cuentasAExcluir.length})</span>
                            </button>
                        </div>
                    </form>

                    {/* ── Excluidas actualmente ───────────────────────────── */}
                    <div className="rfc-seccion">
                        <div className="rfc-seccion-header">
                            <h3 className="rfc-seccion-titulo">Excluidas actualmente</h3>
                            <span className="rfc-lista-total">{cuentas.length} cuenta(s)</span>
                        </div>

                        <div className="gen-search-input-group">
                            <IconoBuscar />
                            <input
                                type="text"
                                className="gen-input-busqueda-global"
                                placeholder="Buscar cuenta, nombre o motivo…"
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                            />
                            {busqueda && (
                                <button className="gen-btn-limpiar-busqueda" onClick={() => setBusqueda('')}><IcoX /></button>
                            )}
                        </div>

                        <div className="rfc-lista-wrapper">
                            <table className="gen-data-table">
                                <thead>
                                    <tr>
                                        <th>Cuenta</th>
                                        <th>Cliente</th>
                                        <th>Motivo</th>
                                        <th>Usuario</th>
                                        <th>Fecha</th>
                                        <th className="gen-col-acciones"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cuentasFiltradas.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="gen-empty-row rfc-empty-compacto">
                                                <UserX size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                                                {cuentas.length === 0 ? 'No hay cuentas excluidas.' : 'Ninguna cuenta coincide con la búsqueda.'}
                                            </td>
                                        </tr>
                                    ) : cuentasFiltradas.map(item => (
                                        <tr key={item.id}>
                                            <td className="gen-td-id">{item.cuentaCliente}</td>
                                            <td>{item.nombreCliente || <span className="rfc-sin-dato">—</span>}</td>
                                            <td className="rfc-td-motivo">{item.motivo || <span className="rfc-sin-dato">—</span>}</td>
                                            <td>{item.usuarioCreacion || <span className="rfc-sin-dato">—</span>}</td>
                                            <td>{formatearFecha(item.fechaCreacion)}</td>
                                            <td className="gen-col-acciones">
                                                <button
                                                    className="rfc-btn-excluir-fila"
                                                    title="Quitar de exclusiones"
                                                    onClick={() => handleEliminar(item)}
                                                    disabled={idEliminando !== null}
                                                >
                                                    {idEliminando === item.id ? <Spinner size={14} /> : <Trash2 size={15} />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn-cancelar" onClick={onCerrar}>Cerrar</button>
                </div>
            </div>
        </div>
    )
}
