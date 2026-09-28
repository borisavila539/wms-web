import React, { useEffect, useMemo, useState } from 'react'
import { WmSApi } from '../../api/WMSapi'
import { ConfiguracionPrecioApi } from '../../api/ConfiguracionPrecioApi'
import { ClientesGeneracionPrecio } from '../../interfaces/GeneracionPrecioCodigos/GeneracionPrecioCodigoInterface'
import { HeaderGenerico, SeccionBusquedaAcciones, FiltrosGenericos, FiltroCampoTexto, TablaGenerica, ColumnConfig } from '../../Components'
import { IcoSave, IcoX } from '../../Components/icons'
// @ts-ignore
import '../../Styles/TemplateGenericoScreen.css'

const FILAS_POR_PAGINA = 15

const CLIENTE_VACIO: ClientesGeneracionPrecio = { cuentaCliente: '', nombre: '', moneda: '', decimal: false }

const CAMPOS_TEXTO_FILTRO: FiltroCampoTexto[] = [
    { key: 'cuentaCliente', label: 'Cuenta Cliente', placeholder: 'Filtrar cuenta...' },
    { key: 'nombre', label: 'Nombre', placeholder: 'Filtrar nombre...' },
    { key: 'moneda', label: 'Moneda', placeholder: 'Filtrar moneda...' },
]

const ClientesGeneracionPreciosScreen = () => {
    const [clientes, setClientes] = useState<ClientesGeneracionPrecio[]>([])
    const [cargando, setCargando] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [paginaActual, setPaginaActual] = useState(1)
    const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'success'; texto: string } | null>(null)

    // ── Filtros por campo (Cuenta / Nombre / Moneda) ────────────────────────
    const [valoresTexto, setValoresTexto] = useState<Record<string, string>>({})

    // ── Modal de alta/edición ────────────────────────────────────────────────
    const [itemEditando, setItemEditando] = useState<ClientesGeneracionPrecio | null>(null)
    const [esNuevo, setEsNuevo] = useState(false)

    const getData = async () => {
        setCargando(true)
        setMensaje(null)
        try {
            const resp = await ConfiguracionPrecioApi.getClientesGeneracionPrecio()
            setClientes(resp.data)
        } catch (err) {
            console.log(err)
            setMensaje({ tipo: 'error', texto: 'Error al conectar con el servidor.' })
        }
        setCargando(false)
    }

    useEffect(() => { getData() }, [])

    // ── Filtros por campo (Cuenta / Nombre / Moneda) ────────────────────────
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

    const datosFiltrados = useMemo(() => {
        return clientes.filter(c => {
            for (const campo of CAMPOS_TEXTO_FILTRO) {
                const val = valoresTexto[campo.key]
                if (val && val.trim() !== '') {
                    const itemValor = String((c as any)[campo.key] ?? '').toLowerCase()
                    if (!itemValor.includes(val.toLowerCase().trim())) return false
                }
            }
            return true
        })
    }, [clientes, valoresTexto])

    const totalPaginas = Math.max(1, Math.ceil(datosFiltrados.length / FILAS_POR_PAGINA))
    const datosPagina = useMemo(() => {
        const inicio = (paginaActual - 1) * FILAS_POR_PAGINA
        return datosFiltrados.slice(inicio, inicio + FILAS_POR_PAGINA)
    }, [datosFiltrados, paginaActual])

    // ── Alta / edición ───────────────────────────────────────────────────────
    const handleNuevo = () => {
        setItemEditando({ ...CLIENTE_VACIO })
        setEsNuevo(true)
    }

    const handleEditar = (item: ClientesGeneracionPrecio) => {
        setItemEditando({ ...item })
        setEsNuevo(false)
    }

    const handleGuardar = async (item: ClientesGeneracionPrecio) => {
        setGuardando(true)
        setMensaje(null)
        try {
            const resp = await WmSApi.post<ClientesGeneracionPrecio>('ClientesGeneracionPrecio', item)
            if (resp.data && resp.data.cuentaCliente !== '') {
                setMensaje({ tipo: 'success', texto: `Cliente "${resp.data.cuentaCliente}" guardado correctamente.` })
                setItemEditando(null)
                await getData()
            } else {
                setMensaje({ tipo: 'error', texto: 'No se pudo guardar el registro.' })
            }
        } catch (err) {
            console.log(err)
            setMensaje({ tipo: 'error', texto: 'Error al guardar el registro en el servidor.' })
        }
        setGuardando(false)
    }

    const columns: ColumnConfig<ClientesGeneracionPrecio>[] = [
        { header: 'Cuenta Cliente', accessor: 'cuentaCliente', isId: true },
        { header: 'Nombre', accessor: 'nombre' },
        { header: 'Moneda', accessor: 'moneda' },
        { header: 'Decimal', align: 'center', render: (item) => item.decimal ? 'Sí' : 'No' },
    ]

    return (
        <div className="gen-page-root">
            <div className="gen-container">
                <HeaderGenerico
                    titulo="Clientes de Generación de Precios"
                    subtitulo="Cuentas de clientes utilizadas en la generación y configuración de precios."
                    estado={cargando ? 'consultando' : clientes.length > 0 ? 'datos' : 'vacio'}
                />

                {mensaje && (
                    <div className={`alert-box alert-${mensaje.tipo} fade-in`}>
                        <span>{mensaje.texto}</span>
                        <button className="alert-close" onClick={() => setMensaje(null)}><IcoX /></button>
                    </div>
                )}

                <SeccionBusquedaAcciones
                    onNuevoRegistro={handleNuevo}
                    labelNuevo="Nuevo cliente"
                    onRefrescar={getData}
                    cargandoRefresco={cargando}
                />

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
                    keyExtractor={(item) => item.cuentaCliente}
                    paginaActual={paginaActual}
                    totalPaginas={totalPaginas}
                    totalRegistros={datosFiltrados.length}
                    onPaginaChange={setPaginaActual}
                    onEditItem={handleEditar}
                    emptyMessage={cargando ? 'Consultando información...' : 'No hay clientes registrados.'}
                />
            </div>

            {itemEditando && (
                <ModalCliente
                    item={itemEditando}
                    esNuevo={esNuevo}
                    guardando={guardando}
                    onGuardar={handleGuardar}
                    onCerrar={() => setItemEditando(null)}
                />
            )}
        </div>
    )
}

// ── Modal de alta/edición de cliente ──────────────────────────────────────────
function ModalCliente({ item, esNuevo, guardando, onGuardar, onCerrar }: {
    item: ClientesGeneracionPrecio
    esNuevo: boolean
    guardando: boolean
    onGuardar: (item: ClientesGeneracionPrecio) => void
    onCerrar: () => void
}) {
    const [form, setForm] = useState<ClientesGeneracionPrecio>({ ...item })
    const [errores, setErrores] = useState<Partial<Record<keyof ClientesGeneracionPrecio, string>>>({})

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onCerrar()
    }

    const validar = () => {
        const errs: Partial<Record<keyof ClientesGeneracionPrecio, string>> = {}
        if (!form.cuentaCliente.trim()) errs.cuentaCliente = 'Requerido'
        if (!form.nombre.trim()) errs.nombre = 'Requerido'
        setErrores(errs)
        return Object.keys(errs).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validar()) onGuardar(form)
    }

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="cliente-modal-titulo">
                <div className="modal-header">
                    <div>
                        <h2 className="modal-titulo" id="cliente-modal-titulo">{esNuevo ? 'Nuevo cliente' : 'Editar cliente'}</h2>
                        {!esNuevo && <p className="modal-subtitulo">{item.cuentaCliente}</p>}
                    </div>
                    <button className="modal-close" onClick={onCerrar} aria-label="Cerrar"><IcoX /></button>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="modal-body">
                        <div className="modal-grid">
                            <div className={`modal-campo${errores.cuentaCliente ? ' modal-campo--error' : ''}`}>
                                <label className="modal-label">
                                    Cuenta Cliente<span className="modal-requerido">*</span>
                                </label>
                                <input
                                    className="modal-input"
                                    type="text"
                                    value={form.cuentaCliente}
                                    disabled={!esNuevo}
                                    onChange={e => {
                                        setForm(p => ({ ...p, cuentaCliente: e.target.value }))
                                        setErrores(p => ({ ...p, cuentaCliente: undefined }))
                                    }}
                                />
                                {errores.cuentaCliente && <span className="modal-error-msg">{errores.cuentaCliente}</span>}
                            </div>

                            <div className={`modal-campo${errores.nombre ? ' modal-campo--error' : ''}`}>
                                <label className="modal-label">
                                    Nombre<span className="modal-requerido">*</span>
                                </label>
                                <input
                                    className="modal-input"
                                    type="text"
                                    value={form.nombre}
                                    onChange={e => {
                                        setForm(p => ({ ...p, nombre: e.target.value }))
                                        setErrores(p => ({ ...p, nombre: undefined }))
                                    }}
                                />
                                {errores.nombre && <span className="modal-error-msg">{errores.nombre}</span>}
                            </div>

                            <div className="modal-campo">
                                <label className="modal-label">Moneda</label>
                                <input
                                    className="modal-input"
                                    type="text"
                                    value={form.moneda}
                                    onChange={e => setForm(p => ({ ...p, moneda: e.target.value }))}
                                />
                            </div>

                            <div className="modal-campo">
                                <label className="modal-label">Decimal</label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                                    <input
                                        type="checkbox"
                                        checked={form.decimal}
                                        onChange={e => setForm(p => ({ ...p, decimal: e.target.checked }))}
                                    />
                                    <span style={{ fontSize: 13, color: '#334155' }}>Maneja decimales</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancelar" onClick={onCerrar}>Cancelar</button>
                        <button type="submit" className="btn-guardar" disabled={guardando}>
                            <IcoSave /><span>{guardando ? 'Guardando...' : 'Guardar'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ClientesGeneracionPreciosScreen
