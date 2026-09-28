import { useState } from "react";
import {
    RespuestaSP,
    TallaConfiguracionPrecioDto,
    TIPOS_TALLA,
    initialTallaConfiguracionPrecio,
    IcoRuler,
    IcoTrash,
} from "../../interfaces/GeneracionPrecioCodigos/TallaConfiguracionPrecioInterface";
import { IcoCheck, IcoEditar, IcoPlus, IcoX } from "../../interfaces/GeneracionPrecioCodigos/ConfiguracionPrecioInterface";
import { ConfiguracionPrecioApi } from "../../api/ConfiguracionPrecioApi";

interface Props {
    tallas: TallaConfiguracionPrecioDto[];
    onCerrar: () => void;
    // Notifica al padre para refrescar la lista compartida (usada también en el popover de hover)
    onCambio: (tallas: TallaConfiguracionPrecioDto[]) => void;
}

export function GestionTallasModal({ tallas, onCerrar, onCambio }: Props) {
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    // Fila nueva (form de alta, siempre visible arriba de la lista)
    const [nuevo, setNuevo] = useState<TallaConfiguracionPrecioDto>({ ...initialTallaConfiguracionPrecio });

    // Edición inline: id de la fila que está en modo edición + su borrador
    const [idEditando, setIdEditando] = useState<number | null>(null);
    const [borrador, setBorrador] = useState<TallaConfiguracionPrecioDto | null>(null);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onCerrar();
    };

    const refrescar = async () => {
        const resp = await ConfiguracionPrecioApi.getTallasConfiguracionPrecio();
        onCambio(resp.data);
    };

    const handleAgregar = async () => {
        setErrorMsg(null);
        if (!nuevo.genero.trim() || !nuevo.talla.trim() || !nuevo.tipo.trim()) {
            setErrorMsg('Género, Talla y Tipo son obligatorios.');
            return;
        }
        setGuardando(true);
        try {
            const resp = await ConfiguracionPrecioApi.insertTallaConfiguracionPrecio({
                ...nuevo,
                genero: nuevo.genero.trim().toUpperCase(),
                talla: nuevo.talla.trim().toUpperCase(),
            });
            const r: RespuestaSP = resp.data;
            if (!r.exito) {
                setErrorMsg(r.mensaje);
                return;
            }
            await refrescar();
            setNuevo({ ...initialTallaConfiguracionPrecio });
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Error al agregar el registro.');
        } finally {
            setGuardando(false);
        }
    };

    const handleAbrirEdicion = (item: TallaConfiguracionPrecioDto) => {
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
        if (!borrador.genero.trim() || !borrador.talla.trim() || !borrador.tipo.trim()) {
            setErrorMsg('Género, Talla y Tipo son obligatorios.');
            return;
        }
        setGuardando(true);
        setErrorMsg(null);
        try {
            const resp = await ConfiguracionPrecioApi.updateTallaConfiguracionPrecio({
                ...borrador,
                genero: borrador.genero.trim().toUpperCase(),
                talla: borrador.talla.trim().toUpperCase(),
            });
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

    const handleEliminar = async (item: TallaConfiguracionPrecioDto) => {
        const confirmado = window.confirm(`¿Eliminar la talla "${item.talla}" (${item.genero} / ${item.tipo})?`);
        if (!confirmado) return;
        setErrorMsg(null);
        try {
            const resp = await ConfiguracionPrecioApi.deleteTallaConfiguracionPrecio(item.id);
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

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-panel modal-panel--tallas" role="dialog" aria-modal="true" aria-labelledby="tallas-modal-titulo">
                <div className="modal-header">
                    <div>
                        <h2 className="modal-titulo" id="tallas-modal-titulo"><IcoRuler /> Tallas configuradas</h2>
                        <p className="modal-subtitulo">Género, talla y tipo (normal / especial) usados como referencia.</p>
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
                    <div className="tallas-alta-form">
                        <input
                            className="modal-input"
                            placeholder="Género"
                            value={nuevo.genero}
                            onChange={e => setNuevo(p => ({ ...p, genero: e.target.value }))}
                        />
                        <input
                            className="modal-input"
                            placeholder="Talla"
                            value={nuevo.talla}
                            onChange={e => setNuevo(p => ({ ...p, talla: e.target.value }))}
                        />
                        <select
                            className="modal-input"
                            value={nuevo.tipo}
                            onChange={e => setNuevo(p => ({ ...p, tipo: e.target.value }))}
                        >
                            {TIPOS_TALLA.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button className="btn-submit" onClick={handleAgregar} disabled={guardando} title="Agregar">
                            <IcoPlus />
                        </button>
                    </div>

                    {/* Lista compacta con scroll propio */}
                    <div className="tallas-lista-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Género</th>
                                    <th>Talla</th>
                                    <th>Tipo</th>
                                    <th className="col-acciones"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {tallas.length === 0 ? (
                                    <tr><td colSpan={4} className="empty-row">No hay tallas configuradas.</td></tr>
                                ) : tallas.map(item => {
                                    const enEdicion = idEditando === item.id;
                                    return (
                                        <tr key={item.id}>
                                            {enEdicion && borrador ? (
                                                <>
                                                    <td>
                                                        <input
                                                            className="modal-input"
                                                            value={borrador.genero}
                                                            onChange={e => setBorrador(p => p && ({ ...p, genero: e.target.value }))}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="modal-input"
                                                            value={borrador.talla}
                                                            onChange={e => setBorrador(p => p && ({ ...p, talla: e.target.value }))}
                                                        />
                                                    </td>
                                                    <td>
                                                        <select
                                                            className="modal-input"
                                                            value={borrador.tipo}
                                                            onChange={e => setBorrador(p => p && ({ ...p, tipo: e.target.value }))}
                                                        >
                                                            {TIPOS_TALLA.map(t => <option key={t} value={t}>{t}</option>)}
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
                                                    <td>{item.genero}</td>
                                                    <td className="td-id">{item.talla}</td>
                                                    <td>
                                                        <span className={`talla-tipo-badge talla-tipo-badge--${item.tipo.toUpperCase() === 'ESPECIAL' ? 'especial' : 'normal'}`}>
                                                            {item.tipo}
                                                        </span>
                                                    </td>
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
                    <button type="button" className="btn-cancelar" onClick={onCerrar}>Cerrar</button>
                </div>
            </div>
        </div>
    );
}
