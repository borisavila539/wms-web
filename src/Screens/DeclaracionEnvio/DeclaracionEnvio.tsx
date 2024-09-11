import React, { useEffect, useMemo, useState } from 'react'
import { WmSApi } from '../../api/WMSapi'
import { useTable, Column } from 'react-table';
import * as XLSX from 'xlsx';

import { saveAs } from 'file-saver';
import { DeclaracionEnvioFiltro, DeclaracionEnvioninterface } from '../../interfaces/DeclaracionEnvio/DeclaracionEnvioInterface';

const DeclaracionEnvio = () => {
    const [data, setData] = useState<DeclaracionEnvioninterface[]>([])
    const [cargando, setCargando] = useState<boolean>(false)
    const [sincronizando, setSincronizando] = useState<boolean>(false)
    const [descargando, setDescargando] = useState<boolean>(false)
    const [page, setPage] = useState<number>(0)
    const [anio, setAnio] = useState<string>('')
    const [caja, setCaja] = useState<string>('')
    const [pais, setPais] = useState<string>('')
    const [cuentaCliente, setCuentaCliente] = useState<string>('')
    const [nombreCliente, setNombreCliente] = useState<string>('')
    const [pedidoVenta, setPedidoVenta] = useState<string>('')
    const [listaEmpaque, setlistaEmpaque] = useState<string>('')
    const [ubicacion, setubicacion] = useState<string>('')
    const [albaran, setalbaran] = useState<string>('')
    const [factura, setfactura] = useState<string>('')
    const [fecha, setfecha] = useState<string>('')



    const [totalPages, setTotalPages] = useState<number>(1)

    const sync = async () => {
        setSincronizando(true)
        try {

            await WmSApi.get<DeclaracionEnvioninterface[]>(`DeclaracionEnvioSync`)
        } catch (err) {

        }
        setSincronizando(false)
    }
    const getData = async () => {
        setCargando(true)
        try {
            let filtro: DeclaracionEnvioFiltro = {
                caja,
                pais,
                cuentaCliente,
                nombreCliente,
                pedidoVenta,
                listaEmpaque,
                albaran,
                ubicacion,
                factura,
                page,
                size: 50,
                fecha

            }
            await WmSApi.post<DeclaracionEnvioninterface[]>(`DeclaracionEnvio`, filtro)
                .then(resp => {
                    setData(resp.data)
                    setTotalPages(resp.data[0].paginas)
                })
        } catch (err) {
            console.log(err)
        }
        setCargando(false)
    }

    const handleDownload = async () => {
        setDescargando(true)

        try {
            await WmSApi.get(`DeclaracionEnvio/${pais}/${ubicacion}/${fecha}`, {
                responseType: 'blob'
            }).then(resp => {
                const url = window.URL.createObjectURL(new Blob([resp.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'Declaracion Envio.xlsx'); 
                link.click();
                document.body.removeChild(link);
            })
        } catch (err) {

        }


        setDescargando(false)
    };

    const columns: Column<DeclaracionEnvioninterface>[] = useMemo(
        () => [
            {
                Header: 'Caja',
                accessor: 'caja',
            },
            {
                Header: 'Pais',
                accessor: 'pais',
            },
            {
                Header: 'Cuenta Cliente',
                accessor: 'cuentaCliente',
            },
            {
                Header: 'Nombre Cliente',
                accessor: 'nombreCliente',
            },
            {
                Header: 'Pedido venta',
                accessor: 'pedidoVenta',
            },
            {
                Header: 'Lista Empaque',
                accessor: 'listaEmpaque',
            },
            {
                Header: 'Albaran',
                accessor: 'albaran',
            },
            {
                Header: 'Numero Caja',
                accessor: 'numeroCaja',
            },
            {
                Header: 'Cantidad',
                accessor: 'cantidad',
            },
            {
                Header: 'Empacador',
                accessor: 'empacador',
            },
            {
                Header: 'ubicacion',
                accessor: 'ubicacion',
            },
            {
                Header: 'Fecha',
                accessor: 'fecha',
            },
            {
                Header: 'Factura',
                accessor: 'factura',
            },
            {
                Header: 'Calle',
                accessor: 'calle',
            },
            {
                Header: 'Ciudad',
                accessor: 'ciudad',
            },
            {
                Header: 'Departamento',
                accessor: 'departamento',
            }
        ], []
    )

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        prepareRow,
        rows,
    } = useTable(
        {
            columns,
            data
        }
    );

    useEffect(() => {
        getData()
    }, [page])
    return (
        <div>
            <h2 style={{ textAlign: 'center' }}>Declaracion Envio</h2>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', gap: '10px' }}>
                <div>
                    <label htmlFor="caja" style={{ marginRight: '10px' }}>Caja:</label>
                    <input
                        type="text"
                        id="caja"
                        value={caja}
                        onChange={(e) => setCaja(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="pais" style={{ marginRight: '10px' }}>Pais:</label>
                    <input
                        type="text"
                        id="pais"
                        value={pais}
                        onChange={(e) => setPais(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="cuentaCliente" style={{ marginRight: '10px' }}>Cuenta Cliente:</label>
                    <input
                        type="text"
                        id="cuentaCliente"
                        value={cuentaCliente}
                        onChange={(e) => setCuentaCliente(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="nombreCliente" style={{ marginRight: '10px' }}>Nombre CLiente:</label>
                    <input
                        type="text"
                        id="nombreCliente"
                        value={nombreCliente}
                        onChange={(e) => setNombreCliente(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="pedidoVenta" style={{ marginRight: '10px' }}>Pedido Venta:</label>
                    <input
                        type="text"
                        id="pedidoVenta"
                        value={pedidoVenta}
                        onChange={(e) => setPedidoVenta(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="listaEmpaque" style={{ marginRight: '10px' }}>lista Empaque:</label>
                    <input
                        type="text"
                        id="listaEmpaque"
                        value={listaEmpaque}
                        onChange={(e) => setlistaEmpaque(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="albaran" style={{ marginRight: '10px' }}>Albaran:</label>
                    <input
                        type="text"
                        id="albaran"
                        value={albaran}
                        onChange={(e) => setalbaran(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="factura" style={{ marginRight: '10px' }}>Factura:</label>
                    <input
                        type="text"
                        id="factura"
                        value={factura}
                        onChange={(e) => setfactura(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="ubicacion" style={{ marginRight: '10px' }}>Ubicacion:</label>
                    <input
                        type="text"
                        id="ubicacion"
                        value={ubicacion}
                        onChange={(e) => setubicacion(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="fecha" style={{ marginRight: '10px' }}>Fecha:</label>
                    <input
                        type="text"
                        id="fecha"
                        value={fecha}
                        onChange={(e) => setfecha(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="page" style={{ marginRight: '10px' }}>Pagina:</label>
                    <input
                        type="number"
                        id="page"
                        value={page + 1}
                        min={1}
                        max={totalPages + 1}
                        step={1}
                        onChange={(e) => setPage(parseInt(e.target.value != '' ? e.target.value : '0') - 1)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '30px',
                        }}
                    />
                    <span>/{totalPages + 1}</span>
                </div>
                <button
                    onClick={() => {
                        getData()
                        setPage(0)
                    }
                    }
                    disabled={cargando}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: cargando ? '#ccc' : '#007bff',
                        color: 'white',
                        cursor: cargando ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    Actualizar
                </button>
                <button
                    onClick={sync}
                    disabled={sincronizando}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: sincronizando ? '#ccc' : '#007bff',
                        color: 'white',
                        cursor: sincronizando ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    Sincronizar
                </button>
                <button
                    onClick={handleDownload}
                    disabled={descargando}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: descargando ? '#ccc' : '#007bff',
                        color: 'white',
                        cursor: descargando ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    Descargar
                </button>
            </div>
            {
                data.length > 0 &&
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px', gap: '10px' }}>
                    <p><strong>Total Cajas:</strong> {data[0].cajas.toString()} <strong>Totalunidades:</strong> {data[0].unidades.toString()}</p>
                </div>
            }
            <table {...getTableProps()} style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    {headerGroups.map(headerGroup => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map(column => (
                                <th
                                    {...column.getHeaderProps()}
                                    style={{ borderBottom: 'solid 3px red', background: 'aliceblue', padding: '10px' }}
                                >
                                    {column.render('Header')}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {cargando ? (
                        <tr>
                            <td colSpan={columns.length} style={{ textAlign: 'center' }}> <div className="spinner"></div></td>
                        </tr>
                    ) : (
                        rows.map(row => {
                            prepareRow(row);
                            return (
                                <tr {...row.getRowProps()}>
                                    {row.cells.map(cell => (
                                        <td
                                            {...cell.getCellProps()}
                                            style={{ padding: '10px', border: 'solid 1px gray' }}
                                        >
                                            {cell.render('Cell')}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default DeclaracionEnvio
