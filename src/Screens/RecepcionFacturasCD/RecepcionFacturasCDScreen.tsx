import React, { useContext, useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Ban, PackageCheck, UserX } from 'lucide-react'
import { RecepcionFacturasCDApi } from '../../api/RecepcionFacturasCDApi'
import { CuentaExcluidaRecepcionCD, FacturaRecepcionCD, RespuestaSP } from '../../interfaces/RecepcionFacturasCD/RecepcionFacturasCDInterface'
import { HeaderGenerico, FiltrosGenericos, FiltroCampoTexto, TablaGenerica, ColumnConfig } from '../../Components'
import { IcoDownload, IcoX, Spinner } from '../../Components/icons'
import { WMSContext } from '../../Context/WMSContext'
import { CuentasExcluidasModal, SugerenciaCuenta } from './CuentasExcluidasModal'
// @ts-ignore
import '../../Styles/TemplateGenericoScreen.css'
// @ts-ignore
import './RecepcionFacturasCD.css'

const FILAS_POR_PAGINA = 15
// Días sin recibir a partir de los cuales se resalta la fila
const DIAS_ALERTA = 2

type FiltroEstado = 'TODAS' | 'NO' | 'SI'

const CAMPOS_TEXTO_FILTRO: FiltroCampoTexto[] = [
    { key: 'pv', label: 'Pedido Venta', placeholder: 'Filtrar PV...' },
    { key: 'ruta', label: 'Ruta', placeholder: 'Filtrar ruta...' },
    { key: 'cuenta', label: 'Cuenta', placeholder: 'Filtrar cuenta...' },
    { key: 'nombreCliente', label: 'Cliente', placeholder: 'Filtrar cliente...' },
    { key: 'factura', label: 'Factura', placeholder: 'Filtrar factura...' },
    { key: 'ubicacion', label: 'Ubicación', placeholder: 'Filtrar ubicación...' },
]

// ── Utilidades de fecha ──────────────────────────────────────────────────────
const aISODate = (d: Date) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${mm}-${dd}`
}

const primerDiaMes = () => {
    const hoy = new Date()
    return aISODate(new Date(hoy.getFullYear(), hoy.getMonth(), 1))
}

const formatearFechaHora = (valor: string | null) => {
    if (!valor) return ''
    const d = new Date(valor)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}

// Días entre la factura y su recepción en CD (o hasta hoy si no se ha recibido)
const calcularDias = (item: FacturaRecepcionCD) => {
    const inicio = new Date(item.fechaGeneracionFactura)
    const fin = item.fechaRecibidaEnCD ? new Date(item.fechaRecibidaEnCD) : new Date()
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) return null
    return Math.max(0, Math.floor((fin.getTime() - inicio.getTime()) / 86400000))
}

const RecepcionFacturasCDScreen = () => {
    const { WMSState } = useContext(WMSContext)
    const usuario = WMSState?.usuario || ''

    const [fechaIni, setFechaIni] = useState(primerDiaMes())
    const [fechaFin, setFechaFin] = useState(aISODate(new Date()))
    const [facturas, setFacturas] = useState<FacturaRecepcionCD[]>([])
    const [consultado, setConsultado] = useState(false)
    const [cargando, setCargando] = useState(false)
    const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'success'; texto: string } | null>(null)
    const [paginaActual, setPaginaActual] = useState(1)

    // ── Filtros en pantalla ──────────────────────────────────────────────────
    const [busquedaGlobal, setBusquedaGlobal] = useState('')
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('TODAS')
    const [valoresTexto, setValoresTexto] = useState<Record<string, string>>({})

    // ── Cuentas excluidas ────────────────────────────────────────────────────
    const [cuentasExcluidas, setCuentasExcluidas] = useState<CuentaExcluidaRecepcionCD[]>([])
    const [mostrarExcluidas, setMostrarExcluidas] = useState(false)
    const [requiereReconsulta, setRequiereReconsulta] = useState(false)
    const [cuentaExcluyendo, setCuentaExcluyendo] = useState<string | null>(null)

    const getCuentasExcluidas = async () => {
        try {
            const resp = await RecepcionFacturasCDApi.getCuentasExcluidas()
            setCuentasExcluidas(resp.data)
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => { getCuentasExcluidas() }, [])

    const getData = async () => {
        if (!fechaIni || !fechaFin) {
            setMensaje({ tipo: 'error', texto: 'Seleccione la fecha inicial y la fecha final.' })
            return
        }
        if (fechaIni > fechaFin) {
            setMensaje({ tipo: 'error', texto: 'La fecha inicial no puede ser mayor que la fecha final.' })
            return
        }
        setCargando(true)
        setMensaje(null)
        try {
            const resp = await RecepcionFacturasCDApi.getFacturasRecepcionCD(fechaIni, fechaFin)
            setFacturas(resp.data)
            setConsultado(true)
            setPaginaActual(1)
            setRequiereReconsulta(false)
        } catch (err: any) {
            console.log(err)
            setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'Error al conectar con el servidor.' })
        }
        setCargando(false)
    }

    // ── Filtrado ─────────────────────────────────────────────────────────────
    const hayFiltrosActivos = useMemo(
        () => Object.values(valoresTexto).some(v => (v || '').trim() !== ''),
        [valoresTexto]
    )

    const handleTextoChange = (key: string, valor: string) => {
        setValoresTexto(prev => ({ ...prev, [key]: valor }))
        setPaginaActual(1)
    }

    const handleLimpiarFiltros = () => {
        setValoresTexto({})
        setPaginaActual(1)
    }

    // Filtros de texto + búsqueda global (sin el filtro de estado, para los conteos)
    const datosBase = useMemo(() => {
        const q = busquedaGlobal.trim().toLowerCase()
        return facturas.filter(f => {
            for (const campo of CAMPOS_TEXTO_FILTRO) {
                const val = valoresTexto[campo.key]
                if (val && val.trim() !== '') {
                    const itemValor = String((f as any)[campo.key] ?? '').toLowerCase()
                    if (!itemValor.includes(val.toLowerCase().trim())) return false
                }
            }
            if (q) {
                const texto = [f.pv, f.ruta, f.cuenta, f.nombreCliente, f.factura, f.ubicacion].join(' ').toLowerCase()
                if (!texto.includes(q)) return false
            }
            return true
        })
    }, [facturas, valoresTexto, busquedaGlobal])

    const datosFiltrados = useMemo(
        () => filtroEstado === 'TODAS' ? datosBase : datosBase.filter(f => f.recibido === filtroEstado),
        [datosBase, filtroEstado]
    )

    const resumen = useMemo(() => {
        const recibidas = datosBase.filter(f => f.recibido === 'SI').length
        const total = datosBase.length
        return {
            total,
            recibidas,
            pendientes: total - recibidas,
            porcentaje: total > 0 ? Math.round((recibidas / total) * 100) : 0,
        }
    }, [datosBase])

    const totalPaginas = Math.max(1, Math.ceil(datosFiltrados.length / FILAS_POR_PAGINA))
    const datosPagina = useMemo(() => {
        const inicio = (paginaActual - 1) * FILAS_POR_PAGINA
        return datosFiltrados.slice(inicio, inicio + FILAS_POR_PAGINA)
    }, [datosFiltrados, paginaActual])

    // Clientes de la consulta actual (con su número de facturas) para seleccionarlos en el popup
    const sugerenciasCuentas = useMemo<SugerenciaCuenta[]>(() => {
        const mapa = new Map<string, SugerenciaCuenta>()
        facturas.forEach(f => {
            if (!f.cuenta) return
            const actual = mapa.get(f.cuenta)
            if (actual) actual.facturas++
            else mapa.set(f.cuenta, { cuenta: f.cuenta, nombre: f.nombreCliente || '', facturas: 1 })
        })
        return Array.from(mapa.values()).sort((a, b) => b.facturas - a.facturas || a.cuenta.localeCompare(b.cuenta))
    }, [facturas])

    // ── Exclusiones ──────────────────────────────────────────────────────────
    // Quita de la consulta actual las facturas de cuentas excluidas (el SP ya no las traerá)
    const aplicarExclusionesLocales = (lista: CuentaExcluidaRecepcionCD[]) => {
        const excluidas = new Set(lista.map(c => c.cuentaCliente.toUpperCase()))
        setFacturas(prev => prev.filter(f => !excluidas.has((f.cuenta || '').toUpperCase())))
    }

    const handleCambioExcluidas = (lista: CuentaExcluidaRecepcionCD[], huboEliminacion: boolean) => {
        setCuentasExcluidas(lista)
        aplicarExclusionesLocales(lista)
        if (huboEliminacion && consultado) setRequiereReconsulta(true)
    }

    const handleExcluirDesdeFila = async (item: FacturaRecepcionCD) => {
        if (!item.cuenta) return
        const confirmado = window.confirm(`¿Excluir la cuenta "${item.cuenta}" (${item.nombreCliente || 'sin nombre'}) del reporte?`)
        if (!confirmado) return
        setCuentaExcluyendo(item.cuenta)
        setMensaje(null)
        try {
            const resp = await RecepcionFacturasCDApi.insertCuentaExcluida({ cuentaCliente: item.cuenta, motivo: '', usuario })
            const r: RespuestaSP = resp.data
            if (!r.exito) {
                setMensaje({ tipo: 'error', texto: r.mensaje })
            } else {
                const lista = await RecepcionFacturasCDApi.getCuentasExcluidas()
                setCuentasExcluidas(lista.data)
                aplicarExclusionesLocales(lista.data)
                setMensaje({ tipo: 'success', texto: r.mensaje })
            }
        } catch (err: any) {
            setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'Error al excluir la cuenta.' })
        }
        setCuentaExcluyendo(null)
    }

    // ── Exportar ─────────────────────────────────────────────────────────────
    const handleExportar = () => {
        const filas = datosFiltrados.map(f => ({
            'Pedido Venta': f.pv,
            'Ruta': f.ruta ?? '',
            'Cliente': f.nombreCliente ?? '',
            'Cuenta': f.cuenta ?? '',
            'Factura': f.factura,
            'Fecha Factura': formatearFechaHora(f.fechaGeneracionFactura),
            'Recibida en CD': formatearFechaHora(f.fechaRecibidaEnCD),
            'Días': calcularDias(f) ?? '',
            'Ubicación': f.ubicacion ?? '',
            'Recibido': f.recibido,
        }))
        const ws = XLSX.utils.json_to_sheet(filas)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Recepcion CD')
        XLSX.writeFile(wb, `RecepcionFacturasCD_${fechaIni.replace(/-/g, '')}_${fechaFin.replace(/-/g, '')}.xlsx`)
    }

    const columns: ColumnConfig<FacturaRecepcionCD>[] = [
        { header: 'Pedido Venta', accessor: 'pv', isId: true },
        { header: 'Ruta', render: (f) => f.ruta || <span className="rfc-sin-dato">—</span> },
        { header: 'Cliente', render: (f) => f.nombreCliente || <span className="rfc-sin-dato">—</span> },
        { header: 'Cuenta', render: (f) => f.cuenta || <span className="rfc-sin-dato">—</span> },
        { header: 'Factura', accessor: 'factura' },
        { header: 'Fecha Factura', render: (f) => formatearFechaHora(f.fechaGeneracionFactura) },
        { header: 'Recibida en CD', render: (f) => formatearFechaHora(f.fechaRecibidaEnCD) || <span className="rfc-sin-dato">—</span> },
        {
            header: 'Días', align: 'right', render: (f) => {
                const dias = calcularDias(f)
                if (dias === null) return ''
                const alerta = f.recibido === 'NO' && dias >= DIAS_ALERTA
                return <span className={alerta ? 'rfc-dias--alerta' : ''} title={f.recibido === 'NO' ? 'Días sin recibir' : 'Días hasta la recepción'}>{dias}</span>
            }
        },
        {
            header: 'Ubicación', render: (f) => f.ubicacion
                ? <span className="rfc-badge rfc-badge--rack">{f.ubicacion}</span>
                : <span className="rfc-sin-dato">Vacía</span>
        },
        {
            header: 'Recibido', align: 'center', render: (f) =>
                <span className={`rfc-badge rfc-badge--${f.recibido === 'SI' ? 'si' : 'no'}`}>{f.recibido === 'SI' ? 'Sí' : 'No'}</span>
        },
        {
            header: '', align: 'center', render: (f) => f.cuenta ? (
                <button
                    className="rfc-btn-excluir-fila"
                    title={`Excluir cuenta ${f.cuenta}`}
                    onClick={() => handleExcluirDesdeFila(f)}
                    disabled={cuentaExcluyendo !== null}
                >
                    {cuentaExcluyendo === f.cuenta ? <Spinner size={14} /> : <Ban size={15} />}
                </button>
            ) : null
        },
    ]

    const estadoHeader = cargando ? 'consultando' : facturas.length > 0 ? 'datos' : 'vacio'

    return (
        <div className="gen-page-root">
            <div className="gen-container">
                <HeaderGenerico
                    titulo="Despacho de Facturas en CD"
                    subtitulo="Facturas con pedido de venta y su recepción en el Centro de Distribución (ubicación vacía o Rack)."
                    icono={<PackageCheck size={20} />}
                    estado={estadoHeader}
                />

                {mensaje && (
                    <div className={`alert-box alert-${mensaje.tipo} fade-in`}>
                        <span>{mensaje.texto}</span>
                        <button className="alert-close" onClick={() => setMensaje(null)}><IcoX /></button>
                    </div>
                )}

                {requiereReconsulta && (
                    <div className="alert-box alert-success fade-in">
                        <span>Se quitaron cuentas de las exclusiones. Vuelva a consultar para ver sus facturas.</span>
                        <button className="alert-close" onClick={() => setRequiereReconsulta(false)}><IcoX /></button>
                    </div>
                )}

                {/* Consulta por rango de fechas + acciones */}
                <section className="gen-upload-card-header">
                    <div className="rfc-consulta-bar">
                        <div className="gen-filtro-grupo">
                            <label htmlFor="rfc-fecha-ini">Fecha inicial</label>
                            <input id="rfc-fecha-ini" type="date" value={fechaIni} max={fechaFin} onChange={e => setFechaIni(e.target.value)} />
                        </div>
                        <div className="gen-filtro-grupo">
                            <label htmlFor="rfc-fecha-fin">Fecha final</label>
                            <input id="rfc-fecha-fin" type="date" value={fechaFin} min={fechaIni} onChange={e => setFechaFin(e.target.value)} />
                        </div>
                        <button className="gen-btn-submit" onClick={getData} disabled={cargando}>
                            {cargando ? <Spinner size={15} /> : <PackageCheck size={15} />}
                            <span>{cargando ? 'Consultando…' : 'Consultar'}</span>
                        </button>

                        <div className="gen-search-input-group">
                            <svg className="gen-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                className="gen-input-busqueda-global"
                                placeholder="Buscar PV, factura, cliente, ruta…"
                                value={busquedaGlobal}
                                onChange={e => { setBusquedaGlobal(e.target.value); setPaginaActual(1) }}
                            />
                            {busquedaGlobal && (
                                <button className="gen-btn-limpiar-busqueda" onClick={() => setBusquedaGlobal('')}><IcoX /></button>
                            )}
                        </div>

                        <button className="gen-btn-outline gen-action-spacer" onClick={() => setMostrarExcluidas(true)}>
                            <UserX size={15} />
                            <span>Cuentas excluidas</span>
                            <span className="rfc-btn-excluidas-count">{cuentasExcluidas.length}</span>
                        </button>
                        <button className="gen-btn-outline" onClick={handleExportar} disabled={datosFiltrados.length === 0}>
                            <IcoDownload />
                            <span>Exportar</span>
                        </button>
                    </div>
                </section>

                {/* Resumen */}
                {consultado && (
                    <div className="rfc-resumen-grid">
                        <div className="rfc-kpi">
                            <span className="rfc-kpi__label">Total facturas</span>
                            <span className="rfc-kpi__valor">{resumen.total}</span>
                        </div>
                        <div className="rfc-kpi rfc-kpi--si">
                            <span className="rfc-kpi__label">Recibidas en CD</span>
                            <span className="rfc-kpi__valor">{resumen.recibidas}</span>
                        </div>
                        <div className="rfc-kpi rfc-kpi--no">
                            <span className="rfc-kpi__label">No recibidas</span>
                            <span className="rfc-kpi__valor">{resumen.pendientes}</span>
                        </div>
                        <div className="rfc-kpi rfc-kpi--pct">
                            <span className="rfc-kpi__label">% Recibido</span>
                            <span className="rfc-kpi__valor">{resumen.porcentaje}%</span>
                            <div className="rfc-kpi__barra">
                                <div className="rfc-kpi__barra-fill" style={{ width: `${resumen.porcentaje}%` }} />
                            </div>
                        </div>
                    </div>
                )}

                <div className="rfc-segmentado" role="tablist" aria-label="Estado de recepción">
                    {([
                        ['TODAS', `Todas (${resumen.total})`],
                        ['NO', `No recibidas (${resumen.pendientes})`],
                        ['SI', `Recibidas (${resumen.recibidas})`],
                    ] as [FiltroEstado, string][]).map(([valor, etiqueta]) => (
                        <button
                            key={valor}
                            role="tab"
                            aria-selected={filtroEstado === valor}
                            className={filtroEstado === valor ? 'rfc-segmentado--activo' : ''}
                            onClick={() => { setFiltroEstado(valor); setPaginaActual(1) }}
                        >
                            {etiqueta}
                        </button>
                    ))}
                </div>

                <FiltrosGenericos
                    camposTexto={CAMPOS_TEXTO_FILTRO}
                    valoresTexto={valoresTexto}
                    valoresNum={{}}
                    onTextoChange={handleTextoChange}
                    onNumChange={() => {}}
                    onLimpiar={handleLimpiarFiltros}
                    hayFiltrosActivos={hayFiltrosActivos}
                />

                <TablaGenerica
                    columns={columns}
                    data={datosPagina}
                    keyExtractor={(f) => `${f.factura}-${f.pv}`}
                    paginaActual={paginaActual}
                    totalPaginas={totalPaginas}
                    totalRegistros={datosFiltrados.length}
                    onPaginaChange={setPaginaActual}
                    emptyMessage={
                        cargando ? 'Consultando información...'
                            : consultado ? 'No se encontraron facturas para los filtros indicados.'
                                : 'Seleccione un rango de fechas y presione Consultar.'
                    }
                />
            </div>

            {mostrarExcluidas && (
                <CuentasExcluidasModal
                    cuentas={cuentasExcluidas}
                    usuario={usuario}
                    sugerencias={sugerenciasCuentas}
                    onCambio={handleCambioExcluidas}
                    onCerrar={() => setMostrarExcluidas(false)}
                />
            )}
        </div>
    )
}

export default RecepcionFacturasCDScreen
