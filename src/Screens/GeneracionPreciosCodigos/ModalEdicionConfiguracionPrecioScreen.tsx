import { ChangeEvent, useEffect, useRef, useState } from "react";
import { ConfiguracionPrecioItem, IcoSave, IcoX } from "../../interfaces/GeneracionPrecioCodigos/ConfiguracionPrecioInterface";
import { CategoriaClienteBaseModal } from "./CategoriaClienteBaseModal";
import { CategoriaPorClienteBaseDto, IcoSearch } from "../../interfaces/GeneracionPrecioCodigos/CategoriaPorClienteBaseInterface";
import { WmSApi } from "../../api/WMSapi";
import { ClientesGeneracionPrecio } from "../../interfaces/GeneracionPrecioCodigos/GeneracionPrecioCodigoInterface";


export function ModalEdicion({
    item,
    onGuardar,
    onCerrar,
    onDelete,
}: {
    item: ConfiguracionPrecioItem;
    onGuardar: (editado: ConfiguracionPrecioItem) => void;
    onCerrar: () => void;
    onDelete?: (editado: ConfiguracionPrecioItem) => void;
}) {
    const [form, setForm] = useState<ConfiguracionPrecioItem>({ ...item });
    const [errores, setErrores] = useState<Partial<Record<keyof ConfiguracionPrecioItem, string>>>({});
    const [mostrarBuscadorCategoria, setMostrarBuscadorCategoria] = useState(false);
    const [clientes, setClientes] = useState<ClientesGeneracionPrecio[]>([]);
    const firstInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        firstInputRef.current?.focus();
    }, []);

    // Clientes registrados en "Clientes Generación Precio", para autocompletar la Cuenta.
    useEffect(() => {
        WmSApi.get<ClientesGeneracionPrecio[]>('ObtenerClientesGeneracionPrecio')
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

    // Manejador numérico individual por campo (sin recálculo automático)
    const cambiarNum = (campo: 'costo' | 'precio' | 'margen') => (e: ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const val = parseFloat(raw);
        setForm(prev => ({
            ...prev,
            [campo]: isNaN(val) ? 0 : val,
        }));
        setErrores(prev => ({ ...prev, [campo]: undefined }));
    };

    const cambiarTexto = (campo: keyof ConfiguracionPrecioItem) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [campo]: e.target.value }));
        setErrores(prev => ({ ...prev, [campo]: undefined }));
    };

    const validar = (): boolean => {
        const errs: Partial<Record<keyof ConfiguracionPrecioItem, string>> = {};
        if (!form.categoria.trim()) errs.categoria = 'Requerido';
        if (!form.cuenta.trim()) errs.cuenta = 'Requerido';
        if (!form.coleccion.trim()) errs.coleccion = 'Requerido';
        if (!form.base.trim()) errs.base = 'Requerido';
        if (!form.idColor.trim()) errs.idColor = 'Requerido';
        if (!form.talla.trim()) errs.talla = 'Requerido';
        if (form.costo < 0) errs.costo = 'Debe ser ≥ 0';
        if (form.precio <= 0) errs.precio = 'Debe ser > 0';
        setErrores(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validar()) onGuardar(form);
    };

    const handleUsarCategoria = (encontrado: CategoriaPorClienteBaseDto) => {
        setForm(prev => ({
            ...prev,
            categoria: encontrado.categoria,
            subcategoria: encontrado.subCategoria,
            coleccion: encontrado.coleccion,
        }));
        setErrores(prev => ({ ...prev, categoria: undefined, subcategoria: undefined, coleccion: undefined }));
        setMostrarBuscadorCategoria(false);
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onCerrar();
    };
    console.log(item)
    const camposTexto: [string, keyof ConfiguracionPrecioItem, boolean][] = [
        ['Categoría', 'categoria', true],
        ['Cuenta', 'cuenta', true],
        ['Colección', 'coleccion', true],
        ['Subcategoría', 'subcategoria', false],
        ['Base', 'base', true],
        ['IdColor', 'idColor', true],
        ['Talla', 'talla', true],
    ];

    return (<>
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
                <div className="modal-header">
                    {(item.id !== 0) ? (
                        <div>
                            <h2 className="modal-titulo" id="modal-titulo">Editar registro</h2>
                            <p className="modal-subtitulo">
                                {item.cuenta} — {item.base} / {item.idColor} / {item.talla}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <h2 className="modal-titulo" id="modal-titulo">Agregar Registro</h2>
                        </div>
                    )
                    }

                    <button className="modal-close" onClick={onCerrar} aria-label="Cerrar"><IcoX /></button>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="modal-body">
                        <p className="modal-seccion-titulo">Identificadores</p>
                        <div className="modal-grid">
                            {camposTexto.map(([label, campo, requerido]) => (
                                <div className={`modal-campo${errores[campo] ? ' modal-campo--error' : ''}`} key={campo as string}>
                                    <label className="modal-label">
                                        {label}{requerido && <span className="modal-requerido">*</span>}
                                    </label>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <input
                                            ref={campo === 'categoria' ? firstInputRef : undefined}
                                            className="modal-input"
                                            type="text"
                                            value={form[campo] as string}
                                            onChange={cambiarTexto(campo)}
                                            style={{ flex: 1, minWidth: 0 }}
                                            list={campo === 'cuenta' ? 'clientes-generacion-precio-linea' : undefined}
                                            placeholder={campo === 'cuenta' ? 'Cuenta o busca por nombre…' : undefined}
                                        />
                                        {campo === 'categoria' && (
                                            <button
                                                type="button"
                                                className="btn-outline"
                                                style={{ padding: '0 10px' }}
                                                title="Buscar Categoría / Subcategoría / Colección por Cliente + Base"
                                                onClick={() => setMostrarBuscadorCategoria(true)}
                                            >
                                                <IcoSearch />
                                            </button>
                                        )}
                                    </div>
                                    {errores[campo] && <span className="modal-error-msg">{errores[campo]}</span>}
                                </div>
                            ))}
                            <datalist id="clientes-generacion-precio-linea">
                                {clientes.map(c => (
                                    <option key={c.cuentaCliente} value={c.cuentaCliente}>{c.nombre}</option>
                                ))}
                            </datalist>
                        </div>

                        <p className="modal-seccion-titulo">Precios y Margen</p>
                        <div className="modal-grid modal-grid--precios">
                            <div className={`modal-campo${errores.costo ? ' modal-campo--error' : ''}`}>
                                <label className="modal-label">Costo<span className="modal-requerido">*</span></label>
                                <input
                                    className="modal-input modal-input--num"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.costo}
                                    onChange={cambiarNum('costo')}
                                />
                                {errores.costo && <span className="modal-error-msg">{errores.costo}</span>}
                            </div>

                            <div className={`modal-campo${errores.precio ? ' modal-campo--error' : ''}`}>
                                <label className="modal-label">Precio<span className="modal-requerido">*</span></label>
                                <input
                                    className="modal-input modal-input--num"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={form.precio}
                                    onChange={cambiarNum('precio')}
                                />
                                {errores.precio && <span className="modal-error-msg">{errores.precio}</span>}
                            </div>

                            <div className={`modal-campo${errores.margen ? ' modal-campo--error' : ''}`}>
                                <label className="modal-label">Margen (%)</label>
                                <input
                                    className="modal-input modal-input--num"
                                    type="number"
                                    step="0.01"
                                    value={form.margen}
                                    onChange={cambiarNum('margen')}
                                />
                                {errores.margen && <span className="modal-error-msg">{errores.margen}</span>}
                            </div>
                        </div>

                        {(item.id !== 0 && (item.costo !== form.costo || item.precio !== form.precio || item.margen !== form.margen)) && (
                            <div className="modal-comparativa">
                                <p className="modal-comparativa-titulo">Cambios respecto al valor original</p>
                                <div className="modal-comparativa-fila">
                                    {item.costo !== form.costo && (
                                        <div className="modal-comparativa-item">
                                            <span className="modal-comparativa-campo">Costo</span>
                                            <span className="modal-comparativa-ant">{item.costo.toFixed(2)}</span>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                            <span className="modal-comparativa-nvo">{form.costo.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {item.precio !== form.precio && (
                                        <div className="modal-comparativa-item">
                                            <span className="modal-comparativa-campo">Precio</span>
                                            <span className="modal-comparativa-ant">{item.precio.toFixed(2)}</span>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                            <span className="modal-comparativa-nvo">{form.precio.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {item.margen !== form.margen && (
                                        <div className="modal-comparativa-item">
                                            <span className="modal-comparativa-campo">Margen</span>
                                            <span className="modal-comparativa-ant">{item.margen.toFixed(2)}</span>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                            <span className="modal-comparativa-nvo">{form.margen.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancelar" onClick={onCerrar}>Cancelar</button>
                        {item.id !== 0 &&
                            <button type="button" className="btn-eliminar" onClick={() => onDelete && onDelete(form)}>Eliminar</button>
                        }
                        <button type="submit" className="btn-guardar">
                            <IcoSave /><span>Guardar cambios</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
        {mostrarBuscadorCategoria && (
            <CategoriaClienteBaseModal
                cuentaInicial={form.cuenta}
                baseInicial={form.base}
                onSeleccionar={handleUsarCategoria}
                onCerrar={() => setMostrarBuscadorCategoria(false)}
            />
        )}
    </>);
}


