import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { PackageOpen, RefreshCw, Search } from 'lucide-react'
import { WMSContext } from '../../Context/WMSContext'
import { WMSMBApi } from '../../api/WMSMBApi'
import { LiberarCaja, LiberarDespacho, LiberarHistorial } from '../../interfaces/MB/MBInterface'
import { HeaderGenerico } from '../../Components'
import { IcoX, Spinner } from '../../Components/icons'
// @ts-ignore
import '../../Styles/TemplateGenericoScreen.css'
// @ts-ignore
import './MB.css'

type Vista = 'liberar' | 'historial'
type Aviso = { tipo: 'ok' | 'error'; texto: string } | null

const numero = (v: number) => v.toLocaleString('es-HN')

const TODAS = '__todas__'
const ELIMINADO = 'Eliminado'
const nombreUbicacion = (u: string | null | undefined) => (u && u.trim()) || 'Sin ubicación'
const prioridadEstado = (c: LiberarCaja) => c.packing ? 2 : c.picking ? 0 : 1

const formatearFechaHora = (valor: string) => {
    if (!valor) return ''
    const d = new Date(valor.replace(' ', 'T'))
    return isNaN(d.getTime()) ? valor : d.toLocaleString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const aISODate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const errorTexto = (err: any) =>
    err.response?.data?.mensaje || (typeof err.response?.data === 'string' && err.response.data ? err.response.data : '') ||
    (err.response
        ? `El servidor respondió ${err.response.status}${err.response.status === 404 ? ' (no encontró el servicio; ¿el API está actualizado?)' : ''}.`
        : 'Error al conectar con el servidor.')

const LiberarCajasMBScreen = () => {
    const { WMSState } = useContext(WMSContext)
    const usuario = WMSState?.usuario || ''

    const [permiso, setPermiso] = useState<boolean | null>(null)
    const [vista, setVista] = useState<Vista>('liberar')
    const [aviso, setAviso] = useState<Aviso>(null)

    // Liberar
    const [despachoTexto, setDespachoTexto] = useState('')
    const [despachoSel, setDespachoSel] = useState<number | null>(null)
    const [despachoInfo, setDespachoInfo] = useState<LiberarDespacho | null>(null)
    const [cajas, setCajas] = useState<LiberarCaja[]>([])
    const [cargandoCajas, setCargandoCajas] = useState(false)
    const [seleccion, setSeleccion] = useState<Set<number>>(new Set())
    const [busqueda, setBusqueda] = useState('')
    const [ubicacionFiltro, setUbicacionFiltro] = useState<string>(TODAS)
    const [pagina, setPagina] = useState(1)
    const [porPagina, setPorPagina] = useState(25)
    const [confirmando, setConfirmando] = useState(false)
    const [motivo, setMotivo] = useState('')
    const [liberando, setLiberando] = useState(false)
    const consultaCajas = useRef(0)

    // Historial
    const hoy = aISODate(new Date())
    const [fechaIni, setFechaIni] = useState(aISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
    const [fechaFin, setFechaFin] = useState(hoy)
    const [historial, setHistorial] = useState<LiberarHistorial[]>([])
    const [cargandoHistorial, setCargandoHistorial] = useState(false)

    useEffect(() => {
        if (!usuario) { setPermiso(false); return }
        WMSMBApi.getPermisoLiberar(usuario)
            .then(r => setPermiso(r.data.puedeLiberar))
            .catch(err => { console.log(err); setPermiso(false); setAviso({ tipo: 'error', texto: errorTexto(err) }) })
    }, [usuario])

    const limpiarDespacho = () => {
        setDespachoSel(null)
        setDespachoInfo(null)
        setCajas([])
        setSeleccion(new Set())
    }

    /* Busca el despacho por numero, enviado o no. */
    const cargarDespacho = async (despachoId: number, conservarAviso = false) => {
        const consulta = ++consultaCajas.current
        setCargandoCajas(true)
        if (!conservarAviso) setAviso(null)
        try {
            const [d, c] = await Promise.all([WMSMBApi.getDespacho(despachoId), WMSMBApi.getCajasDespacho(despachoId)])
            if (consulta !== consultaCajas.current) return
            const info = d.data[0] || null
            if (!info) {
                limpiarDespacho()
                if (!conservarAviso) setAviso({ tipo: 'error', texto: `El despacho ${despachoId} no existe o no tiene cajas.` })
            } else {
                setDespachoSel(despachoId)
                setDespachoInfo(info)
                setCajas(c.data)
                // Quita de la seleccion las cajas que ya no estan en el despacho
                setSeleccion(prev => new Set(Array.from(prev).filter(id => c.data.some(x => x.id === id))))
            }
        } catch (err: any) {
            if (consulta !== consultaCajas.current) return
            console.log(err)
            setAviso({ tipo: 'error', texto: errorTexto(err) })
        }
        setCargandoCajas(false)
    }

    const buscarDespacho = (e: React.FormEvent) => {
        e.preventDefault()
        const id = parseInt(despachoTexto.trim(), 10)
        if (!id || id < 1) { setAviso({ tipo: 'error', texto: 'Ingrese un número de despacho válido.' }); return }
        if (id !== despachoSel) {
            setSeleccion(new Set())
            setBusqueda('')
            setUbicacionFiltro(TODAS)
            setPagina(1)
        }
        cargarDespacho(id)
    }

    const cargarHistorial = async () => {
        setCargandoHistorial(true)
        try {
            const r = await WMSMBApi.getHistorial(fechaIni, fechaFin)
            setHistorial(r.data)
        } catch (err: any) {
            console.log(err)
            setAviso({ tipo: 'error', texto: errorTexto(err) })
        }
        setCargandoHistorial(false)
    }

    useEffect(() => { if (permiso && vista === 'historial') cargarHistorial() }, [permiso, vista]) // eslint-disable-line react-hooks/exhaustive-deps

    // Las cajas en ubicacion Eliminado no se ofrecen para liberar
    // Orden: con picking sin packing, luego sin picking ni packing, al final con packing; despues OP y caja
    const cajasLiberables = useMemo(() => cajas
        .filter(c => nombreUbicacion(c.ubicacionRecepcion) !== ELIMINADO)
        .sort((a, b) => prioridadEstado(a) - prioridadEstado(b)
            || a.orden.localeCompare(b.orden) || a.numeroCaja - b.numeroCaja), [cajas])
    const omitidasEliminado = cajas.length - cajasLiberables.length

    const resumen = useMemo(() => cajasLiberables.reduce((t, c) => ({
        cajas: t.cajas + c.cantidadCajas,
        unidades: t.unidades + c.cantidadTotal,
        picking: t.picking + (c.picking ? 1 : 0),
        packing: t.packing + (c.packing ? 1 : 0),
    }), { cajas: 0, unidades: 0, picking: 0, packing: 0 }), [cajasLiberables])

    // Ubicaciones presentes en el despacho, con conteo
    const ubicaciones = useMemo(() => {
        const conteo = new Map<string, number>()
        cajasLiberables.forEach(c => {
            const u = nombreUbicacion(c.ubicacionRecepcion)
            conteo.set(u, (conteo.get(u) || 0) + 1)
        })
        return Array.from(conteo.entries())
            .map(([nombre, total]) => ({ nombre, total }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { numeric: true }))
    }, [cajasLiberables])

    // Si la ubicacion filtrada ya no existe (p. ej. tras liberar), se vuelve a Todas
    useEffect(() => {
        if (ubicacionFiltro !== TODAS && !ubicaciones.some(u => u.nombre === ubicacionFiltro)) setUbicacionFiltro(TODAS)
    }, [ubicaciones, ubicacionFiltro])

    const cajasFiltradas = useMemo(() => {
        const texto = busqueda.trim().toLowerCase()
        return cajasLiberables.filter(c =>
            (ubicacionFiltro === TODAS || nombreUbicacion(c.ubicacionRecepcion) === ubicacionFiltro) &&
            (!texto || `${c.orden} ${c.numeroCaja} ${c.articulo} ${c.talla} ${c.color} ${c.nombreColor} ${c.pallet} ${c.cajasConsolidadas}`.toLowerCase().includes(texto)))
    }, [cajasLiberables, busqueda, ubicacionFiltro])

    // Paginacion
    const totalPaginas = Math.max(1, Math.ceil(cajasFiltradas.length / porPagina))
    useEffect(() => { setPagina(1) }, [busqueda, ubicacionFiltro, porPagina])
    useEffect(() => { if (pagina > totalPaginas) setPagina(totalPaginas) }, [pagina, totalPaginas])
    const desde = (pagina - 1) * porPagina
    const cajasPagina = cajasFiltradas.slice(desde, desde + porPagina)

    const seleccionadas = useMemo(() => cajasLiberables.filter(c => seleccion.has(c.id)), [cajasLiberables, seleccion])
    const totalSel = useMemo(() => seleccionadas.reduce(
        (t, c) => ({ cajas: t.cajas + c.cantidadCajas, unidades: t.unidades + c.cantidadTotal }), { cajas: 0, unidades: 0 }), [seleccionadas])

    const todasFiltradasMarcadas = cajasFiltradas.length > 0 && cajasFiltradas.every(c => seleccion.has(c.id))
    const paginaMarcada = cajasPagina.length > 0 && cajasPagina.every(c => seleccion.has(c.id))

    const alternar = (id: number) => {
        setSeleccion(prev => {
            const s = new Set(prev)
            if (s.has(id)) s.delete(id); else s.add(id)
            return s
        })
    }

    const marcar = (lista: LiberarCaja[], valor: boolean) => {
        setSeleccion(prev => {
            const s = new Set(prev)
            lista.forEach(c => { if (valor) s.add(c.id); else s.delete(c.id) })
            return s
        })
    }

    const liberar = async () => {
        if (despachoSel === null || seleccion.size === 0 || !motivo.trim()) return
        setLiberando(true)
        try {
            const r = await WMSMBApi.liberarCajas({ despachoID: despachoSel, ids: Array.from(seleccion), usuario, motivo: motivo.trim() })
            setConfirmando(false)
            if (r.data.ok) {
                setAviso({ tipo: 'ok', texto: `Despacho ${despachoSel}: ${r.data.mensaje}` })
                setMotivo('')
                setSeleccion(new Set())
            } else {
                setAviso({ tipo: 'error', texto: r.data.mensaje })
            }
            await cargarDespacho(despachoSel, true)
        } catch (err: any) {
            console.log(err)
            setAviso({ tipo: 'error', texto: errorTexto(err) })
        }
        setLiberando(false)
    }

    return (
        <div className="gen-page-root">
            <div className="gen-container">
                <HeaderGenerico
                    titulo="Liberar cajas de despacho MB"
                    subtitulo="Quita cajas de un despacho: vuelven a quedar disponibles sin picking, packing ni pallet."
                    icono={<PackageOpen size={20} />}
                    estado={cargandoCajas ? 'consultando' : liberando ? 'guardando' : undefined}
                />

                {aviso && (
                    <div className={`mb-alerta ${aviso.tipo === 'ok' ? 'mb-alerta--ok' : 'mb-alerta--error'}`} role="status">
                        <span>{aviso.texto}</span>
                        <button onClick={() => setAviso(null)} aria-label="Cerrar"><IcoX /></button>
                    </div>
                )}

                {permiso === null && <div className="mb-alerta mb-alerta--info"><span><Spinner size={14} /> Validando permiso…</span></div>}

                {permiso === false && (
                    <div className="mb-alerta mb-alerta--info">
                        <span>
                            {usuario
                                ? `El usuario ${usuario} no tiene permiso para liberar cajas de despacho MB. Solo administradores autorizados.`
                                : 'Inicie sesión para usar esta pantalla.'}
                        </span>
                    </div>
                )}

                {permiso && (
                    <>
                        <div className="mb-segmentado" role="tablist">
                            <button role="tab" aria-selected={vista === 'liberar'} className={vista === 'liberar' ? 'mb-segmentado--activo' : ''} onClick={() => setVista('liberar')}>Liberar cajas</button>
                            <button role="tab" aria-selected={vista === 'historial'} className={vista === 'historial' ? 'mb-segmentado--activo' : ''} onClick={() => setVista('historial')}>Historial</button>
                        </div>

                        {vista === 'liberar' && (
                            <>
                                <section className="mb-panel">
                                    <form className="mb-filtros" onSubmit={buscarDespacho}>
                                        <div className="gen-filtro-grupo">
                                            <label htmlFor="mb-despacho">Número de despacho</label>
                                            <input id="mb-despacho" type="number" inputMode="numeric" min={1} value={despachoTexto}
                                                onChange={e => setDespachoTexto(e.target.value)} placeholder="Ej. 73" autoFocus />
                                        </div>
                                        <button type="submit" className="gen-btn-submit" disabled={cargandoCajas || !despachoTexto.trim()}>
                                            {cargandoCajas ? <Spinner size={15} /> : <Search size={15} />}
                                            <span>Buscar</span>
                                        </button>
                                        {despachoSel !== null && (
                                            <button type="button" className="gen-btn-outline" onClick={() => cargarDespacho(despachoSel)} disabled={cargandoCajas}>
                                                <RefreshCw size={15} />
                                                <span>Actualizar</span>
                                            </button>
                                        )}
                                    </form>
                                    <p className="mb-seccion-desc">Se puede liberar cajas de cualquier despacho, enviado o no.</p>
                                </section>

                                {despachoSel !== null && despachoInfo && (
                                    <section className="mb-panel">
                                        <div className="mb-panel__header">
                                            <div>
                                                <h3>
                                                    Despacho {despachoSel}{' '}
                                                    {despachoInfo.enviado
                                                        ? <span className="mb-badge mb-badge--diferencia">Enviado · packing completo</span>
                                                        : <span className="mb-badge mb-badge--solomb">Abierto · packing pendiente</span>}
                                                </h3>
                                                <p className="mb-seccion-desc">
                                                    {despachoInfo.usuarioCreacion
                                                        ? `Creado por ${despachoInfo.usuarioCreacion} · ${formatearFechaHora(despachoInfo.fechaCreacion)}`
                                                        : 'Sin registro en la tabla de despachos.'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mb-kpis">
                                            <div className="mb-kpi"><span className="mb-kpi__label">Cajas</span><span className="mb-kpi__valor">{numero(cajasLiberables.length)}</span>
                                                {resumen.cajas !== cajasLiberables.length && <span className="mb-kpi__nota">{numero(resumen.cajas)} con consolidadas</span>}</div>
                                            <div className="mb-kpi"><span className="mb-kpi__label">Unidades</span><span className="mb-kpi__valor">{numero(resumen.unidades)}</span></div>
                                            <div className="mb-kpi"><span className="mb-kpi__label">Con picking</span><span className="mb-kpi__valor">{numero(resumen.picking)}</span></div>
                                            <div className="mb-kpi"><span className="mb-kpi__label">Con packing</span><span className="mb-kpi__valor">{numero(resumen.packing)}</span></div>
                                        </div>
                                        {omitidasEliminado > 0 && (
                                            <div className="mb-alerta mb-alerta--info">
                                                <span>Se omite{omitidasEliminado > 1 ? 'n' : ''} {numero(omitidasEliminado)} caja{omitidasEliminado > 1 ? 's' : ''} en ubicación Eliminado; no se pueden liberar desde aquí.</span>
                                            </div>
                                        )}
                                        <div className="mb-filtros">
                                            <div className="gen-filtro-grupo">
                                                <label htmlFor="mb-ubicacion">Ubicación</label>
                                                <select id="mb-ubicacion" value={ubicacionFiltro} onChange={e => setUbicacionFiltro(e.target.value)}>
                                                    <option value={TODAS}>Todas ({numero(cajasLiberables.length)})</option>
                                                    {ubicaciones.map(u => <option key={u.nombre} value={u.nombre}>{u.nombre} ({numero(u.total)})</option>)}
                                                </select>
                                            </div>
                                            <div className="gen-filtro-grupo">
                                                <label htmlFor="mb-buscar-caja">Buscar</label>
                                                <input id="mb-buscar-caja" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="OP, caja, artículo, pallet…" />
                                            </div>
                                            {cajasFiltradas.length > 0 && (
                                                <button type="button" className="gen-btn-outline" onClick={() => marcar(cajasFiltradas, !todasFiltradasMarcadas)}>
                                                    {todasFiltradasMarcadas ? `Desmarcar las ${numero(cajasFiltradas.length)} filtradas` : `Marcar las ${numero(cajasFiltradas.length)} filtradas`}
                                                </button>
                                            )}
                                        </div>
                                        <p className="mb-seccion-desc">Las cajas consolidadas se liberan completas, con todas sus cajas. Las marcadas se conservan al cambiar de filtro o de página.</p>
                                        <div className="mb-tabla-wrapper">
                                            <table className="gen-data-table mb-tabla">
                                                <thead>
                                                    <tr>
                                                        <th>
                                                            <input type="checkbox" aria-label="Marcar las cajas de esta página" title="Marcar esta página" checked={paginaMarcada}
                                                                onChange={() => marcar(cajasPagina, !paginaMarcada)} disabled={cajasPagina.length === 0} />
                                                        </th>
                                                        <th>OP</th>
                                                        <th className="mb-num">Caja</th>
                                                        <th>Artículo</th>
                                                        <th>Color</th>
                                                        <th>Talla</th>
                                                        <th className="mb-num">Unidades</th>
                                                        <th>Picking</th>
                                                        <th>Packing</th>
                                                        <th>Ubicación</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {cajasPagina.length === 0 && (
                                                        <tr><td colSpan={10} className="mb-vacio">{cargandoCajas ? 'Consultando…' : cajasLiberables.length === 0 ? 'No hay cajas para liberar en este despacho.' : 'Ninguna caja coincide con el filtro.'}</td></tr>
                                                    )}
                                                    {cajasPagina.map(c => (
                                                        <tr key={c.id} className={`mb-fila--click ${seleccion.has(c.id) ? 'mb-fila--sel' : ''}`} onClick={() => alternar(c.id)}>
                                                            <td onClick={e => e.stopPropagation()}>
                                                                <input type="checkbox" aria-label={`Caja ${c.numeroCaja} de ${c.orden}`} checked={seleccion.has(c.id)} onChange={() => alternar(c.id)} />
                                                            </td>
                                                            <td>{c.orden}<span className="mb-sub">Lote {c.lote}</span></td>
                                                            <td className="mb-num">
                                                                {c.numeroCaja}
                                                                {c.cantidadCajas > 1 && <span className="mb-sub" title={`Consolidadas: ${c.cajasConsolidadas}`}>+{c.cantidadCajas - 1} consolidada{c.cantidadCajas > 2 ? 's' : ''}</span>}
                                                            </td>
                                                            <td><span className="gen-td-id">{c.articulo}</span><span className="mb-sub">{c.descripcion}</span></td>
                                                            <td>{c.color}<span className="mb-sub">{c.nombreColor}</span></td>
                                                            <td>{c.talla}</td>
                                                            <td className="mb-num">{numero(c.cantidadTotal)}</td>
                                                            <td>
                                                                {c.picking
                                                                    ? <><span className="mb-badge mb-badge--diferencia">Sí</span><span className="mb-sub">{c.userPicking} · {formatearFechaHora(c.fechaPicking)}</span></>
                                                                    : <span className="mb-badge mb-badge--gris">No</span>}
                                                            </td>
                                                            <td>
                                                                {c.packing
                                                                    ? <><span className="mb-badge mb-badge--diferencia">Sí</span><span className="mb-sub">Pallet {c.pallet} · {c.userPacking}</span></>
                                                                    : <span className="mb-badge mb-badge--gris">No</span>}
                                                            </td>
                                                            <td>{nombreUbicacion(c.ubicacionRecepcion)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {cajasFiltradas.length > 0 && (
                                            <div className="mb-paginacion">
                                                <span className="mb-nota">
                                                    {numero(desde + 1)}–{numero(Math.min(desde + porPagina, cajasFiltradas.length))} de {numero(cajasFiltradas.length)} cajas
                                                </span>
                                                <div className="mb-paginacion__controles">
                                                    <label className="mb-nota" htmlFor="mb-por-pagina">Por página</label>
                                                    <select id="mb-por-pagina" value={porPagina} onChange={e => setPorPagina(Number(e.target.value))}>
                                                        {[25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                                                    </select>
                                                    <button type="button" className="gen-btn-outline" onClick={() => setPagina(1)} disabled={pagina === 1} aria-label="Primera página">«</button>
                                                    <button type="button" className="gen-btn-outline" onClick={() => setPagina(p => p - 1)} disabled={pagina === 1}>Anterior</button>
                                                    <span className="mb-nota">Página {pagina} de {totalPaginas}</span>
                                                    <button type="button" className="gen-btn-outline" onClick={() => setPagina(p => p + 1)} disabled={pagina === totalPaginas}>Siguiente</button>
                                                    <button type="button" className="gen-btn-outline" onClick={() => setPagina(totalPaginas)} disabled={pagina === totalPaginas} aria-label="Última página">»</button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mb-barra-seleccion">
                                            <span className="mb-nota">
                                                {seleccion.size === 0
                                                    ? 'Marque las cajas que desea liberar.'
                                                    : `${numero(seleccion.size)} seleccionada${seleccion.size > 1 ? 's' : ''} · ${numero(totalSel.cajas)} cajas físicas · ${numero(totalSel.unidades)} unidades`}
                                            </span>
                                            <button className="mb-btn-peligro" disabled={seleccion.size === 0 || liberando} onClick={() => setConfirmando(true)}>
                                                <PackageOpen size={15} />
                                                <span>Liberar cajas</span>
                                            </button>
                                        </div>
                                    </section>
                                )}
                            </>
                        )}

                        {vista === 'historial' && (
                            <section className="mb-panel">
                                <form className="mb-filtros" onSubmit={e => { e.preventDefault(); cargarHistorial() }}>
                                    <div className="gen-filtro-grupo">
                                        <label htmlFor="mb-hist-ini">Desde</label>
                                        <input id="mb-hist-ini" type="date" value={fechaIni} max={fechaFin} onChange={e => setFechaIni(e.target.value)} />
                                    </div>
                                    <div className="gen-filtro-grupo">
                                        <label htmlFor="mb-hist-fin">Hasta</label>
                                        <input id="mb-hist-fin" type="date" value={fechaFin} min={fechaIni} onChange={e => setFechaFin(e.target.value)} />
                                    </div>
                                    <button type="submit" className="gen-btn-submit" disabled={cargandoHistorial || !fechaIni || !fechaFin}>
                                        {cargandoHistorial ? <Spinner size={15} /> : <RefreshCw size={15} />}
                                        <span>Consultar</span>
                                    </button>
                                </form>
                                <div className="mb-tabla-wrapper">
                                    <table className="gen-data-table mb-tabla">
                                        <thead>
                                            <tr>
                                                <th>Fecha</th>
                                                <th>Usuario</th>
                                                <th className="mb-num">Despacho</th>
                                                <th>OP</th>
                                                <th className="mb-num">Caja</th>
                                                <th>Artículo</th>
                                                <th>Color</th>
                                                <th>Talla</th>
                                                <th className="mb-num">Unidades</th>
                                                <th>Tenía</th>
                                                <th>Motivo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {historial.length === 0 && (
                                                <tr><td colSpan={11} className="mb-vacio">{cargandoHistorial ? 'Consultando…' : 'No hay cajas liberadas en el rango.'}</td></tr>
                                            )}
                                            {historial.map(h => (
                                                <tr key={h.id}>
                                                    <td>{formatearFechaHora(h.fecha)}</td>
                                                    <td>{h.usuario}</td>
                                                    <td className="mb-num">{h.despachoID}</td>
                                                    <td>{h.orden}</td>
                                                    <td className="mb-num">
                                                        {h.numeroCaja}
                                                        {h.idConsolidado > 0 && <span className="mb-sub">consolidada</span>}
                                                    </td>
                                                    <td className="gen-td-id">{h.articulo}</td>
                                                    <td>{h.color}</td>
                                                    <td>{h.talla}</td>
                                                    <td className="mb-num">{numero(h.cantidad)}</td>
                                                    <td>{[h.picking && 'Picking', h.packing && `Packing${h.pallet ? ` (${h.pallet})` : ''}`].filter(Boolean).join(', ') || '—'}</td>
                                                    <td>{h.motivo}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}
                    </>
                )}

                {confirmando && despachoSel !== null && (
                    <div className="mb-modal-overlay" onClick={e => { if (e.target === e.currentTarget && !liberando) setConfirmando(false) }}>
                        <div className="mb-modal" role="dialog" aria-modal="true" aria-labelledby="mb-confirmar-titulo">
                            <h2 id="mb-confirmar-titulo">Liberar {numero(totalSel.cajas)} cajas del despacho {despachoSel}</h2>
                            <p>
                                Se quitarán del despacho {numero(totalSel.cajas)} cajas ({numero(totalSel.unidades)} unidades) y se borrarán
                                su picking, packing y pallet. Quedarán disponibles para otro despacho.
                                {seleccion.size === cajas.length && ' El despacho quedará sin cajas.'}
                            </p>
                            <ul>
                                {seleccionadas.map(c => (
                                    <li key={c.id}>
                                        {c.orden} · caja {c.numeroCaja}
                                        {c.cantidadCajas > 1 && ` + consolidadas ${c.cajasConsolidadas}`} · {numero(c.cantidadTotal)} uds
                                    </li>
                                ))}
                            </ul>
                            <div className="gen-filtro-grupo">
                                <label htmlFor="mb-motivo">Motivo (obligatorio)</label>
                                <textarea id="mb-motivo" value={motivo} maxLength={500} autoFocus onChange={e => setMotivo(e.target.value)} placeholder="Ej. cajas despachadas por error" />
                            </div>
                            <div className="mb-modal__botones">
                                <button className="gen-btn-outline" onClick={() => setConfirmando(false)} disabled={liberando}>Cancelar</button>
                                <button className="mb-btn-peligro" onClick={liberar} disabled={liberando || !motivo.trim()}>
                                    {liberando ? <Spinner size={15} /> : <PackageOpen size={15} />}
                                    <span>{liberando ? 'Liberando…' : 'Liberar cajas'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default LiberarCajasMBScreen
