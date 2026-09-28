import { useEffect, useState } from "react";
import { ConfiguracionPrecioApi } from "../../api/ConfiguracionPrecioApi";
import { CategoriaPorClienteBaseDto, IcoSearch } from "../../interfaces/GeneracionPrecioCodigos/CategoriaPorClienteBaseInterface";
import { IcoCheck, IcoX } from "../../interfaces/GeneracionPrecioCodigos/ConfiguracionPrecioInterface";
import { WmSApi } from "../../api/WMSapi";
import { ClientesGeneracionPrecio } from "../../interfaces/GeneracionPrecioCodigos/GeneracionPrecioCodigoInterface";

interface Props {
    cuentaInicial?: string;
    baseInicial?: string;
    paisInicial?: string;
    // Cuando se provee, cada resultado muestra un botón "Usar" que aplica esos
    // valores al llamador (ej. el formulario de alta de una línea nueva).
    onSeleccionar?: (item: CategoriaPorClienteBaseDto) => void;
    onCerrar: () => void;
}

export function CategoriaClienteBaseModal({ cuentaInicial = '', baseInicial = '', paisInicial = 'IMHN', onSeleccionar, onCerrar }: Props) {
    const [cuenta, setCuenta] = useState(cuentaInicial);
    const [base, setBase] = useState(baseInicial);
    const [pais, setPais] = useState(paisInicial);
    const [resultados, setResultados] = useState<CategoriaPorClienteBaseDto[]>([]);
    const [buscando, setBuscando] = useState(false);
    const [buscado, setBuscado] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [clientes, setClientes] = useState<ClientesGeneracionPrecio[]>([]);

    // Clientes registrados en "Clientes Generación Precio", para autocompletar la Cuenta.
    useEffect(() => {
        WmSApi.get<ClientesGeneracionPrecio[]>('ObtenerClientesGeneracionPrecio')
            .then(resp => setClientes(resp.data))
            .catch(err => console.log(err));
    }, []);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onCerrar();
    };

    const handleBuscar = async () => {
        if (!cuenta.trim() || !base.trim() || !pais.trim()) {
            setErrorMsg('Cuenta, Base y País son obligatorios.');
            return;
        }
        setErrorMsg(null);
        setBuscando(true);
        try {
            const resp = await ConfiguracionPrecioApi.obtenerCategoriaPorClienteBase(cuenta.trim(), base.trim(), pais.trim());
            setResultados(resp.data);
            setBuscado(true);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Error al consultar la información.');
        } finally {
            setBuscando(false);
        }
    };

    const colSpan = onSeleccionar ? 4 : 3;

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-panel modal-panel--categoria" role="dialog" aria-modal="true" aria-labelledby="categoria-modal-titulo">
                <div className="modal-header">
                    <div>
                        <h2 className="modal-titulo" id="categoria-modal-titulo"><IcoSearch /> Categoría por Cliente / Base</h2>
                        <p className="modal-subtitulo">Categoría, subcategoría y colección históricas de pedidos previos.</p>
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

                    <div className="tallas-alta-form" style={{ gridTemplateColumns: '1fr 1fr 0.7fr auto' }}>
                        <input
                            className="modal-input"
                            placeholder="Cuenta o busca por nombre…"
                            value={cuenta}
                            onChange={e => setCuenta(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                            list="clientes-generacion-precio-categoria"
                        />
                        <datalist id="clientes-generacion-precio-categoria">
                            {clientes.map(c => (
                                <option key={c.cuentaCliente} value={c.cuentaCliente}>{c.nombre}</option>
                            ))}
                        </datalist>
                        <input
                            className="modal-input"
                            placeholder="Base"
                            value={base}
                            onChange={e => setBase(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                        />
                        <input
                            className="modal-input"
                            placeholder="País (ej. IMHN)"
                            value={pais}
                            onChange={e => setPais(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                        />
                        <button className="btn-submit" onClick={handleBuscar} disabled={buscando} title="Buscar">
                            <IcoSearch />
                        </button>
                    </div>

                    <div className="tallas-lista-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Categoría</th>
                                    <th>Subcategoría</th>
                                    <th>Colección</th>
                                    {onSeleccionar && <th className="col-acciones"></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {buscando ? (
                                    <tr><td colSpan={colSpan} className="empty-row">Consultando…</td></tr>
                                ) : resultados.length === 0 ? (
                                    <tr><td colSpan={colSpan} className="empty-row">
                                        {buscado ? 'No se encontraron registros para esa combinación.' : 'Ingresa Cuenta y Base, luego busca.'}
                                    </td></tr>
                                ) : resultados.map((item, i) => (
                                    <tr key={i}>
                                        <td>{item.categoria}</td>
                                        <td>{item.subCategoria}</td>
                                        <td>{item.coleccion}</td>
                                        {onSeleccionar && (
                                            <td className="col-acciones">
                                                <button
                                                    className="btn-editar-fila"
                                                    style={{ opacity: 1 }}
                                                    title="Usar estos valores"
                                                    onClick={() => onSeleccionar(item)}
                                                >
                                                    <IcoCheck />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
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
