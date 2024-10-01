import React, { useEffect, useMemo, useState } from 'react'
import { WmSApi } from '../../api/WMSapi'
import { useTable, Column } from 'react-table';
import { TrackingPedidosFiltroInterface, TrackingPedidosInterface } from '../../interfaces/TrackingPedidos/TrackingPedidosInterface';

const TrackingPedidosScreen = () => {
    const [data, setData] = useState<TrackingPedidosInterface[]>([])
    const [cargando, setCargando] = useState<boolean>(false)

    const [cuentaCliente, setCuentaCliente] = useState<string>('')
    const [pedido, setPedido] = useState<string>('')
    const [listaEmpaque, setListaEmpaque] = useState<string>('')
    const [albaran, setAlbaran] = useState<string>('')
    const [factura, setFactura] = useState<string>('')

    const [page, setPage] = useState<number>(0)

    const [totalPages, setTotalPages] = useState<number>(1)


    const getData = async () => {
        setCargando(true)
        try {
            let filtro: TrackingPedidosFiltroInterface = {
                cuentaCliente,
                pedido,
                listaEmpaque,
                albaran,
                factura,
                page,
                size: 50
            }
            await WmSApi.post<TrackingPedidosInterface[]>(`TrackingPedidos`, filtro)
                .then(resp => {
                    setData(resp.data)

                    setTotalPages(resp.data[0]?.paginas > 0 ? resp.data[0].paginas : 0)
                })
        } catch (err) {
            alert('error al cargar: ' + err)
        }
        setCargando(false)
    }


    const columns: Column<TrackingPedidosInterface>[] = useMemo(
        () => [
            {
                Header: 'Cuenta Cliente',
                accessor: 'cuentaCliente',
            },
            {
                Header: 'Nombre Cliente',
                accessor: 'nombreCliente',
            },
            {
                Header: 'Ingreso Pedido',
                accessor: 'fechaIngresoPedido',
            },
            {
                Header: 'Pedido Venta',
                accessor: 'pedidoVenta',
            },
            {
                Header: 'Estado Pedido',
                accessor: 'estadoPedido',
            },
            {
                Header: 'Lista Empaque',
                accessor: 'listaEmpaque',
            },
            {
                Header: 'Generacion Lista Empaque',
                accessor: 'fechaGeneracionListaEmpaque',
            },
            {
                Header: 'Lista Empaque Completada',
                accessor: 'fechaListaEmpaqueCompletada',
            },
            {
                Header: 'Albaran',
                accessor: 'albaran',
            },
            {
                Header: 'Ingreso Albaran',
                accessor: 'fechaAlbaran',
            },
            {
                Header: 'Factura',
                accessor: 'factura',
            },
            {
                Header: 'Ingreso Factura',
                accessor: 'fechaFactura',
            },
            {
                Header: 'Recepcion CD',
                accessor: 'fechaRececpcionCD',
            },
            {
                Header: 'Despacho',
                accessor: 'fechaDespacho',
            },
            {
                Header: 'Ubicacion',
                accessor: 'ubicacion',
            },
            {
                Header: 'Cajas',
                accessor: 'cajas',
            },
            {
                Header: 'Cantidad',
                accessor: 'qty',
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
            <h2 style={{ textAlign: 'center' }}>Tracking Pedidos</h2>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', gap: '10px' }}>

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
                    <label htmlFor="pedido" style={{ marginRight: '10px' }}>Pedido:</label>
                    <input
                        type="text"
                        id="pedido"
                        value={pedido}
                        onChange={(e) => setPedido(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>

                <div>
                    <label htmlFor="listaEmpaque" style={{ marginRight: '10px' }}>Lista Empaque:</label>
                    <input
                        type="text"
                        id="listaEmpaque"
                        value={listaEmpaque}
                        onChange={(e) => setListaEmpaque(e.target.value)}
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
                        onChange={(e) => setAlbaran(e.target.value)}
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
                        onChange={(e) => setFactura(e.target.value)}
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
                    Buscar
                </button>

            </div>
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

export default TrackingPedidosScreen
