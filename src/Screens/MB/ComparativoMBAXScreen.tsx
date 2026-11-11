import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { RefreshCw, Scale, Search } from 'lucide-react'
import { WMSMBApi } from '../../api/WMSMBApi'
import { ComparativoMBAX, EstadoComparativo } from '../../interfaces/MB/MBInterface'
import { HeaderGenerico, TablaGenerica, ColumnConfig } from '../../Components'
import { IcoDownload, IcoX, Spinner } from '../../Components/icons'
// @ts-ignore
import '../../Styles/TemplateGenericoScreen.css'
// @ts-ignore
import './MB.css'

const FILAS_POR_PAGINA = 20

type Seccion = 'disponible' | 'despacho'
type FiltroEstado = 'TODOS' | 'NO_CUADRA' | Exclude<EstadoComparativo, ''>

// Fila ya reducida a la seccion activa
interface FilaSeccion {
    articulo: string
    descripcion: string
    talla: string
    color: string
    nombreColor: string
    mb: number
    cajas: number
    ax: number
    diferencia: number
    estado: Exclude<EstadoComparativo, ''>
}

const SECCIONES: Record<Seccion, { titulo: string; desc: string; mb: string; ax: string }> = {
    disponible: {
        titulo: 'Disponible',
        desc: 'Unidades MB en cajas sin despacho contra el disponible físico de AX (almacén 22, ubicación MB-CAJAS).',
        mb: 'MB sin despacho',
        ax: 'AX disponible',
    },
    despacho: {
        titulo: 'En despacho / En pedido',
        desc: 'Unidades MB en despachos no enviados (con packing pendiente) contra lo que está en pedido en AX (almacén 22, ubicación MB-CAJAS). Los despachos con packing completo se toman como enviados y no cuentan.',
        mb: 'MB en despacho',
        ax: 'AX en pedido',
    },
}

const ESTADOS: { valor: Exclude<EstadoComparativo, ''>; etiqueta: string; clase: string; ayuda: string }[] = [
    { valor: 'CUADRA', etiqueta: 'Cuadra', clase: 'mb-badge--cuadra', ayuda: 'MB y AX tienen la misma cantidad' },
    { valor: 'DIFERENCIA', etiqueta: 'Diferencia', clase: 'mb-badge--diferencia', ayuda: 'Existe en ambos con cantidad distinta' },
    { valor: 'SOLO MB', etiqueta: 'Solo en MB', clase: 'mb-badge--solomb', ayuda: 'Está en la base MB pero no en AX' },
    { valor: 'SOLO AX', etiqueta: 'Solo en AX', clase: 'mb-badge--soloax', ayuda: 'Está en AX pero no en la base MB' },
]

const numero = (v: number) => v.toLocaleString('es-HN')
const conSigno = (v: number) => (v > 0 ? `+${numero(v)}` : numero(v))

const BadgeEstado = ({ estado }: { estado: Exclude<EstadoComparativo, ''> }) => {
    const e = ESTADOS.find(x => x.valor === estado)
    return <span className={`mb-badge ${e?.clase ?? 'mb-badge--gris'}`} title={e?.ayuda}>{e?.etiqueta ?? estado}</span>
}

// Reduce cada fila a los datos de la seccion; sin estado = ambos lados en 0 (no aplica)
const aSeccion = (filas: ComparativoMBAX[], seccion: Seccion): FilaSeccion[] => {
    const resultado: FilaSeccion[] = []
    filas.forEach(f => {
        const d = seccion === 'disponible'
            ? { mb: f.mbSinDespacho, cajas: f.cajasSinDespacho, ax: f.axDisponible, diferencia: f.diferenciaDisponible, estado: f.estadoDisponible }
            : { mb: f.mbEnDespacho, cajas: f.cajasEnDespacho, ax: f.axEnPedido, diferencia: f.diferenciaDespacho, estado: f.estadoDespacho }
        if (d.estado === '') return
        resultado.push({
            articulo: f.articulo, descripcion: f.descripcion, talla: f.talla, color: f.color, nombreColor: f.nombreColor,
            ...d, estado: d.estado,
        })
    })
    return resultado
}

const ComparativoMBAXScreen = () => {
    const [datos, setDatos] = useState<ComparativoMBAX[]>([])
    const [cargando, setCargando] = useState(false)
    const [consultado, setConsultado] = useState(false)
    const [mensaje, setMensaje] = useState<string | null>(null)
    const [articulo, setArticulo] = useState('')
    const [seccion, setSeccion] = useState<Seccion>('disponible')
    const [estado, setEstado] = useState<FiltroEstado>('TODOS')
    const [busqueda, setBusqueda] = useState('')
    const [paginaActual, setPaginaActual] = useState(1)
    const consultaActual = useRef(0)

    const getData = async () => {
        const consulta = ++consultaActual.current
        setCargando(true)
        setMensaje(null)
        try {
            const r = await WMSMBApi.getComparativoAX(articulo.trim())
            if (consulta !== consultaActual.current) return
            setDatos(r.data)
            setConsultado(true)
            setPaginaActual(1)
        } catch (err: any) {
            if (consulta !== consultaActual.current) return
            console.log(err)
            setMensaje(typeof err.response?.data === 'string' ? err.response.data : 'Error al conectar con el servidor.')
        }
        setCargando(false)
    }

    useEffect(() => { getData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const filasSeccion = useMemo(() => aSeccion(datos, seccion), [datos, seccion])

    const resumen = useMemo(() => {
        const r = { mb: 0, ax: 0, cajas: 0, conteo: {} as Record<string, number>, unidades: {} as Record<string, number> }
        filasSeccion.forEach(f => {
            r.mb += f.mb
            r.ax += f.ax
            r.cajas += f.cajas
            r.conteo[f.estado] = (r.conteo[f.estado] ?? 0) + 1
            r.unidades[f.estado] = (r.unidades[f.estado] ?? 0) + Math.abs(f.diferencia)
        })
        return r
    }, [filasSeccion])

    const filasFiltradas = useMemo(() => {
        const texto = busqueda.trim().toLowerCase()
        return filasSeccion.filter(f =>
            (estado === 'TODOS' || (estado === 'NO_CUADRA' ? f.estado !== 'CUADRA' : f.estado === estado)) &&
            (!texto || `${f.articulo} ${f.descripcion} ${f.talla} ${f.color} ${f.nombreColor}`.toLowerCase().includes(texto)))
    }, [filasSeccion, estado, busqueda])

    useEffect(() => { setPaginaActual(1) }, [seccion, estado, busqueda])

    const totalPaginas = Math.max(1, Math.ceil(filasFiltradas.length / FILAS_POR_PAGINA))
    const pagina = filasFiltradas.slice((paginaActual - 1) * FILAS_POR_PAGINA, paginaActual * FILAS_POR_PAGINA)
    const cfg = SECCIONES[seccion]

    const columnas: ColumnConfig<FilaSeccion>[] = [
        { header: 'Artículo', render: f => <><span className="gen-td-id">{f.articulo}</span><span className="mb-sub">{f.descripcion}</span></> },
        { header: 'Color', render: f => <>{f.color}{f.nombreColor && <span className="mb-sub">{f.nombreColor}</span>}</> },
        { header: 'Talla', accessor: 'talla' },
        { header: cfg.mb, align: 'right', render: f => <>{numero(f.mb)}{f.cajas > 0 && <span className="mb-sub">{numero(f.cajas)} {f.cajas === 1 ? 'caja' : 'cajas'}</span>}</> },
        { header: cfg.ax, align: 'right', render: f => numero(f.ax) },
        {
            header: 'Diferencia (MB − AX)', align: 'right',
            render: f => <span className={f.diferencia > 0 ? 'mb-dif--pos' : f.diferencia < 0 ? 'mb-dif--neg' : ''}>{conSigno(f.diferencia)}</span>,
        },
        { header: 'Estado', render: f => <BadgeEstado estado={f.estado} /> },
    ]

    const handleExportar = () => {
        const hoja = (s: Seccion) => {
            const c = SECCIONES[s]
            return XLSX.utils.json_to_sheet(aSeccion(datos, s).map(f => ({
                'Artículo': f.articulo,
                'Descripción': f.descripcion,
                'Color': f.color,
                'Nombre color': f.nombreColor,
                'Talla': f.talla,
                [c.mb]: f.mb,
                'Cajas MB': f.cajas,
                [c.ax]: f.ax,
                'Diferencia (MB - AX)': f.diferencia,
                'Estado': ESTADOS.find(e => e.valor === f.estado)?.etiqueta ?? f.estado,
            })))
        }
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, hoja('disponible'), 'Disponible')
        XLSX.utils.book_append_sheet(wb, hoja('despacho'), 'En despacho - En pedido')
        const fecha = new Date().toISOString().slice(0, 10)
        XLSX.writeFile(wb, `Comparativo_MB_vs_AX_${fecha}.xlsx`)
    }

    const estadoHeader = cargando ? 'consultando' : datos.length > 0 ? 'datos' : consultado ? 'vacio' : undefined

    return (
        <div className="gen-page-root">
            <div className="gen-container">
                <HeaderGenerico
                    titulo="Comparativo MB vs AX"
                    subtitulo="Total por artículo, talla y color de la base MB contra AX (almacén 22, ubicación MB-CAJAS)."
                    icono={<Scale size={20} />}
                    estado={estadoHeader}
                />

                {mensaje && (
                    <div className="mb-alerta mb-alerta--error">
                        <span>{mensaje}</span>
                        <button onClick={() => setMensaje(null)} aria-label="Cerrar"><IcoX /></button>
                    </div>
                )}

                <section className="gen-upload-card-header">
                    <form className="mb-filtros" onSubmit={e => { e.preventDefault(); getData() }}>
                        <div className="gen-filtro-grupo">
                            <label htmlFor="mb-articulo">Artículo (opcional)</label>
                            <input id="mb-articulo" value={articulo} onChange={e => setArticulo(e.target.value)} placeholder="Ej. 10 21 33 04 912" />
                        </div>
                        <button type="submit" className="gen-btn-submit" disabled={cargando}>
                            {cargando ? <Spinner size={15} /> : <RefreshCw size={15} />}
                            <span>{cargando ? 'Consultando…' : 'Consultar'}</span>
                        </button>
                        <button type="button" className="gen-btn-outline" onClick={handleExportar} disabled={cargando || datos.length === 0}>
                            <IcoDownload />
                            <span>Exportar</span>
                        </button>
                    </form>
                </section>

                <div className="mb-segmentado" role="tablist">
                    {(Object.keys(SECCIONES) as Seccion[]).map(s => (
                        <button key={s} role="tab" aria-selected={seccion === s}
                            className={seccion === s ? 'mb-segmentado--activo' : ''}
                            onClick={() => setSeccion(s)}>
                            {SECCIONES[s].titulo}
                        </button>
                    ))}
                </div>
                <p className="mb-seccion-desc">{cfg.desc}</p>

                <div className="mb-kpis">
                    <div className="mb-kpi">
                        <span className="mb-kpi__label">{cfg.mb}</span>
                        <span className="mb-kpi__valor">{numero(resumen.mb)}</span>
                        <span className="mb-kpi__nota">{numero(resumen.cajas)} cajas</span>
                    </div>
                    <div className="mb-kpi">
                        <span className="mb-kpi__label">{cfg.ax}</span>
                        <span className="mb-kpi__valor">{numero(resumen.ax)}</span>
                        <span className="mb-kpi__nota">unidades</span>
                    </div>
                    <div className="mb-kpi">
                        <span className="mb-kpi__label">Diferencia neta</span>
                        <span className={`mb-kpi__valor ${resumen.mb - resumen.ax > 0 ? 'mb-dif--pos' : resumen.mb - resumen.ax < 0 ? 'mb-dif--neg' : ''}`}>
                            {conSigno(resumen.mb - resumen.ax)}
                        </span>
                        <span className="mb-kpi__nota">MB − AX</span>
                    </div>
                    {ESTADOS.map(e => (
                        <button key={e.valor} type="button" title={`${e.ayuda}. Clic para filtrar.`}
                            className={`mb-kpi ${estado === e.valor ? 'mb-kpi--activo' : ''}`}
                            onClick={() => setEstado(estado === e.valor ? 'TODOS' : e.valor)}>
                            <span className="mb-kpi__label">{e.etiqueta}</span>
                            <span className="mb-kpi__valor">{numero(resumen.conteo[e.valor] ?? 0)}</span>
                            <span className="mb-kpi__nota">
                                {e.valor === 'CUADRA' ? 'artículo-talla-color' : `${numero(resumen.unidades[e.valor] ?? 0)} uds de diferencia`}
                            </span>
                        </button>
                    ))}
                </div>

                <section className="gen-upload-card-header">
                    <div className="mb-filtros">
                        <div className="gen-filtro-grupo">
                            <label htmlFor="mb-estado">Estado</label>
                            <select id="mb-estado" value={estado} onChange={e => setEstado(e.target.value as FiltroEstado)}>
                                <option value="TODOS">Todos</option>
                                <option value="NO_CUADRA">Todo lo que no cuadra</option>
                                {ESTADOS.map(e => <option key={e.valor} value={e.valor}>{e.etiqueta}</option>)}
                            </select>
                        </div>
                        <div className="gen-filtro-grupo">
                            <label htmlFor="mb-busqueda">Buscar en resultados</label>
                            <div className="gen-search-input-group">
                                <input id="mb-busqueda" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Artículo, descripción, color o talla" />
                            </div>
                        </div>
                        <span className="mb-nota"><Search size={12} /> {numero(filasFiltradas.length)} de {numero(filasSeccion.length)} filas</span>
                    </div>
                </section>

                <TablaGenerica
                    columns={columnas}
                    data={pagina}
                    keyExtractor={f => `${f.articulo}|${f.color}|${f.talla}`}
                    paginaActual={paginaActual}
                    totalPaginas={totalPaginas}
                    totalRegistros={filasFiltradas.length}
                    onPaginaChange={setPaginaActual}
                    emptyMessage={cargando ? 'Consultando…' : 'No hay artículos para este filtro.'}
                />
            </div>
        </div>
    )
}

export default ComparativoMBAXScreen
