import React, { useContext, useMemo, useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { WMSContext } from '../../Context/WMSContext';
import { GeneracionPrecioCodigoInterface } from '../../interfaces/GeneracionPrecioCodigos/GeneracionPrecioCodigoInterface';
import { HeaderGenerico } from '../../Components';
import { FiltrosGenericos, FiltroCampoTexto, FiltroCampoSelect } from '../../Components/FiltrosGenericos';
//@ts-ignore
import '../../Styles/TemplateGenericoScreen.css';
//@ts-ignore
import './GeneracionCodigosPreciosScreen.css';
import { ConfiguracionPrecioApi } from '../../api/ConfiguracionPrecioApi';

const ITEMS_POR_PAGINA = 10;

const LABEL_COLECCION: Record<string, string> = { B: 'BODEGA', F: 'FUTURO' };
const formatColeccion = (valor: string) => LABEL_COLECCION[valor?.toUpperCase()] ?? valor;

const CAMPOS_TEXTO_FILTRO: FiltroCampoTexto[] = [
    { key: 'pedidoVenta', label: 'Pedido', placeholder: 'Filtrar pedido...' },
    { key: 'articulo', label: 'Artículo', placeholder: 'Filtrar artículo...' },
    { key: 'base', label: 'Base', placeholder: 'Filtrar base...' },
    { key: 'idColor', label: 'ID Color', placeholder: 'Filtrar color...' },
    { key: 'talla', label: 'Talla', placeholder: 'Filtrar talla...' },
];

const CAMPOS_SELECT_FILTRO: FiltroCampoSelect[] = [
    {
        key: 'irregularidad',
        label: 'Estado Irregularidad',
        opciones: [
            { value: 'TODOS', label: 'Todos' },
            { value: 'SI', label: 'Solo Irregulares' },
            { value: 'NO', label: 'Solo Normales' },
        ],
    },
];

export const GeneracionCodigosPreciosScreen = () => {
    const { WMSState } = useContext(WMSContext);

    const [data, setData] = useState<GeneracionPrecioCodigoInterface[]>([]);
    const [cargando, setCargando] = useState<boolean>(false);
    const [buscandoConfigurado, setBuscandoConfigurado] = useState<boolean>(false);
    const [confirmando, setConfirmando] = useState<boolean>(false);
    const [confirmandoLineaId, setConfirmandoLineaId] = useState<number | null>(null);

    const [pais, setPais] = useState<string>('');
    const [pedidoVenta, setPedidoVenta] = useState<string>('');
    const [erroresBusqueda, setErroresBusqueda] = useState<{ pedidoVenta?: string; pais?: string }>({});

    // Selección de filas (por id, único y estable, no por posición en un arreglo)
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Paginación
    const [paginaActual, setPaginaActual] = useState<number>(1);

    // Estados para FiltrosGenericos
    const [valoresTexto, setValoresTexto] = useState<Record<string, string>>({});
    const [valoresNum, setValoresNum] = useState<Record<string, string>>({});
    const [filtroIrregular, setFiltroIrregular] = useState<string>('TODOS');

    const getData = async () => {
        const errores: { pedidoVenta?: string; pais?: string } = {};
        if (!pedidoVenta.trim()) errores.pedidoVenta = 'El campo Pedido es obligatorio.';
        if (!pais.trim()) errores.pais = 'El campo País es obligatorio.';
        setErroresBusqueda(errores);
        if (errores.pedidoVenta || errores.pais) return;

        setCargando(true);
        try {
            const resp = await ConfiguracionPrecioApi.ObtenerDetalleGeneracionPrecios(pedidoVenta, pais);
            console.log(resp)
            setData(resp.data);
            setSelectedIds(new Set());
            setPaginaActual(1);
        } catch (err) {
            console.error('Error al obtener datos:', err);
        } finally {
            setCargando(false);
        }
    };

    // Busca un pedido cuyo precio ya fue generado/confirmado previamente (no vuelve a generarlo)
    const buscarPedidoConfigurado = async () => {
        if (!pedidoVenta) return;
        setBuscandoConfigurado(true);
        try {
            const resp = await ConfiguracionPrecioApi.ObtenerPedidoConPrecioConfigurado(pedidoVenta);
            setData(resp.data);
            setSelectedIds(new Set());
            setPaginaActual(1);
        } catch (err) {
            console.error('Error al buscar el pedido configurado:', err);
            alert('No se pudo encontrar el pedido configurado.');
        } finally {
            setBuscandoConfigurado(false);
        }
    };

    // Manejadores de Filtros
    const handleTextoChange = (key: string, valor: string) => {
        setValoresTexto(prev => ({ ...prev, [key]: valor }));
        setPaginaActual(1);
    };

    const handleNumChange = (key: string, valor: string) => {
        setValoresNum(prev => ({ ...prev, [key]: valor }));
        setPaginaActual(1);
    };

    const handleSelectChange = (key: string, valor: string) => {
        if (key === 'irregularidad') {
            setFiltroIrregular(valor);
        }
        setPaginaActual(1);
    };

    const handleLimpiarFiltros = () => {
        setValoresTexto({});
        setValoresNum({});
        setFiltroIrregular('TODOS');
        setPaginaActual(1);
    };

    const hayFiltrosActivos = useMemo(() => {
        const tieneTexto = Object.values(valoresTexto).some(val => val.trim() !== '');
        const tieneNum = Object.values(valoresNum).some(val => val.trim() !== '');
        const tieneIrregular = filtroIrregular !== 'TODOS';
        return tieneTexto || tieneNum || tieneIrregular;
    }, [valoresTexto, valoresNum, filtroIrregular]);

    const datosFiltrados = useMemo(() => {
        return data.filter(item => {
            if (filtroIrregular === 'SI' && !item.tieneIrregularidad) return false;
            if (filtroIrregular === 'NO' && item.tieneIrregularidad) return false;

            for (const [key, val] of Object.entries(valoresTexto)) {
                if (val && val.trim() !== '') {
                    const itemValor = String((item as any)[key] || '').toLowerCase();
                    if (!itemValor.includes(val.toLowerCase().trim())) {
                        return false;
                    }
                }
            }

            return true;
        });
    }, [data, valoresTexto, filtroIrregular]);

    const totalPaginas = Math.ceil(datosFiltrados.length / ITEMS_POR_PAGINA) || 1;
    const datosPaginados = useMemo(() => {
        const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
        return datosFiltrados.slice(inicio, inicio + ITEMS_POR_PAGINA);
    }, [datosFiltrados, paginaActual]);

    const handleToggleSelect = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(datosFiltrados.map(item => item.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleConfirmFila = async (item: GeneracionPrecioCodigoInterface) => {
        if (!WMSState.usuario) {
            alert('No se detectó un usuario en sesión. Vuelve a iniciar sesión e intenta de nuevo.');
            return;
        }

        setConfirmandoLineaId(item.id);
        try {
            const resp = await ConfiguracionPrecioApi.ConfirmarGeneracionPrecioLinea(item.id, WMSState.usuario);

            if (!resp.data.success) {
                alert(resp.data.message || 'No se pudo confirmar la línea.');
                return;
            }

            setData(prev => prev.map(row =>
                row.id === item.id ? { ...row, confirmado: true } : row
            ));
        } catch (err) {
            console.error('Error al confirmar fila:', err);
            alert('Ocurrió un error al confirmar la línea.');
        } finally {
            setConfirmandoLineaId(null);
        }
    };

    const handleConfirmarSeleccionados = async () => {
        if (selectedIds.size === 0) return;

        if (!WMSState.usuario) {
            alert('No se detectó un usuario en sesión. Vuelve a iniciar sesión e intenta de nuevo.');
            return;
        }

        setConfirmando(true);

        const itemsAConfirmar = data.filter(item => selectedIds.has(item.id));
        const idsConfirmados = new Set<number>();
        const fallidos: string[] = [];

        for (const item of itemsAConfirmar) {
            try {
                const resp = await ConfiguracionPrecioApi.ConfirmarGeneracionPrecioLinea(item.id, WMSState.usuario);

                if (resp.data.success) {
                    idsConfirmados.add(item.id);
                } else {
                    fallidos.push(item.codigoBarra);
                }
            } catch (err) {
                console.error(`Error al confirmar la línea ${item.codigoBarra}:`, err);
                fallidos.push(item.codigoBarra);
            }
        }

        setData(prev => prev.map(row =>
            idsConfirmados.has(row.id) ? { ...row, confirmado: true } : row
        ));
        setSelectedIds(prev => {
            const restante = new Set(prev);
            idsConfirmados.forEach(id => restante.delete(id));
            return restante;
        });

        if (fallidos.length > 0) {
            alert(`No se pudieron confirmar ${fallidos.length} de ${itemsAConfirmar.length} línea(s): ${fallidos.join(', ')}`);
        }

        setConfirmando(false);
    };

    // Exportar a Excel con XLSX utilizando el contexto de la pantalla
    const handleDownloadDetalle = useCallback((rows?: GeneracionPrecioCodigoInterface[], filename?: string) => {
        try {
            // Detalle filtrado (según FiltrosGenericos) y además seleccionado (checkbox) por el usuario
            const dataToExport = rows ?? datosFiltrados.filter(item => selectedIds.has(item.id));

            if (!dataToExport || dataToExport.length === 0) {
                alert('No hay registros seleccionados para exportar.');
                return;
            }

            const payload = dataToExport.map(r => ({
                'Cuenta Cliente': r.cuentaCliente,
                'Pedido Venta': r.pedidoVenta,
                'Código Barra': r.codigoBarra,
                'Artículo': r.articulo,
                'Base': r.base,
                'Estilo': r.estilo,
                'ID Color': r.idColor,
                'Referencia': r.referencia,
                'Descripción': r.descripcion,
                'Color Descripción': r.colorDescripcion,
                'Talla': r.talla,
                'Descripción 2': r.descripcion2,
                'Categoría': r.categoria,
                'Cantidad': r.cantidad,
                'Costo AX': r.costoAX,
                'Costo Config.': r.costoConfiguracionPrecio,
                'Precio': r.precio,
                'Departamento': r.departamento,
                'SubCategoría': r.subCategoria,
                'Colección': formatColeccion(r.coleccion),
                'Tienda': r.deliveryName
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(payload);
            XLSX.utils.book_append_sheet(wb, ws, 'DetalleSeleccionado');

            const name = filename ?? `detalle_seleccionado_${pedidoVenta || 'pedido'}_${pais || 'pais'}_${Date.now()}.xlsx`;
            XLSX.writeFile(wb, name);
        } catch (err) {
            console.error('Error al exportar a Excel:', err);
            alert('Error al exportar los datos a Excel.');
        }
    }, [datosFiltrados, selectedIds, pedidoVenta, pais]);

    const todoSeleccionado = datosFiltrados.length > 0 && datosFiltrados.every(item => selectedIds.has(item.id));

    return (
        <div className="gen-page-root">
            <div className="gen-container">
                <HeaderGenerico
                    titulo="Plantilla Creación Artículo"
                    subtitulo="Gestión y generación de códigos con precios de venta"
                    estado={cargando ? 'procesando' : data.length > 0 ? 'datos' : 'vacio'}
                />

                <div className="gen-upload-card-header">
                    <div className="gen-header-action-bar">
                        <div className="gen-filtro-grupo">
                            <label htmlFor="pedido">Pedido</label>
                            <input
                                id="pedido"
                                type="text"
                                placeholder="Ej. PED-12345"
                                value={pedidoVenta}
                                className={erroresBusqueda.pedidoVenta ? 'gen-input-error' : ''}
                                onChange={(e) => {
                                    setPedidoVenta(e.target.value)
                                    if (erroresBusqueda.pedidoVenta) setErroresBusqueda(prev => ({ ...prev, pedidoVenta: undefined }))
                                }}
                            />
                            {erroresBusqueda.pedidoVenta && (
                                <span className="gen-campo-error">{erroresBusqueda.pedidoVenta}</span>
                            )}
                        </div>

                        <div className="gen-filtro-grupo">
                            <label htmlFor="pais">País</label>
                            <input
                                id="pais"
                                type="text"
                                placeholder="Ej. CR"
                                value={pais}
                                className={erroresBusqueda.pais ? 'gen-input-error' : ''}
                                onChange={(e) => {
                                    setPais(e.target.value)
                                    if (erroresBusqueda.pais) setErroresBusqueda(prev => ({ ...prev, pais: undefined }))
                                }}
                            />
                            {erroresBusqueda.pais && (
                                <span className="gen-campo-error">{erroresBusqueda.pais}</span>
                            )}
                        </div>

                        <button
                            className="gen-btn-submit"
                            onClick={getData}
                            disabled={cargando}
                            title="Genera/actualiza la confirmación de precios del pedido"
                        >
                            {cargando ? 'Generando...' : 'Generar Confirmación'}
                        </button>

                        <button
                            className="gen-btn-outline"
                            onClick={buscarPedidoConfigurado}
                            disabled={buscandoConfigurado || !pedidoVenta}
                            title="Busca un pedido cuyo precio ya fue configurado previamente"
                        >
                            {buscandoConfigurado ? 'Buscando...' : 'Buscar Configurado'}
                        </button>

                        <div className="gen-action-spacer" />

                        <button
                            className="gen-btn-submit gen-btn-confirm-selected"
                            onClick={handleConfirmarSeleccionados}
                            disabled={confirmando || selectedIds.size === 0}
                        >
                            {confirmando ? 'Confirmando...' : `Confirmar Seleccionados (${selectedIds.size})`}
                        </button>

                        <button
                            className="gen-btn-outline"
                            onClick={() => handleDownloadDetalle()}
                            disabled={selectedIds.size === 0}
                            title="Descarga el detalle filtrado de las filas seleccionadas"
                        >
                            Descargar Detalle Seleccionado
                        </button>
                    </div>
                </div>

                {data.length > 0 && (
                    <FiltrosGenericos
                        camposSelect={CAMPOS_SELECT_FILTRO}
                        camposTexto={CAMPOS_TEXTO_FILTRO}
                        valoresTexto={valoresTexto}
                        valoresNum={valoresNum}
                        valoresSelect={{ irregularidad: filtroIrregular }}
                        onTextoChange={handleTextoChange}
                        onNumChange={handleNumChange}
                        onSelectChange={handleSelectChange}
                        onLimpiar={handleLimpiarFiltros}
                        hayFiltrosActivos={hayFiltrosActivos}
                        abiertoPorDefecto
                    />
                )}

                <div className="gen-table-container">
                    <div className="gen-table-wrapper">
                        <table className="gen-data-table">
                            <thead>
                                <tr>
                                    <th className="gen-col-acciones">
                                        <input
                                            type="checkbox"
                                            checked={todoSeleccionado}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            disabled={datosFiltrados.length === 0}
                                        />
                                    </th>
                                    <th>Estado</th>
                                    <th>Cuenta Cliente</th>
                                    <th>Pedido Venta</th>
                                    <th>Código Barra</th>
                                    <th>Artículo</th>
                                    <th>Base</th>
                                    <th>Estilo</th>
                                    <th>ID Color</th>
                                    <th>Referencia</th>
                                    <th>Descripción</th>
                                    <th>Color Descripción</th>
                                    <th>Talla</th>
                                    <th>Descripción 2</th>
                                    <th>Categoría</th>
                                    <th className="gen-col-num">Cantidad</th>
                                    <th className="gen-col-num">Costo AX</th>
                                    <th className="gen-col-num">Costo Config.</th>
                                    <th className="gen-col-num">Precio</th>
                                    <th>Departamento</th>
                                    <th>SubCategoría</th>
                                    <th>Colección</th>
                                    <th style={{ textAlign: 'center' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datosPaginados.length > 0 ? (
                                    datosPaginados.map((item) => {
                                        const isSelected = selectedIds.has(item.id);

                                        return (
                                            <tr key={item.id} className={isSelected ? 'gen-row-selected' : ''}>
                                                <td className="gen-col-acciones">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleSelect(item.id)}
                                                    />
                                                </td>
                                                <td>
                                                    <span className={`gen-badge-status ${item.tieneIrregularidad ? 'irregular' : 'normal'}`}>
                                                        {item.tieneIrregularidad ? 'Irregular' : 'Normal'}
                                                    </span>
                                                </td>
                                                <td>{item.cuentaCliente}</td>
                                                <td>{item.pedidoVenta}</td>
                                                <td className="gen-td-id">{item.codigoBarra}</td>
                                                <td>{item.articulo}</td>
                                                <td>{item.base}</td>
                                                <td>{item.estilo}</td>
                                                <td>{item.idColor}</td>
                                                <td>{item.referencia}</td>
                                                <td>{item.descripcion}</td>
                                                <td>{item.colorDescripcion}</td>
                                                <td>{item.talla}</td>
                                                <td>{item.descripcion2}</td>
                                                <td>{item.categoria}</td>
                                                <td className="gen-col-num">{item.cantidad}</td>
                                                <td className="gen-col-num">
                                                    <span style={{ color: item.tieneIrregularidad ? '#dc2626' : 'inherit' }}>
                                                        {item.costoAX}
                                                    </span>
                                                </td>
                                                <td className="gen-col-num">
                                                    <span style={{ color: item.tieneIrregularidad ? '#dc2626' : 'inherit' }}>
                                                        {item.costoConfiguracionPrecio}
                                                    </span>
                                                </td>
                                                <td className="gen-col-num">
                                                    <span style={{ color: item.precio === 0 ? '#dc2626' : 'inherit', fontWeight: item.precio === 0 ? 'bold' : 'normal' }}>
                                                        {item.precio}
                                                    </span>
                                                </td>
                                                <td>{item.departamento}</td>
                                                <td>{item.subCategoria}</td>
                                                <td>{formatColeccion(item.coleccion)}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button
                                                        className={`gen-btn-row-action ${item.confirmado ? 'confirmed' : ''}`}
                                                        onClick={() => handleConfirmFila(item)}
                                                        disabled={item.confirmado || confirmandoLineaId === item.id}
                                                    >
                                                        {item.confirmado
                                                            ? 'Confirmado'
                                                            : confirmandoLineaId === item.id
                                                                ? 'Confirmando...'
                                                                : 'Confirmar'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={23} className="gen-empty-row">
                                            {cargando 
                                                ? 'Cargando registros...' 
                                                : data.length > 0 
                                                    ? 'No se encontraron registros que coincidan con los filtros aplicados.' 
                                                    : 'No hay registros para mostrar. Ingrese el pedido y país para consultar.'}
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
                        </div>

                        <div className="gen-footer-paginacion">
                            <button
                                className="gen-btn-paginacion"
                                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                                disabled={paginaActual <= 1}
                            >
                                ← Anterior
                            </button>
                            <span className="gen-paginacion-info">
                                Página {paginaActual} de {totalPaginas}
                            </span>
                            <button
                                className="gen-btn-paginacion"
                                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                                disabled={paginaActual >= totalPaginas}
                            >
                                Siguiente →
                            </button>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default GeneracionCodigosPreciosScreen;