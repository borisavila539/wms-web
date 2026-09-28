import React, { useEffect, useMemo, useState } from 'react'
import { WmSApi } from '../../api/WMSapi'
import {
    ImpresionEtiquetaPrecio,
    ImpresionPreciosBusquedaForm,
    initialImpresionPreciosBusqueda,
    ImpresionPreciosSeleccionRequest,
    LineaImpresionPrecioSeleccionada,
} from '../../interfaces/GeneracionPrecioCodigos/GeneracionPrecioCodigoInterface';
import { ImpresorasInterface } from '../../interfaces/ImpresorasInterface';
import { ConfiguracionPrecioApi } from '../../api/ConfiguracionPrecioApi';
import { HeaderGenerico } from '../../Components';
import { FiltrosGenericos, FiltroCampoTexto, FiltroCampoSelect } from '../../Components/FiltrosGenericos';
//@ts-ignore
import '../../Styles/TemplateGenericoScreen.css';
//@ts-ignore
import './ImpresionEtiquetaPreciosScreen.css';

// Identifica una fila de forma estable ya que el backend no expone un id único por línea.
const rowKey = (r: ImpresionEtiquetaPrecio) => `${r.codigoBarra}__${r.imiB_BOXCODE}`;

const FILAS_POR_PAGINA = 20;

const CAMPOS_TEXTO_FILTRO: FiltroCampoTexto[] = [
    { key: 'articulo', label: 'Código Artículo', placeholder: 'Filtrar artículo...' },
    { key: 'talla', label: 'Talla', placeholder: 'Filtrar talla...' },
    { key: 'idColor', label: 'Color', placeholder: 'Filtrar color...' },
    { key: 'imiB_BOXCODE', label: 'Caja', placeholder: 'Filtrar caja...' },
];

// Lista de meses para construir el valor MAA/MMAA (mes + últimos 2 dígitos del año).
// El mes NO se rellena con cero a la izquierda: enero es "1", no "01" (así lo imprimen en la etiqueta).
const MESES = [
    { mm: '1', nombre: 'Enero' },
    { mm: '2', nombre: 'Febrero' },
    { mm: '3', nombre: 'Marzo' },
    { mm: '4', nombre: 'Abril' },
    { mm: '5', nombre: 'Mayo' },
    { mm: '6', nombre: 'Junio' },
    { mm: '7', nombre: 'Julio' },
    { mm: '8', nombre: 'Agosto' },
    { mm: '9', nombre: 'Septiembre' },
    { mm: '10', nombre: 'Octubre' },
    { mm: '11', nombre: 'Noviembre' },
    { mm: '12', nombre: 'Diciembre' },
];

const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS_DISPONIBLES = [ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1];

const CAMPOS_SELECT_FILTRO: FiltroCampoSelect[] = [
    {
        key: 'estado',
        label: 'Estado',
        opciones: [
            { value: 'TODOS', label: 'Todos' },
            { value: 'LISTO', label: 'Listo' },
            { value: 'PENDIENTE', label: 'Requiere confirmación' },
        ],
    },
];

const IcoPrint = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
    </svg>
);

const ImpresionEtiquetaPreciosScreen = () => {
    const [data, setData] = useState<ImpresionEtiquetaPrecio[]>([])
    const [cargando, setCargando] = useState<boolean>(false)
    const [imprimiendo, setImprimiendo] = useState<boolean>(false)
    const [busqueda, setBusqueda] = useState<ImpresionPreciosBusquedaForm>(initialImpresionPreciosBusqueda);
    const [impresoras, setImpresoras] = useState<ImpresorasInterface[]>([])
    const [impresora, setImpresora] = useState<string>('')
    const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'success'; texto: string } | null>(null)
    const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
    const [errorFecha, setErrorFecha] = useState<string | undefined>(undefined)
    const [anioFecha, setAnioFecha] = useState<number>(ANIO_ACTUAL)
    // Mes elegido (sin cero a la izquierda), guardado aparte porque no se puede
    // recuperar de forma fiable recortando caracteres de busqueda.fecha (largo variable).
    const [mesFecha, setMesFecha] = useState<string>('')

    // Filtros de refinamiento (sobre los datos ya consultados)
    const [valoresTexto, setValoresTexto] = useState<Record<string, string>>({});
    const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

    // Paginación
    const [paginaActual, setPaginaActual] = useState<number>(1);

    const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBusqueda(prev => ({ ...prev, [name]: value }));
    };

    // Cambia el año de referencia; si ya había un mes elegido, recalcula la fecha con el nuevo año.
    const handleAnioFechaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nuevoAnio = Number(e.target.value);
        setAnioFecha(nuevoAnio);
        if (errorFecha) setErrorFecha(undefined);
        if (!mesFecha) return;
        const aa = String(nuevoAnio).slice(-2);
        setBusqueda(prev => ({ ...prev, fecha: mesFecha + aa }));
    };

    // Selecciona el mes (sin cero a la izquierda) y arma la fecha con el año actualmente elegido.
    const handleMesFechaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const mm = e.target.value;
        setMesFecha(mm);
        if (errorFecha) setErrorFecha(undefined);
        const aa = String(anioFecha).slice(-2);
        setBusqueda(prev => ({ ...prev, fecha: mm ? mm + aa : '' }));
    };

    const getImpresoras = async () => {
        try {
            await WmSApi.get<ImpresorasInterface[]>('Impresoras').then(resp => {
                setImpresoras(resp.data)
                if (resp.data.length > 0) setImpresora(resp.data[0].iM_IPPRINTER)
            })
        } catch (err) {
            console.log(err)
        }
    }

    const getData = async () => {
        setCargando(true)
        setMensaje(null)
        try {
            await ConfiguracionPrecioApi.GetPrecioCodigos(busqueda)
                .then(resp => {
                    setData(resp.data)
                    setSeleccionados(new Set())
                    setPaginaActual(1)
                })
        } catch (err) {
            console.log(err)
            setMensaje({ tipo: 'error', texto: 'Ocurrió un error al consultar la información.' })
        }
        setCargando(false)
    }

    const Limpiar = () => {
        setBusqueda(initialImpresionPreciosBusqueda);
        setValoresTexto({});
        setFiltroEstado('TODOS');
        setData([]);
        setSeleccionados(new Set());
        setMensaje(null);
        setErrorFecha(undefined);
        setAnioFecha(ANIO_ACTUAL);
        setMesFecha('');
        setPaginaActual(1);
    }

    // ── Filtros de refinamiento (cliente) ──────────────────────────────────────
    const hayFiltrosActivos = useMemo(
        () => Object.values(valoresTexto).some(v => (v ?? '').trim() !== '') || filtroEstado !== 'TODOS',
        [valoresTexto, filtroEstado]
    );

    const datosFiltrados = useMemo(() => data.filter(item => {
        if (filtroEstado === 'LISTO' && item.requiereConfirmacion) return false;
        if (filtroEstado === 'PENDIENTE' && !item.requiereConfirmacion) return false;

        for (const campo of CAMPOS_TEXTO_FILTRO) {
            const val = valoresTexto[campo.key];
            if (val && val.trim() !== '') {
                const itemValor = String((item as any)[campo.key] ?? '').toLowerCase();
                if (!itemValor.includes(val.toLowerCase().trim())) return false;
            }
        }
        return true;
    }), [data, valoresTexto, filtroEstado]);

    const handleLimpiarFiltros = () => { setValoresTexto({}); setFiltroEstado('TODOS'); setPaginaActual(1); }

    // ── Paginación ────────────────────────────────────────────────────────────
    const totalPaginas = Math.max(1, Math.ceil(datosFiltrados.length / FILAS_POR_PAGINA));
    const paginaSegura = Math.min(paginaActual, totalPaginas);
    const datosPaginados = useMemo(() => {
        const inicio = (paginaSegura - 1) * FILAS_POR_PAGINA;
        return datosFiltrados.slice(inicio, inicio + FILAS_POR_PAGINA);
    }, [datosFiltrados, paginaSegura]);

    // ── Selección de líneas para imprimir ────────────────────────────────────────
    const esSeleccionable = (item: ImpresionEtiquetaPrecio) => !item.requiereConfirmacion && item.precio > 0;

    const handleToggleSeleccion = (item: ImpresionEtiquetaPrecio) => {
        if (!esSeleccionable(item)) return;
        const key = rowKey(item);
        setSeleccionados(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const seleccionablesFiltrados = useMemo(
        () => datosFiltrados.filter(esSeleccionable),
        [datosFiltrados]
    );

    const todoSeleccionado = seleccionablesFiltrados.length > 0 &&
        seleccionablesFiltrados.every(item => seleccionados.has(rowKey(item)));

    const handleSeleccionarTodos = (checked: boolean) => {
        setSeleccionados(prev => {
            const next = new Set(prev);
            seleccionablesFiltrados.forEach(item => {
                const key = rowKey(item);
                if (checked) next.add(key); else next.delete(key);
            });
            return next;
        });
    };

    const lineasSeleccionadas: LineaImpresionPrecioSeleccionada[] = useMemo(() => {
        return data.filter(item => esSeleccionable(item) && seleccionados.has(rowKey(item)));
    }, [data, seleccionados]);

    // ── Impresión ─────────────────────────────────────────────────────────────
    // Imprime únicamente las líneas seleccionadas por el usuario (no vuelve a consultar la BD).
    const imprimir = async () => {
        if (lineasSeleccionadas.length === 0) return;

        const fecha = busqueda.fecha.trim();
        if (!/^\d{3,4}$/.test(fecha)) {
            setErrorFecha('Selecciona el mes antes de imprimir.');
            setMensaje({ tipo: 'error', texto: 'Selecciona el mes de la fecha antes de imprimir.' });
            return;
        }

        setImprimiendo(true)
        setMensaje(null)
        try {
            const payload: ImpresionPreciosSeleccionRequest = {
                impresora,
                fecha: busqueda.fecha,
                lineas: lineasSeleccionadas,
            };
            await ConfiguracionPrecioApi.ImpresionPrecioCodigosSeleccionados(payload)
                .then(resp => {
                    if (resp.data !== "OK") {
                        setMensaje({ tipo: 'error', texto: resp.data })
                    } else {
                        setMensaje({ tipo: 'success', texto: `Se enviaron ${lineasSeleccionadas.length} línea(s) a imprimir.` })
                        setSeleccionados(new Set())
                    }
                })
        } catch (err) {
            console.log(err)
            setMensaje({ tipo: 'error', texto: 'Ocurrió un error al imprimir las etiquetas seleccionadas.' })
        }
        setImprimiendo(false)
    }

    useEffect(() => {
        getImpresoras()
    }, [])

    return (
        <div className="gen-page-root">
            <div className="gen-container">
                <HeaderGenerico
                    titulo="Impresión de Etiquetas de Precio"
                    subtitulo="Consulta por pedido, ruta, caja o fecha y selecciona qué líneas imprimir"
                    estado={cargando ? 'consultando' : data.length > 0 ? 'datos' : 'vacio'}
                />

                {mensaje && (
                    <div className={`iep-mensaje iep-mensaje--${mensaje.tipo}`}>
                        <span>{mensaje.texto}</span>
                        <button className="iep-mensaje-cerrar" onClick={() => setMensaje(null)}>×</button>
                    </div>
                )}

                {/* ── Búsqueda ── */}
                <section className="gen-upload-card-header">
                    <div className="gen-header-action-bar">
                        <div className="gen-filtro-grupo">
                            <label htmlFor="pedido">Pedido</label>
                            <input
                                type="text"
                                id="pedido"
                                name="pedido"
                                value={busqueda.pedido}
                                onChange={handleBusquedaChange}
                            />
                        </div>

                        <div className="gen-filtro-grupo">
                            <label htmlFor="ruta">Ruta</label>
                            <input
                                type="text"
                                id="ruta"
                                name="ruta"
                                value={busqueda.ruta}
                                onChange={handleBusquedaChange}
                            />
                        </div>

                        <div className="gen-filtro-grupo">
                            <label htmlFor="caja">Caja</label>
                            <input
                                type="text"
                                id="caja"
                                name="caja"
                                value={busqueda.caja}
                                onChange={handleBusquedaChange}
                            />
                        </div>

                        <div className="gen-filtro-grupo">
                            <label htmlFor="anioFecha">Año</label>
                            <select id="anioFecha" name="anioFecha" value={anioFecha} onChange={handleAnioFechaChange}>
                                {ANIOS_DISPONIBLES.map(anio => (
                                    <option key={anio} value={anio}>{anio}</option>
                                ))}
                            </select>
                        </div>

                        <div className="gen-filtro-grupo">
                            <label htmlFor="fecha">Fecha (Mes)<span style={{ color: '#dc2626' }}>*</span></label>
                            <select
                                id="fecha"
                                name="fecha"
                                className={errorFecha ? 'gen-input-error' : ''}
                                value={mesFecha}
                                onChange={handleMesFechaChange}
                            >
                                <option value="">Selecciona mes...</option>
                                {MESES.map(mes => (
                                    <option key={mes.mm} value={mes.mm}>{mes.nombre} {anioFecha}</option>
                                ))}
                            </select>
                            {errorFecha && <span className="gen-campo-error">{errorFecha}</span>}
                        </div>

                        <button
                            className="gen-btn-submit"
                            onClick={getData}
                            disabled={cargando}
                        >
                            {cargando ? 'Buscando...' : 'Buscar'}
                        </button>

                        <button
                            className="gen-btn-outline"
                            onClick={Limpiar}
                            disabled={cargando}
                        >
                            Limpiar
                        </button>

                        <div className="gen-action-spacer" />

                        <div className="gen-filtro-grupo">
                            <label htmlFor="impresora">Impresora</label>
                            <select name="impresora" id="impresora" value={impresora} onChange={e => setImpresora(e.target.value)}>
                                {impresoras.map((imp) => (
                                    <option key={imp.iM_IPPRINTER} value={imp.iM_IPPRINTER}>
                                        {imp.iM_DESCRIPTION_PRINTER}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            className="gen-btn-submit iep-btn-imprimir"
                            onClick={imprimir}
                            disabled={imprimiendo || lineasSeleccionadas.length === 0 || !busqueda.fecha.trim()}
                            title={
                                lineasSeleccionadas.length === 0 ? 'Selecciona al menos una línea para imprimir' :
                                !busqueda.fecha.trim() ? 'Ingresa la fecha (MMAA) antes de imprimir' : undefined
                            }
                        >
                            <IcoPrint />
                            <span>{imprimiendo ? 'Imprimiendo...' : `Imprimir (${lineasSeleccionadas.length})`}</span>
                        </button>
                    </div>
                </section>

                {/* ── Filtros de refinamiento ── */}
                {data.length > 0 && (
                    <FiltrosGenericos
                        camposTexto={CAMPOS_TEXTO_FILTRO}
                        camposSelect={CAMPOS_SELECT_FILTRO}
                        valoresTexto={valoresTexto}
                        valoresNum={{}}
                        valoresSelect={{ estado: filtroEstado }}
                        onTextoChange={(key, valor) => { setValoresTexto(prev => ({ ...prev, [key]: valor })); setPaginaActual(1); }}
                        onNumChange={() => { }}
                        onSelectChange={(key, valor) => { if (key === 'estado') setFiltroEstado(valor); setPaginaActual(1); }}
                        onLimpiar={handleLimpiarFiltros}
                        hayFiltrosActivos={hayFiltrosActivos}
                    />
                )}

                {/* ── Tabla ── */}
                <div className="gen-table-container">
                    <div className="gen-table-wrapper">
                        <table className="gen-data-table">
                            <thead>
                                <tr>
                                    <th className="gen-col-acciones">
                                        <input
                                            type="checkbox"
                                            checked={todoSeleccionado}
                                            onChange={(e) => handleSeleccionarTodos(e.target.checked)}
                                            disabled={seleccionablesFiltrados.length === 0}
                                        />
                                    </th>
                                    <th>Estado</th>
                                    <th>Cliente</th>
                                    <th>Caja</th>
                                    <th>Código Barra</th>
                                    <th>Artículo</th>
                                    <th>Descripción</th>
                                    <th>Estilo</th>
                                    <th>Talla</th>
                                    <th>Color</th>
                                    <th className="gen-col-num">Precio</th>
                                    <th className="gen-col-num">Cantidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando ? (
                                    <tr>
                                        <td colSpan={12} className="gen-empty-row">Consultando información...</td>
                                    </tr>
                                ) : datosPaginados.length > 0 ? (
                                    datosPaginados.map(item => {
                                        const key = rowKey(item);
                                        const seleccionable = esSeleccionable(item);
                                        const isSelected = seleccionados.has(key);
                                        return (
                                            <tr
                                                key={key}
                                                className={
                                                    !seleccionable ? 'iep-row-pendiente' : isSelected ? 'gen-row-selected' : ''
                                                }
                                            >
                                                <td className="gen-col-acciones">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        disabled={!seleccionable}
                                                        onChange={() => handleToggleSeleccion(item)}
                                                        title={
                                                            item.requiereConfirmacion ? 'Requiere confirmación antes de poder imprimirse' :
                                                            item.precio <= 0 ? 'No se puede imprimir: el artículo no tiene precio' :
                                                            undefined
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    {item.requiereConfirmacion ? (
                                                        <span className="iep-badge-estado iep-badge-estado--pendiente">Requiere confirmación</span>
                                                    ) : item.precio <= 0 ? (
                                                        <span className="iep-badge-estado iep-badge-estado--pendiente">Sin precio</span>
                                                    ) : (
                                                        <span className="iep-badge-estado iep-badge-estado--listo">Listo</span>
                                                    )}
                                                </td>
                                                <td>{item.nombre}</td>
                                                <td className="gen-td-id">{item.imiB_BOXCODE}</td>
                                                <td>{item.codigoBarra}</td>
                                                <td>{item.articulo}</td>
                                                <td>{item.descripcion}</td>
                                                <td>{item.estilo}</td>
                                                <td>{item.talla}</td>
                                                <td>{item.idColor}</td>
                                                <td className="gen-col-num">
                                                    {item.requiereConfirmacion ? (
                                                        <span className="iep-precio-pendiente">Pendiente</span>
                                                    ) : item.precio <= 0 ? (
                                                        <span className="iep-precio-pendiente">Sin precio</span>
                                                    ) : (
                                                        item.precio.toFixed(2)
                                                    )}
                                                </td>
                                                <td className="gen-col-num">{item.qty}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={12} className="gen-empty-row">
                                            {data.length > 0
                                                ? 'No se encontraron registros que coincidan con los filtros aplicados.'
                                                : 'No hay registros para mostrar. Ingresa pedido, ruta, caja o fecha para consultar.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <footer className="gen-footer">
                        <div className="gen-footer-resumen">
                            <div className="gen-resumen-item">
                                <span className="gen-resumen-label">Mostrando</span>
                                <span className="gen-resumen-valor">{datosFiltrados.length} de {data.length}</span>
                            </div>
                            <div className="gen-resumen-item">
                                <span className="gen-resumen-label">Seleccionados</span>
                                <span className="gen-resumen-valor">{lineasSeleccionadas.length}</span>
                            </div>
                            <div className="gen-resumen-item">
                                <span className="gen-resumen-label">Requieren confirmación</span>
                                <span className="gen-resumen-valor">{data.filter(d => d.requiereConfirmacion).length}</span>
                            </div>
                        </div>

                        <div className="gen-footer-paginacion">
                            <button
                                className="gen-btn-paginacion"
                                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                                disabled={paginaSegura <= 1}
                            >
                                ← Anterior
                            </button>
                            <span className="gen-paginacion-info">
                                Página {paginaSegura} de {totalPaginas}
                            </span>
                            <button
                                className="gen-btn-paginacion"
                                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                                disabled={paginaSegura >= totalPaginas}
                            >
                                Siguiente →
                            </button>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    )
}

export default ImpresionEtiquetaPreciosScreen;
