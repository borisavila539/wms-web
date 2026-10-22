import { useEffect, useMemo, useState } from "react";
import {
    TiendaGeneracionPrecioDto,
    initialTiendaGeneracionPrecio,
    MONEDAS_TIENDA,
    IcoStore,
} from "../../interfaces/GeneracionPrecioCodigos/TiendaGeneracionPrecioInterface";
import { RespuestaSP, IcoTrash } from "../../interfaces/GeneracionPrecioCodigos/TallaConfiguracionPrecioInterface";
import { IcoCheck, IcoEditar, IcoPlus, IcoX } from "../../interfaces/GeneracionPrecioCodigos/ConfiguracionPrecioInterface";
import { ClientesGeneracionPrecio } from "../../interfaces/GeneracionPrecioCodigos/GeneracionPrecioCodigoInterface";
import { ConfiguracionPrecioApi } from "../../api/ConfiguracionPrecioApi";

interface Props {
    onCerrar: () => void;
}

// Valida y normaliza un registro antes de enviarlo; devuelve el mensaje de error o null.
const validarTienda = (t: TiendaGeneracionPrecioDto): string | null => {
    if (!t.codigoCliente.trim() || !t.tienda.trim()) return 'Código Cliente y Tienda son obligatorios.';
    if (!t.idDireccion || t.idDireccion <= 0) return 'Id Dirección debe ser un número mayor a 0.';
    return null;
};

const normalizar = (t: TiendaGeneracionPrecioDto): TiendaGeneracionPrecioDto => ({
    ...t,
    codigoCliente: t.codigoCliente.trim().toUpperCase(),
    tienda: t.tienda.trim().toUpperCase(),
    descripcion: t.descripcion?.trim() ?? '',
});

export function GestionTiendasModal({ onCerrar }: Props) {
    const [tiendas, setTiendas] = useState<TiendaGeneracionPrecioDto[]>([]);
    const [clientes, setClientes] = useState<ClientesGeneracionPrecio[]>([]);
    const [cargando, setCargando] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);
    const [filtro, setFiltro] = useState('');

    // Fila nueva (form de alta, siempre visible arriba de la lista)
    const [nuevo, setNuevo] = useState<TiendaGeneracionPrecioDto>({ ...initialTiendaGeneracionPrecio });

    // Edición inline: id de la fila que está en modo edición + su borrador
    const [idEditando, setIdEditando] = useState<number | null>(null);
    const [borrador, setBorrador] = useState<TiendaGeneracionPrecioDto | null>(null);

    const refrescar = async () => {
        const resp = await ConfiguracionPrecioApi.getTiendasGeneracionPrecio();
        setTiendas(resp.data);
    };

    useEffect(() => {
        refrescar()
            .catch(() => setErrorMsg('Error al consultar las tiendas.'))
            .finally(() => setCargando(false));
        ConfiguracionPrecioApi.getClientesGeneracionPrecio()
            .then(resp => setClientes(resp.data))
            .catch(err => console.log(err));
    }, []);

    useEffect(() => {
        const handler = (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Escape') onCerrar();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onCerrar]);

    const tiendasFiltradas = useMemo(() => {
        const f = filtro.trim().toLowerCase();
        if (!f) return tiendas;
        return tiendas.filter(t =>
            t.tienda.toLowerCase().includes(f) ||
            t.codigoCliente.toLowerCase().includes(f) ||
            String(t.idDireccion).includes(f) ||
            (t.descripcion ?? '').toLowerCase().includes(f) ||
            t.moneda.toLowerCase().includes(f)
        );
    }, [tiendas, filtro]);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onCerrar();
    };

    const handleAgregar = async () => {
        setErrorMsg(null);
        const err = validarTienda(nuevo);
        if (err) {
            setErrorMsg(err);
            return;
        }
        setGuardando(true);
        try {
            const resp = await ConfiguracionPrecioApi.insertTiendaGeneracionPrecio(normalizar(nuevo));
            const r: RespuestaSP = resp.data;
            if (!r.exito) {
                setErrorMsg(r.mensaje);
                return;
            }
            await refrescar();
            setNuevo({ ...initialTiendaGeneracionPrecio });
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Error al agregar el registro.');
        } finally {
            setGuardando(false);
        }
    };

    const handleAbrirEdicion = (item: TiendaGeneracionPrecioDto) => {
        setIdEditando(item.id);
        setBorrador({ ...item });
        setErrorMsg(null);
    };

    const handleCancelarEdicion = () => {
        setIdEditando(null);
        setBorrador(null);
    };

    const handleGuardarEdicion = async () => {
        if (!borrador) return;
        const err = validarTienda(borrador);
        if (err) {
            setErrorMsg(err);
            return;
        }
        setGuardando(true);
        setErrorMsg(null);
        try {
            const resp = await ConfiguracionPrecioApi.updateTiendaGeneracionPrecio(normalizar(borrador));
            const r: RespuestaSP = resp.data;
            if (!r.exito) {
                setErrorMsg(r.mensaje);
                return;
            }
            await refrescar();
            handleCancelarEdicion();
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Error al actualizar el registro.');
        } finally {
            setGuardando(false);
        }
    };

    const handleEliminar = async (item: TiendaGeneracionPrecioDto) => {
        const confirmado = window.confirm(`¿Eliminar la tienda "${item.tienda}" (${item.codigoCliente} / ${item.idDireccion})?`);
        if (!confirmado) return;
        setErrorMsg(null);
        try {
            const resp = await ConfiguracionPrecioApi.deleteTiendaGeneracionPrecio(item.id);
            const r: RespuestaSP = resp.data;
            if (!r.exito) {
                setErrorMsg(r.mensaje);
                return;
            }
            await refrescar();
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Error al eliminar el registro.');
        }
    };

    const parseIdDireccion = (valor: string) => {
        const n = parseInt(valor, 10);
        return isNaN(n) ? 0 : n;
    };

    const badgeMoneda = (moneda: string) => (
        <span className={`talla-tipo-badge talla-tipo-badge--${moneda === 'DOLAR' ? 'dolar' : 'normal'}`}>
            {moneda === 'DOLAR' ? 'DÓLAR' : moneda}
        </span>
    );

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-panel modal-panel--tiendas" role="dialog" aria-modal="true" aria-labelledby="tiendas-modal-titulo">
                <div className="modal-header">
                    <div>
                        <h2 className="modal-titulo" id="tiendas-modal-titulo"><IcoStore /> Tiendas por dirección de entrega</h2>
                        <p className="modal-subtitulo">
                            La dirección de entrega de la ruta de cada caja define la moneda de la etiqueta. Las tiendas en DÓLAR imprimen el Precio en Dólares.
                        </p>
                    </div>
                    <button className="modal-close" onClick={onCerrar} aria-label="Cerrar"><IcoX /></button>
                </div>

                <div className="modal-body modal-body--tallas">
                    {errorMsg && (
                        <div className="alert-box alert-error fade-in" style={{ marginBottom: 0 }}>
                            <span>{errorMsg}</span>
                            <button className="alert-close" onClick={() => setErrorMsg(null)}><IcoX /></button>
                        </div>
                    )}

                    {/* Alta rápida */}
                    <div className="tiendas-alta-form">
                        <input
                            className="modal-input"
                            placeholder="Código Cliente"
                            list="tiendas-clientes-generacion-precio"
                            value={nuevo.codigoCliente}
                            onChange={e => setNuevo(p => ({ ...p, codigoCliente: e.target.value }))}
                        />
                        <input
                            className="modal-input"
                            placeholder="Tienda"
                            value={nuevo.tienda}
                            onChange={e => setNuevo(p => ({ ...p, tienda: e.target.value }))}
                        />
                        <input
                            className="modal-input"
                            placeholder="Id Dirección"
                            inputMode="numeric"
                            value={nuevo.idDireccion || ''}
                            onChange={e => setNuevo(p => ({ ...p, idDireccion: parseIdDireccion(e.target.value) }))}
                        />
                        <input
                            className="modal-input"
                            placeholder="Descripción"
                            value={nuevo.descripcion}
                            onChange={e => setNuevo(p => ({ ...p, descripcion: e.target.value }))}
                        />
                        <select
                            className="modal-input"
                            value={nuevo.moneda}
                            onChange={e => setNuevo(p => ({ ...p, moneda: e.target.value }))}
                        >
                            {MONEDAS_TIENDA.map(m => <option key={m} value={m}>{m === 'DOLAR' ? 'DÓLAR' : m}</option>)}
                        </select>
                        <button className="btn-submit" onClick={handleAgregar} disabled={guardando} title="Agregar">
                            <IcoPlus />
                        </button>
                    </div>
                    <datalist id="tiendas-clientes-generacion-precio">
                        {clientes.map(c => (
                            <option key={c.cuentaCliente} value={c.cuentaCliente}>{c.nombre}</option>
                        ))}
                    </datalist>

                    <input
                        className="modal-input tiendas-filtro"
                        placeholder="Buscar tienda, cliente, dirección…"
                        value={filtro}
                        onChange={e => setFiltro(e.target.value)}
                    />

                    {/* Lista compacta con scroll propio */}
                    <div className="tallas-lista-wrapper tiendas-lista-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Código Cliente</th>
                                    <th>Tienda</th>
                                    <th>Id Dirección</th>
                                    <th>Descripción</th>
                                    <th>Moneda</th>
                                    <th className="col-acciones"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando ? (
                                    <tr><td colSpan={6} className="empty-row">Consultando tiendas…</td></tr>
                                ) : tiendasFiltradas.length === 0 ? (
                                    <tr><td colSpan={6} className="empty-row">No hay tiendas registradas.</td></tr>
                                ) : tiendasFiltradas.map(item => {
                                    const enEdicion = idEditando === item.id;
                                    return (
                                        <tr key={item.id}>
                                            {enEdicion && borrador ? (
                                                <>
                                                    <td>
                                                        <input
                                                            className="modal-input"
                                                            list="tiendas-clientes-generacion-precio"
                                                            value={borrador.codigoCliente}
                                                            onChange={e => setBorrador(p => p && ({ ...p, codigoCliente: e.target.value }))}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="modal-input"
                                                            value={borrador.tienda}
                                                            onChange={e => setBorrador(p => p && ({ ...p, tienda: e.target.value }))}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="modal-input"
                                                            inputMode="numeric"
                                                            value={borrador.idDireccion || ''}
                                                            onChange={e => setBorrador(p => p && ({ ...p, idDireccion: parseIdDireccion(e.target.value) }))}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="modal-input"
                                                            value={borrador.descripcion ?? ''}
                                                            onChange={e => setBorrador(p => p && ({ ...p, descripcion: e.target.value }))}
                                                        />
                                                    </td>
                                                    <td>
                                                        <select
                                                            className="modal-input"
                                                            value={borrador.moneda}
                                                            onChange={e => setBorrador(p => p && ({ ...p, moneda: e.target.value }))}
                                                        >
                                                            {MONEDAS_TIENDA.map(m => <option key={m} value={m}>{m === 'DOLAR' ? 'DÓLAR' : m}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="col-acciones tallas-acciones">
                                                        <button className="btn-editar-fila" title="Guardar" onClick={handleGuardarEdicion} disabled={guardando} style={{ opacity: 1 }}>
                                                            <IcoCheck />
                                                        </button>
                                                        <button className="btn-editar-fila" title="Cancelar" onClick={handleCancelarEdicion} style={{ opacity: 1 }}>
                                                            <IcoX />
                                                        </button>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="td-id">{item.codigoCliente}</td>
                                                    <td>{item.tienda}</td>
                                                    <td className="td-id">{item.idDireccion}</td>
                                                    <td className="td-secundario">{item.descripcion}</td>
                                                    <td>{badgeMoneda(item.moneda)}</td>
                                                    <td className="col-acciones tallas-acciones">
                                                        <button className="btn-editar-fila" title="Editar" onClick={() => handleAbrirEdicion(item)}>
                                                            <IcoEditar />
                                                        </button>
                                                        <button className="btn-editar-fila" title="Eliminar" onClick={() => handleEliminar(item)}>
                                                            <IcoTrash />
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="modal-footer">
                    <span className="hint-text" style={{ marginRight: 'auto' }}>{tiendas.length} tiendas registradas</span>
                    <button type="button" className="btn-cancelar" onClick={onCerrar}>Cerrar</button>
                </div>
            </div>
        </div>
    );
}
