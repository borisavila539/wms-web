import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
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
type PorFecha = 'RECEPCION' | 'AUDITORIA'

// Filtro por estado: cajas auditadas por resultado (ABIERTA = en proceso); pendientes por su estado
const ESTADOS_HISTORIAL: [string, string][] = [
    ['ABIERTA', 'En proceso'],
    ['COMPLETA', 'Completa'],
    ['ETIQUETAS', 'Completa · dif. etiquetas'],
    ['FALTANTE', 'Faltante'],
    ['SOBRANTE', 'Sobrante'],
    ['MIXTO', 'Faltante y sobrante'],
]
const ESTADOS_PENDIENTES: [string, string][] = [
    ['SIN AUDITAR', 'Sin auditar'],
    ['EN PROCESO', 'En proceso'],
]
const estadoCaja = (c: DashboardCaja) => c.estado === 'ABIERTA' ? 'ABIERTA' : (c.resultado ?? '')

// Fecha sin hora (las recepciones de AX no traen hora)
const formatearFecha = (valor: string | null) => {
    if (!valor) return ''
    const d = new Date(valor)
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

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

// Total de un grupo de lineas, con cobertura y exactitud recalculadas (no promediadas).
// Cobertura = auditadas de las recibidas / recibidas.
const totalGrupo = (filas: DashboardContratista[], linea: string): DashboardContratista => {
    const sumables: (keyof DashboardContratista)[] = [
        'cajasEnviadas', 'unidadesEnviadas', 'cajasRecibidas', 'unidadesRecibidas', 'cajasRecibidasAuditadas',
        'cajasAuditadas', 'cajasConDiferencia', 'cajasDiferenciaEtiqueta', 'unidadesEsperadas', 'unidadesEscaneadas',
        'unidadesFaltantes', 'unidadesSobrantes', 'unidadesDiferenciaEtiqueta',
    ]
    const t: DashboardContratista = {
        origen: filas[0]?.origen ?? '', linea, cajasEnviadas: 0, unidadesEnviadas: 0, cajasRecibidas: 0, unidadesRecibidas: 0,
        cajasRecibidasAuditadas: 0, cobertura: 0, cajasAuditadas: 0, cajasConDiferencia: 0, cajasDiferenciaEtiqueta: 0,
        unidadesEsperadas: 0, unidadesEscaneadas: 0, unidadesFaltantes: 0, unidadesSobrantes: 0, unidadesDiferenciaEtiqueta: 0, exactitud: 0,
    }
    filas.forEach(c => sumables.forEach(k => { (t[k] as number) += c[k] as number }))
    const diferencias = t.unidadesFaltantes + t.unidadesSobrantes
    return {
        ...t,
        cobertura: t.cajasRecibidas === 0 ? 0 : 100 * t.cajasRecibidasAuditadas / t.cajasRecibidas,
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
    // La tabla de cajas va por fecha de recepcion (igual que el resumen) o por fecha de auditoria
    const [porFecha, setPorFecha] = useState<PorFecha>('RECEPCION')
    const [cargandoCajas, setCargandoCajas] = useState(false)
    const [busqueda, setBusqueda] = useState('')
    const [categoria, setCategoria] = useState('')
    // Filtro por linea de la tabla de abajo ('' = todas); se pone desde el resumen por linea
    const [linea, setLinea] = useState('')
    // Estado de la tabla de abajo ('' = todos); depende de la vista
    const [estado, setEstado] = useState('')
    const barraTabla = useRef<HTMLDivElement>(null)
    const [paginaActual, setPaginaActual] = useState(1)
    const [cajaDetalle, setCajaDetalle] = useState<number | null>(null)

    const anios = useMemo(() => [0, 1, 2].map(n => hoy.getFullYear() - n), []) // eslint-disable-line react-hooks/exhaustive-deps
    const diasMes = mes === 0 ? 0 : new Date(anio, mes, 0).getDate()
    const rango = rangoFechas(anio, mes, Math.min(dia, diasMes))

    // Cada consulta lleva un numero: si el usuario cambia el filtro antes de que responda,
    // la respuesta vieja se descarta (si no, una consulta lenta pisa a la nueva)
    const consultaActual = useRef(0)
    // La tabla de cajas tambien se consulta sola (al cambiar la fecha de la tabla)
    const consultaCajas = useRef(0)

    const getData = async () => {
        const consulta = ++consultaActual.current
        const consultaTabla = ++consultaCajas.current
        setCargando(true)
        setMensaje(null)
        try {
            const [r, c, d, cj, p] = await Promise.all([
                AuditoriaInternaApi.getResumen(rango.ini, rango.fin),
                AuditoriaInternaApi.getPorContratista(rango.ini, rango.fin),
                AuditoriaInternaApi.getPorDia(rango.ini, rango.fin),
                AuditoriaInternaApi.getCajas(rango.ini, rango.fin, porFecha),
                AuditoriaInternaApi.getPendientes(rango.ini, rango.fin),
            ])
            if (consulta !== consultaActual.current) return
            setResumen(r.data)
            setContratistas(c.data)
            setPorDia(d.data)
            if (consultaTabla === consultaCajas.current) setCajas(cj.data)
            setPendientes(p.data)
            setPaginaActual(1)
        } catch (err: any) {
            if (consulta !== consultaActual.current) return
            console.log(err)
            setMensaje(err.response?.data?.message || 'Error al conectar con el servidor.')
        }
        setCargando(false)
    }

    const getCajas = async (modo: PorFecha) => {
        const consulta = ++consultaCajas.current
        setCargandoCajas(true)
        try {
            const cj = await AuditoriaInternaApi.getCajas(rango.ini, rango.fin, modo)
            if (consulta !== consultaCajas.current) return
            setCajas(cj.data)
            setPaginaActual(1)
        } catch (err: any) {
            if (consulta !== consultaCajas.current) return
            console.log(err)
            setMensaje(err.response?.data?.message || 'Error al conectar con el servidor.')
        }
        setCargandoCajas(false)
    }

    const cambiarPorFecha = (modo: PorFecha) => {
        setPorFecha(modo)
        setCajas([])
        getCajas(modo)
    }

    // Desde el resumen por linea: muestra las cajas recibidas de esa linea que faltan por auditar
    const verPendientesLinea = (l: string) => {
        setLinea(l)
        setEstado('')
        setBusqueda('')
        setVista('pendientes')
        setPaginaActual(1)
        barraTabla.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

    // Lineas del periodo (mismo orden que el resumen por linea)
    const lineas = useMemo(() => contratistas.map(c => c.linea), [contratistas])

    // Con todos los filtros menos el estado (asi el selector de estado muestra cuantas hay de cada uno)
    const cajasSinEstado = useMemo(() => {
        const q = busqueda.trim().toLowerCase()
        return cajas.filter(c => {
            if (categoria && (c.categoriaInterna || 'Sin categoría') !== categoria) return false
            if (linea && c.linea !== linea) return false
            if (!q) return true
            return [c.op, c.numeroCaja, c.articulo, c.estilo, c.linea, c.contratista, c.categoriaInterna, c.plDespacho, c.usuarioInicio, c.resultado]
                .join(' ').toLowerCase().includes(q)
        })
    }, [cajas, busqueda, categoria, linea])

    const cajasFiltradas = useMemo(
        () => estado ? cajasSinEstado.filter(c => estadoCaja(c) === estado) : cajasSinEstado,
        [cajasSinEstado, estado]
    )

    const pendientesSinEstado = useMemo(() => {
        const q = busqueda.trim().toLowerCase()
        return pendientes.filter(p => {
            if (linea && p.linea !== linea) return false
            if (!q) return true
            return [p.op, p.numeroCaja, p.linea, p.contratista, p.origen, p.estado].join(' ').toLowerCase().includes(q)
        })
    }, [pendientes, busqueda, linea])

    const pendientesFiltrados = useMemo(
        () => estado ? pendientesSinEstado.filter(p => p.estado === estado) : pendientesSinEstado,
        [pendientesSinEstado, estado]
    )

    // Opciones del selector de estado con su conteo (segun la vista)
    const opcionesEstado = useMemo(() => {
        const lista = vista === 'historial' ? ESTADOS_HISTORIAL : ESTADOS_PENDIENTES
        const conteo = (clave: string) => vista === 'historial'
            ? cajasSinEstado.filter(c => estadoCaja(c) === clave).length
            : pendientesSinEstado.filter(p => p.estado === clave).length
        return lista.map(([clave, texto]) => ({ clave, texto, n: conteo(clave) }))
    }, [vista, cajasSinEstado, pendientesSinEstado])

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
        { header: 'Etiq.', align: 'right', render: c => c.diferenciaEtiqueta > 0 ? <span className="ai-num--aviso" title="Prendas con otra etiqueta en la misma talla">{c.diferenciaEtiqueta}</span> : <span className="ai-sin-dato">—</span> },
        {
            header: 'Resultado', align: 'center', render: c => {
                const r = etiquetaResultado(c.estado, c.resultado)
                return <span className={`ai-badge ai-badge--${r.clase}`}>{r.texto}</span>
            }
        },
        { header: 'Auditor', accessor: 'usuarioInicio' },
        { header: 'Recibida', render: c => formatearFecha(c.fechaRecepcion) || <span className="ai-sin-dato" title="No se encontró la recepción en el CD">—</span> },
        { header: 'Auditada', render: c => formatearFechaHora(c.fechaCierre) || <span className="ai-sin-dato">En proceso</span> },
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
        { header: 'Uds.', align: 'right', render: p => numero(p.unidades) },
        { header: 'Enviada', render: p => formatearFechaHora(p.fechaEnvio) },
        { header: 'Recibida', render: p => formatearFechaHora(p.fechaRecepcion) },
        {
            header: 'Estado', align: 'center', render: p =>
                <span className={`ai-badge ai-badge--${p.estado === 'EN PROCESO' ? 'proceso' : 'pendiente'}`}>{p.estado === 'EN PROCESO' ? 'En proceso' : 'Sin auditar'}</span>
        },
    ]

    // ── Exportar ─────────────────────────────────────────────────────────────
    const handleExportar = () => {
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(contratistas.map(c => ({
            'Origen': c.origen, 'Linea': c.linea, 'Cajas enviadas': c.cajasEnviadas, 'Unid. enviadas': c.unidadesEnviadas,
            'Cajas recibidas': c.cajasRecibidas, 'Unid. recibidas': c.unidadesRecibidas, 'Recibidas auditadas': c.cajasRecibidasAuditadas,
            'Cobertura % (recibidas)': c.cobertura, 'Cajas auditadas': c.cajasAuditadas,
            'Con diferencia': c.cajasConDiferencia, 'Con dif. etiquetas': c.cajasDiferenciaEtiqueta,
            'Unid. esperadas': c.unidadesEsperadas, 'Unid. escaneadas': c.unidadesEscaneadas,
            'Faltantes': c.unidadesFaltantes, 'Sobrantes': c.unidadesSobrantes, 'Unid. dif. etiquetas': c.unidadesDiferenciaEtiqueta,
            'Exactitud %': c.exactitud,
        }))), 'Por linea')
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cajas.map(c => ({
            'OP': c.op, 'Caja': c.numeroCaja, 'Estado': c.estado, 'Resultado': c.resultado ?? '', 'Validacion': c.modoValidacion,
            'Origen': c.origen, 'Linea': c.linea, 'Contratista': c.contratista ?? '', 'Conjunto': c.conjunto ?? '', 'Categoria': c.categoriaInterna ?? '',
            'Articulo': c.articulo, 'Estilo': c.estilo ?? '', 'Color': c.colorDescripcion ?? '', 'Lote': c.lote ?? '',
            'Calidad': c.categoriaCaja ?? '', 'PL': c.plDespacho ?? '', 'Esperado': c.cantidadEsperada, 'Escaneado': c.cantidadEscaneada,
            'Diferencia': c.diferencia, 'Dif. etiquetas': c.diferenciaEtiqueta, 'Observaciones': c.observaciones ?? '',
            'Enviada': formatearFechaHora(c.fechaEnvio), 'Recibida': formatearFecha(c.fechaRecepcion), 'Auditor': c.usuarioInicio,
            'Inicio': formatearFechaHora(c.fechaInicio), 'Cerro': c.usuarioCierre ?? '', 'Cierre': formatearFechaHora(c.fechaCierre),
            'Minutos': c.minutos ?? '', 'Rechazos': c.rechazos,
        }))), porFecha === 'RECEPCION' ? 'Cajas auditadas (recepcion)' : 'Cajas auditadas (auditoria)')
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pendientes.map(p => ({
            'OP': p.op, 'Caja': p.numeroCaja, 'Origen': p.origen, 'Linea': p.linea, 'Contratista': p.contratista ?? '',
            'Unidades': p.unidades, 'Enviada': formatearFechaHora(p.fechaEnvio), 'Recibida': formatearFechaHora(p.fechaRecepcion), 'Estado': p.estado,
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
                    subtitulo="Por fecha de recepción en el CD: cobertura, exactitud y diferencias de lo recibido, aunque se haya auditado otro día (planta y contratistas)."
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
                        {resumen?.universoActualizado && (
                            <span className="ai-rango" title="Envíos y recepciones se recalculan cada 10 minutos como máximo; las auditorías se ven al momento.">
                                Envíos y recepciones al {new Date(resumen.universoActualizado).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
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
                            <span className="ai-kpi__nota">{numero(resumen.cajasRecibidasAuditadas)} de {numero(resumen.cajasRecibidas)} cajas recibidas</span>
                        </div>
                        <div className="ai-kpi">
                            <span className="ai-kpi__label">Cajas recibidas en el CD</span>
                            <span className="ai-kpi__valor">{numero(resumen.cajasRecibidas)}</span>
                            <span className="ai-kpi__nota">
                                {numero(resumen.unidadesRecibidas)} uds · de {numero(resumen.cajasEnviadas)} enviadas ({numero(resumen.unidadesEnviadas)} uds)
                            </span>
                        </div>
                        <div className="ai-kpi">
                            <span className="ai-kpi__label">Pendientes de auditar</span>
                            <span className="ai-kpi__valor">{numero(resumen.cajasPendientes)}</span>
                            <span className="ai-kpi__nota">recibidas sin auditar · {numero(resumen.cajasEnProceso)} en proceso</span>
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
                        <div className="ai-kpi" title="Prendas de la misma talla con una etiqueta distinta a la registrada en empaque. Las unidades sí están: no cuentan en la exactitud.">
                            <span className="ai-kpi__label">Diferencia de etiquetas</span>
                            <span className={`ai-kpi__valor ${resumen.unidadesDiferenciaEtiqueta > 0 ? 'ai-num--aviso' : ''}`}>{numero(resumen.unidadesDiferenciaEtiqueta)}</span>
                            <span className="ai-kpi__nota">uds en {numero(resumen.cajasDiferenciaEtiqueta)} cajas · no cuentan como error</span>
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
                                            <th className="ai-num">Recibidas</th>
                                            <th>Cobertura</th>
                                            <th className="ai-num">Auditadas</th>
                                            <th className="ai-num">Faltantes</th>
                                            <th className="ai-num">Sobrantes</th>
                                            <th className="ai-num" title="Unidades con etiqueta distinta a la registrada en empaque">Dif. etiq.</th>
                                            <th>Exactitud</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {gruposLinea.length === 0 && <tr><td colSpan={9} className="ai-sin-dato">Sin datos en el periodo.</td></tr>}
                                        {gruposLinea.map(g => {
                                            const fila = (c: DashboardContratista, clase = '') => {
                                                // Recibidas sin auditoria cerrada (sin auditar + en proceso); el subtotal no lleva enlace
                                                const faltan = c.cajasRecibidas - c.cajasRecibidasAuditadas
                                                return (
                                                <tr key={`${g.clave}-${c.linea}`} className={clase}>
                                                    <td>{c.linea}</td>
                                                    <td className="ai-num">{numero(c.cajasEnviadas)}<small className="ai-uds">{numero(c.unidadesEnviadas)} uds</small></td>
                                                    <td className="ai-num">{numero(c.cajasRecibidas)}<small className="ai-uds">{numero(c.unidadesRecibidas)} uds</small></td>
                                                    <td>
                                                        {barra(c.cobertura)}
                                                        {faltan > 0 && !clase && (
                                                            <button className="ai-link-pendientes" onClick={() => verPendientesLinea(c.linea)}
                                                                title={`Ver las cajas recibidas de ${c.linea} que faltan por auditar`}>
                                                                {numero(faltan)} {faltan === 1 ? 'pendiente' : 'pendientes'}
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="ai-num">{numero(c.cajasAuditadas)}<small className="ai-uds">{numero(c.unidadesEscaneadas)} uds</small></td>
                                                    <td className={`ai-num ${c.unidadesFaltantes > 0 ? 'ai-num--alerta' : ''}`}>{numero(c.unidadesFaltantes)}</td>
                                                    <td className={`ai-num ${c.unidadesSobrantes > 0 ? 'ai-num--alerta' : ''}`}>{numero(c.unidadesSobrantes)}</td>
                                                    <td className={`ai-num ${c.unidadesDiferenciaEtiqueta > 0 ? 'ai-num--aviso' : ''}`}>{numero(c.unidadesDiferenciaEtiqueta)}</td>
                                                    <td>{c.cajasAuditadas > 0 ? barra(c.exactitud) : <span className="ai-sin-dato">—</span>}</td>
                                                </tr>
                                                )
                                            }
                                            return (
                                                <React.Fragment key={g.clave}>
                                                    <tr className="ai-grupo"><td colSpan={9}>{g.titulo}</td></tr>
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
                <div className="ai-barra-tabla" ref={barraTabla}>
                    <div className="ai-segmentado" role="tablist">
                        {([
                            // Con una linea elegida, los contadores son de esa linea
                            ['historial', `Cajas auditadas (${numero(linea ? cajas.filter(c => c.linea === linea).length : cajas.length)})`],
                            ['pendientes', `Pendientes de auditar (${numero(linea ? pendientes.filter(p => p.linea === linea).length
                                : resumen ? resumen.cajasPendientes : pendientes.length)})`],
                        ] as [Vista, string][]).map(([valor, texto]) => (
                            <button key={valor} role="tab" aria-selected={vista === valor}
                                className={vista === valor ? 'ai-segmentado--activo' : ''}
                                onClick={() => { setVista(valor); setEstado(''); setPaginaActual(1) }}>{texto}</button>
                        ))}
                    </div>
                    {vista === 'historial' && (
                        <select
                            className="ai-select-categoria"
                            aria-label="Fecha de la tabla"
                            title="Recepción: las cajas recibidas en el periodo (cuadra con el resumen). Auditoría: las cajas auditadas en el periodo."
                            value={porFecha}
                            onChange={e => cambiarPorFecha(e.target.value as PorFecha)}
                        >
                            <option value="RECEPCION">Por fecha de recepción</option>
                            <option value="AUDITORIA">Por fecha de auditoría</option>
                        </select>
                    )}
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
                    <select
                        className="ai-select-categoria"
                        aria-label="Línea"
                        value={linea}
                        onChange={e => { setLinea(e.target.value); setPaginaActual(1) }}
                    >
                        <option value="">Todas las líneas</option>
                        {linea && !lineas.includes(linea) && <option value={linea}>{linea}</option>}
                        {lineas.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <select
                        className="ai-select-categoria"
                        aria-label="Estado"
                        value={estado}
                        onChange={e => { setEstado(e.target.value); setPaginaActual(1) }}
                    >
                        <option value="">Todos los estados</option>
                        {opcionesEstado.map(o => <option key={o.clave} value={o.clave}>{o.texto} ({numero(o.n)})</option>)}
                    </select>
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
                        emptyMessage={cargando || cargandoCajas ? 'Consultando información...'
                            : porFecha === 'RECEPCION' ? 'No hay cajas auditadas de lo recibido en el periodo.' : 'No hay cajas auditadas en el periodo.'}
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
