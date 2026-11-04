import React, { useContext, useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { WMSContext } from '../../Context/WMSContext'
import { ClipboardCheck, RefreshCw } from 'lucide-react'
import { AuditoriaInternaApi } from '../../api/AuditoriaInternaApi'
import {
    DashboardCaja,
    DashboardContratista,
    DashboardDia,
    DashboardPendiente,
    DashboardResumen,
} from '../../interfaces/AuditoriaInterna/AuditoriaInternaInterface'
import { HeaderGenerico, TablaGenerica, ColumnConfig } from '../../Components'
import { IcoDownload, IcoX, Spinner } from '../../Components/icons'
import { GraficaCajasPorDia } from './GraficaCajasPorDia'
import { DetalleCajaModal, etiquetaResultado, formatearFechaHora } from './DetalleCajaModal'
// @ts-ignore
import '../../Styles/TemplateGenericoScreen.css'
// @ts-ignore
import './AuditoriaInterna.css'

const FILAS_POR_PAGINA = 15
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

type Vista = 'historial' | 'pendientes'

const aISODate = (d: Date) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${mm}-${dd}`
}

// Año obligatorio; mes y día opcionales (0 = todos)
const rangoFechas = (anio: number, mes: number, dia: number) => {
    if (mes === 0) return { ini: `${anio}-01-01`, fin: `${anio}-12-31` }
    if (dia === 0) return { ini: aISODate(new Date(anio, mes - 1, 1)), fin: aISODate(new Date(anio, mes, 0)) }
    const fecha = aISODate(new Date(anio, mes - 1, dia))
    return { ini: fecha, fin: fecha }
}

const numero = (v: number) => v.toLocaleString('es-HN')
const porcentaje = (v: number) => `${v.toLocaleString('es-HN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

// Total de un grupo de lineas, con cobertura y exactitud recalculadas (no promediadas)
const totalGrupo = (filas: DashboardContratista[], linea: string): DashboardContratista => {
    const t = filas.reduce((a, c) => ({
        ...a,
        cajasEnviadas: a.cajasEnviadas + c.cajasEnviadas,
        cajasEnviadasAuditadas: a.cajasEnviadasAuditadas + c.cajasEnviadasAuditadas,
        cajasAuditadas: a.cajasAuditadas + c.cajasAuditadas,
        cajasConDiferencia: a.cajasConDiferencia + c.cajasConDiferencia,
        unidadesEsperadas: a.unidadesEsperadas + c.unidadesEsperadas,
        unidadesEscaneadas: a.unidadesEscaneadas + c.unidadesEscaneadas,
        unidadesFaltantes: a.unidadesFaltantes + c.unidadesFaltantes,
        unidadesSobrantes: a.unidadesSobrantes + c.unidadesSobrantes,
    }), {
        origen: filas[0]?.origen ?? '', linea, cajasEnviadas: 0, cajasEnviadasAuditadas: 0, cobertura: 0, cajasAuditadas: 0,
        cajasConDiferencia: 0, unidadesEsperadas: 0, unidadesEscaneadas: 0, unidadesFaltantes: 0, unidadesSobrantes: 0, exactitud: 0,
    })
    const diferencias = t.unidadesFaltantes + t.unidadesSobrantes
    return {
        ...t,
        cobertura: t.cajasEnviadas === 0 ? 0 : 100 * t.cajasEnviadasAuditadas / t.cajasEnviadas,
        exactitud: t.unidadesEsperadas === 0 ? 0 : Math.max(0, 100 * (1 - diferencias / t.unidadesEsperadas)),
    }
}

const AuditoriaInternaDashboardScreen = () => {
    const { WMSState } = useContext(WMSContext)
    const usuario = WMSState?.usuario || ''
    const [puedeReabrir, setPuedeReabrir] = useState(false)

    const hoy = new Date()
    const [anio, setAnio] = useState(hoy.getFullYear())
    const [mes, setMes] = useState(hoy.getMonth() + 1)
    const [dia, setDia] = useState(0)

    const [resumen, setResumen] = useState<DashboardResumen | null>(null)
    const [contratistas, setContratistas] = useState<DashboardContratista[]>([])
    const [porDia, setPorDia] = useState<DashboardDia[]>([])
    const [cajas, setCajas] = useState<DashboardCaja[]>([])
    const [pendientes, setPendientes] = useState<DashboardPendiente[]>([])

    const [cargando, setCargando] = useState(false)
    const [mensaje, setMensaje] = useState<string | null>(null)
    const [vista, setVista] = useState<Vista>('historial')
    const [busqueda, setBusqueda] = useState('')
    const [categoria, setCategoria] = useState('')
    const [paginaActual, setPaginaActual] = useState(1)
    const [cajaDetalle, setCajaDetalle] = useState<number | null>(null)

    const anios = useMemo(() => [0, 1, 2].map(n => hoy.getFullYear() - n), []) // eslint-disable-line react-hooks/exhaustive-deps
    const diasMes = mes === 0 ? 0 : new Date(anio, mes, 0).getDate()
    const rango = rangoFechas(anio, mes, Math.min(dia, diasMes))

    const getData = async () => {
        setCargando(true)
        setMensaje(null)
        try {
            const [r, c, d, cj, p] = await Promise.all([
                AuditoriaInternaApi.getResumen(rango.ini, rango.fin),
                AuditoriaInternaApi.getPorContratista(rango.ini, rango.fin),
                AuditoriaInternaApi.getPorDia(rango.ini, rango.fin),
                AuditoriaInternaApi.getCajas(rango.ini, rango.fin),
                AuditoriaInternaApi.getPendientes(rango.ini, rango.fin),
            ])
            setResumen(r.data)
            setContratistas(c.data)
            setPorDia(d.data)
            setCajas(cj.data)
            setPendientes(p.data)
            setPaginaActual(1)
        } catch (err: any) {
            console.log(err)
            setMensaje(err.response?.data?.message || 'Error al conectar con el servidor.')
        }
        setCargando(false)
    }

    useEffect(() => { getData() }, [anio, mes, dia]) // eslint-disable-line react-hooks/exhaustive-deps

    // El boton de reabrir solo se muestra con permiso; el SP lo vuelve a validar
    useEffect(() => {
        if (!usuario) { setPuedeReabrir(false); return }
        AuditoriaInternaApi.getPermisoReabrir(usuario)
            .then(resp => setPuedeReabrir(resp.data.puedeReabrir))
            .catch(() => setPuedeReabrir(false))
    }, [usuario])

    // ── Tablas ───────────────────────────────────────────────────────────────
    // Planta propia (Denim PEPE, MB, Serigrafía) separada de los contratistas externos
    const gruposLinea = useMemo(() => [
        { clave: 'PLANTA', titulo: 'Planta propia', total: 'Total planta', filas: contratistas.filter(c => c.origen === 'PLANTA') },
        { clave: 'CONTRATISTA', titulo: 'Contratistas externos', total: 'Total contratistas', filas: contratistas.filter(c => c.origen !== 'PLANTA') },
    ].filter(g => g.filas.length > 0), [contratistas])

    const categorias = useMemo(
        () => Array.from(new Set(cajas.map(c => c.categoriaInterna || 'Sin categoría'))).sort(),
        [cajas]
    )

    const cajasFiltradas = useMemo(() => {
        const q = busqueda.trim().toLowerCase()
        return cajas.filter(c => {
            if (categoria && (c.categoriaInterna || 'Sin categoría') !== categoria) return false
            if (!q) return true
            return [c.op, c.numeroCaja, c.articulo, c.estilo, c.linea, c.contratista, c.categoriaInterna, c.plDespacho, c.usuarioInicio, c.resultado]
                .join(' ').toLowerCase().includes(q)
        })
    }, [cajas, busqueda, categoria])

    const pendientesFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase()
        if (!q) return pendientes
        return pendientes.filter(p => [p.op, p.numeroCaja, p.linea, p.contratista, p.origen, p.estado].join(' ').toLowerCase().includes(q))
    }, [pendientes, busqueda])

    const datosVista: any[] = vista === 'historial' ? cajasFiltradas : pendientesFiltrados
    const totalPaginas = Math.max(1, Math.ceil(datosVista.length / FILAS_POR_PAGINA))
    const datosPagina = datosVista.slice((paginaActual - 1) * FILAS_POR_PAGINA, paginaActual * FILAS_POR_PAGINA)

    const columnasCajas: ColumnConfig<DashboardCaja>[] = [
        { header: 'OP', accessor: 'op', isId: true },
        { header: 'Caja', accessor: 'numeroCaja', align: 'right' },
        { header: 'Línea', render: c => <span>{c.linea}<small className="ai-origen">{c.origen === 'PLANTA' ? 'Planta' : 'Contratista'}</small></span> },
        { header: 'Categoría', render: c => c.categoriaInterna || <span className="ai-sin-dato">—</span> },
        { header: 'Artículo', render: c => <span title={c.colorDescripcion ?? ''}>{c.articulo}<br /><small className="ai-sin-dato">{c.estilo}</small></span> },
        { header: 'PL', render: c => c.plDespacho || <span className="ai-sin-dato">—</span> },
        { header: 'Esperado', accessor: 'cantidadEsperada', align: 'right' },
        { header: 'Escaneado', accessor: 'cantidadEscaneada', align: 'right' },
        { header: 'Dif.', align: 'right', render: c => <span className={c.diferencia !== 0 ? 'ai-num--alerta' : ''}>{c.diferencia > 0 ? `+${c.diferencia}` : c.diferencia}</span> },
        {
            header: 'Resultado', align: 'center', render: c => {
                const r = etiquetaResultado(c.estado, c.resultado)
                return <span className={`ai-badge ai-badge--${r.clase}`}>{r.texto}</span>
            }
        },
        { header: 'Auditor', accessor: 'usuarioInicio' },
        { header: 'Cierre', render: c => formatearFechaHora(c.fechaCierre) || <span className="ai-sin-dato">—</span> },
        { header: 'Min.', align: 'right', render: c => c.minutos ?? '' },
        {
            header: '', align: 'center', render: c => (
                <button className="gen-btn-outline ai-btn-ver" onClick={() => setCajaDetalle(c.id)}>Ver</button>
            )
        },
    ]

    const columnasPendientes: ColumnConfig<DashboardPendiente>[] = [
        { header: 'OP', accessor: 'op', isId: true },
        { header: 'Caja', accessor: 'numeroCaja', align: 'right' },
        { header: 'Origen', render: p => p.origen === 'PLANTA' ? 'Planta' : 'Contratista' },
        { header: 'Línea', render: p => p.linea },
        { header: 'Enviada', render: p => formatearFechaHora(p.fechaEnvio) },
        {
            header: 'Estado', align: 'center', render: p =>
                <span className={`ai-badge ai-badge--${p.estado === 'EN PROCESO' ? 'proceso' : 'pendiente'}`}>{p.estado === 'EN PROCESO' ? 'En proceso' : 'Sin auditar'}</span>
        },
    ]

    // ── Exportar ─────────────────────────────────────────────────────────────
    const handleExportar = () => {
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(contratistas.map(c => ({
            'Origen': c.origen, 'Linea': c.linea, 'Cajas enviadas': c.cajasEnviadas,
            'Enviadas auditadas': c.cajasEnviadasAuditadas, 'Cobertura %': c.cobertura, 'Cajas auditadas': c.cajasAuditadas,
            'Con diferencia': c.cajasConDiferencia, 'Unid. esperadas': c.unidadesEsperadas, 'Unid. escaneadas': c.unidadesEscaneadas,
            'Faltantes': c.unidadesFaltantes, 'Sobrantes': c.unidadesSobrantes, 'Exactitud %': c.exactitud,
        }))), 'Por linea')
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cajas.map(c => ({
            'OP': c.op, 'Caja': c.numeroCaja, 'Estado': c.estado, 'Resultado': c.resultado ?? '', 'Validacion': c.modoValidacion,
            'Origen': c.origen, 'Linea': c.linea, 'Contratista': c.contratista ?? '', 'Conjunto': c.conjunto ?? '', 'Categoria': c.categoriaInterna ?? '',
            'Articulo': c.articulo, 'Estilo': c.estilo ?? '', 'Color': c.colorDescripcion ?? '', 'Lote': c.lote ?? '',
            'Calidad': c.categoriaCaja ?? '', 'PL': c.plDespacho ?? '', 'Esperado': c.cantidadEsperada, 'Escaneado': c.cantidadEscaneada,
            'Diferencia': c.diferencia, 'Observaciones': c.observaciones ?? '', 'Auditor': c.usuarioInicio,
            'Inicio': formatearFechaHora(c.fechaInicio), 'Cerro': c.usuarioCierre ?? '', 'Cierre': formatearFechaHora(c.fechaCierre),
            'Minutos': c.minutos ?? '', 'Rechazos': c.rechazos,
        }))), 'Cajas auditadas')
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pendientes.map(p => ({
            'OP': p.op, 'Caja': p.numeroCaja, 'Origen': p.origen, 'Linea': p.linea, 'Contratista': p.contratista ?? '',
            'Enviada': formatearFechaHora(p.fechaEnvio), 'Estado': p.estado,
        }))), 'Pendientes')
        XLSX.writeFile(wb, `AuditoriaInterna_${rango.ini.replace(/-/g, '')}_${rango.fin.replace(/-/g, '')}.xlsx`)
    }

    const estadoHeader = cargando ? 'consultando' : resumen ? 'datos' : 'vacio'
    const barra = (valor: number) => (
        <div className="ai-barra-celda" title={porcentaje(valor)}>
            <div className="ai-barra-celda__pista"><div className="ai-barra-celda__fill" style={{ width: `${Math.min(100, Math.max(0, valor))}%` }} /></div>
            <span>{porcentaje(valor)}</span>
        </div>
    )

    return (
        <div className="gen-page-root">
            <div className="gen-container">
                <HeaderGenerico
                    titulo="Auditoría Interna de Cajas"
                    subtitulo="Cobertura, exactitud y diferencias de las cajas auditadas en el CD (planta y contratistas)."
                    icono={<ClipboardCheck size={20} />}
                    estado={estadoHeader}
                />

                {mensaje && (
                    <div className="alert-box alert-error fade-in">
                        <span>{mensaje}</span>
                        <button className="alert-close" onClick={() => setMensaje(null)}><IcoX /></button>
                    </div>
                )}

                {/* Filtros: Año - Mes - Día */}
                <section className="gen-upload-card-header">
                    <div className="ai-filtros">
                        <div className="gen-filtro-grupo">
                            <label htmlFor="ai-anio">Año</label>
                            <select id="ai-anio" value={anio} onChange={e => setAnio(Number(e.target.value))}>
                                {anios.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div className="gen-filtro-grupo">
                            <label htmlFor="ai-mes">Mes</label>
                            <select id="ai-mes" value={mes} onChange={e => { setMes(Number(e.target.value)); setDia(0) }}>
                                <option value={0}>Todos</option>
                                {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                            </select>
                        </div>
                        <div className="gen-filtro-grupo">
                            <label htmlFor="ai-dia">Día</label>
                            <select id="ai-dia" value={dia} disabled={mes === 0} onChange={e => setDia(Number(e.target.value))}>
                                <option value={0}>Todos</option>
                                {Array.from({ length: diasMes }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <span className="ai-rango">{rango.ini === rango.fin ? rango.ini : `${rango.ini} a ${rango.fin}`}</span>
                        <button className="gen-btn-submit gen-action-spacer" onClick={getData} disabled={cargando}>
                            {cargando ? <Spinner size={15} /> : <RefreshCw size={15} />}
                            <span>{cargando ? 'Consultando…' : 'Actualizar'}</span>
                        </button>
                        <button className="gen-btn-outline" onClick={handleExportar} disabled={!resumen || cargando}>
                            <IcoDownload />
                            <span>Exportar</span>
                        </button>
                    </div>
                </section>

                {/* Indicadores */}
                {resumen && (
                    <div className="ai-kpis">
                        <div className="ai-kpi ai-kpi--principal">
                            <span className="ai-kpi__label">Cobertura de auditoría</span>
                            <span className="ai-kpi__valor">{porcentaje(resumen.cobertura)}</span>
                            <div className="ai-kpi__barra"><div style={{ width: `${Math.min(100, resumen.cobertura)}%` }} /></div>
                            <span className="ai-kpi__nota">{numero(resumen.cajasEnviadasAuditadas)} de {numero(resumen.cajasEnviadas)} cajas enviadas</span>
                        </div>
                        <div className="ai-kpi">
                            <span className="ai-kpi__label">Cajas pendientes de auditar</span>
                            <span className="ai-kpi__valor">{numero(resumen.cajasPendientes)}</span>
                            <span className="ai-kpi__nota">{numero(resumen.cajasEnProceso)} en proceso (abiertas)</span>
                        </div>
                        <div className="ai-kpi">
                            <span className="ai-kpi__label">Cajas auditadas</span>
                            <span className="ai-kpi__valor">{numero(resumen.cajasAuditadas)}</span>
                            <span className="ai-kpi__nota">{numero(resumen.cajasConDiferencia)} con diferencia · {resumen.minutosPromedioCaja} min/caja</span>
                        </div>
                        <div className="ai-kpi">
                            <span className="ai-kpi__label">Exactitud de unidades</span>
                            <span className="ai-kpi__valor">{porcentaje(resumen.exactitud)}</span>
                            <span className="ai-kpi__nota">{numero(resumen.unidadesEscaneadas)} de {numero(resumen.unidadesEsperadas)} unidades</span>
                        </div>
                        <div className="ai-kpi">
                            <span className="ai-kpi__label">Unidades faltantes</span>
                            <span className={`ai-kpi__valor ${resumen.unidadesFaltantes > 0 ? 'ai-num--alerta' : ''}`}>{numero(resumen.unidadesFaltantes)}</span>
                        </div>
                        <div className="ai-kpi">
                            <span className="ai-kpi__label">Unidades sobrantes</span>
                            <span className={`ai-kpi__valor ${resumen.unidadesSobrantes > 0 ? 'ai-num--alerta' : ''}`}>{numero(resumen.unidadesSobrantes)}</span>
                        </div>
                    </div>
                )}

                {/* Graficas */}
                {resumen && (
                    <div className="ai-paneles">
                        <section className="ai-panel ai-panel--grafica">
                            <h3>Cajas auditadas por día</h3>
                            <GraficaCajasPorDia datos={porDia} />
                        </section>
                        <section className="ai-panel">
                            <h3>Resumen por línea y contratista</h3>
                            <div className="ai-tabla-wrapper">
                                <table className="gen-data-table ai-tabla-contratistas">
                                    <thead>
                                        <tr>
                                            <th>Línea</th>
                                            <th className="ai-num">Enviadas</th>
                                            <th>Cobertura</th>
                                            <th className="ai-num">Auditadas</th>
                                            <th className="ai-num">Faltantes</th>
                                            <th className="ai-num">Sobrantes</th>
                                            <th>Exactitud</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {gruposLinea.length === 0 && <tr><td colSpan={7} className="ai-sin-dato">Sin datos en el periodo.</td></tr>}
                                        {gruposLinea.map(g => {
                                            const fila = (c: DashboardContratista, clase = '') => (
                                                <tr key={`${g.clave}-${c.linea}`} className={clase}>
                                                    <td>{c.linea}</td>
                                                    <td className="ai-num">{numero(c.cajasEnviadas)}</td>
                                                    <td>{barra(c.cobertura)}</td>
                                                    <td className="ai-num">{numero(c.cajasAuditadas)}</td>
                                                    <td className={`ai-num ${c.unidadesFaltantes > 0 ? 'ai-num--alerta' : ''}`}>{numero(c.unidadesFaltantes)}</td>
                                                    <td className={`ai-num ${c.unidadesSobrantes > 0 ? 'ai-num--alerta' : ''}`}>{numero(c.unidadesSobrantes)}</td>
                                                    <td>{c.cajasAuditadas > 0 ? barra(c.exactitud) : <span className="ai-sin-dato">—</span>}</td>
                                                </tr>
                                            )
                                            return (
                                                <React.Fragment key={g.clave}>
                                                    <tr className="ai-grupo"><td colSpan={7}>{g.titulo}</td></tr>
                                                    {g.filas.map(c => fila(c))}
                                                    {g.filas.length > 1 && fila(totalGrupo(g.filas, g.total), 'ai-subtotal')}
                                                </React.Fragment>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                )}

                {/* Historial / pendientes */}
                <div className="ai-barra-tabla">
                    <div className="ai-segmentado" role="tablist">
                        {([
                            ['historial', `Cajas auditadas (${numero(cajas.length)})`],
                            ['pendientes', `Pendientes de auditar (${numero(resumen ? resumen.cajasPendientes : pendientes.length)})`],
                        ] as [Vista, string][]).map(([valor, texto]) => (
                            <button key={valor} role="tab" aria-selected={vista === valor}
                                className={vista === valor ? 'ai-segmentado--activo' : ''}
                                onClick={() => { setVista(valor); setPaginaActual(1) }}>{texto}</button>
                        ))}
                    </div>
                    {vista === 'historial' && (
                        <select
                            className="ai-select-categoria"
                            aria-label="Categoría"
                            value={categoria}
                            onChange={e => { setCategoria(e.target.value); setPaginaActual(1) }}
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    )}
                    {vista === 'pendientes' && pendientes.length >= 5000 && (
                        <span className="ai-nota-limite">Se muestran las 5,000 más recientes; reduzca el periodo para ver todas.</span>
                    )}
                    <div className="gen-search-input-group">
                        <input
                            type="text"
                            className="gen-input-busqueda-global"
                            placeholder="Buscar OP, caja, artículo, contratista, PL…"
                            value={busqueda}
                            onChange={e => { setBusqueda(e.target.value); setPaginaActual(1) }}
                        />
                        {busqueda && <button className="gen-btn-limpiar-busqueda" onClick={() => setBusqueda('')}><IcoX /></button>}
                    </div>
                </div>

                {vista === 'historial' ? (
                    <TablaGenerica
                        columns={columnasCajas}
                        data={datosPagina as DashboardCaja[]}
                        keyExtractor={c => c.id}
                        paginaActual={paginaActual}
                        totalPaginas={totalPaginas}
                        totalRegistros={cajasFiltradas.length}
                        onPaginaChange={setPaginaActual}
                        emptyMessage={cargando ? 'Consultando información...' : 'No hay cajas auditadas en el periodo.'}
                    />
                ) : (
                    <TablaGenerica
                        columns={columnasPendientes}
                        data={datosPagina as DashboardPendiente[]}
                        keyExtractor={p => `${p.op}-${p.numeroCaja}`}
                        paginaActual={paginaActual}
                        totalPaginas={totalPaginas}
                        totalRegistros={pendientesFiltrados.length}
                        onPaginaChange={setPaginaActual}
                        emptyMessage={cargando ? 'Consultando información...' : 'No hay cajas pendientes en el periodo.'}
                    />
                )}
            </div>

            {cajaDetalle !== null && (
                <DetalleCajaModal
                    auditoriaId={cajaDetalle}
                    usuario={usuario}
                    puedeReabrir={puedeReabrir}
                    onCerrar={() => setCajaDetalle(null)}
                    onCambio={getData}
                />
            )}
        </div>
    )
}

export default AuditoriaInternaDashboardScreen
