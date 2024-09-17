

import React, { useEffect, useMemo, useState } from 'react'
import { WmSApi } from '../../api/WMSapi'
import { useTable, Column } from 'react-table';
import { ImpresionEtiquetaPrecio } from '../../interfaces/GeneracionPrecioCodigos/GeneracionPrecioCodigoInterface';

const ImpresionEtiquetaPreciosScreen = () => {
    const [data, setData] = useState<ImpresionEtiquetaPrecio[]>([])
    const [cargando, setCargando] = useState<boolean>(false)
    const [imprimiendo, setimprimiendo] = useState<boolean>(false)

    const [pedido,setPedido] = useState<string>('')
    const [ruta,setRuta] = useState<string>('')
    const [caja,setcaja] = useState<string>('')
    const [fecha,setfecha] = useState<string>('')


    
    const getData = async () => {
        setCargando(true)
        try {
            await WmSApi.get<ImpresionEtiquetaPrecio[]>(`ImpresionPrecioCodigos/${pedido != '' ? pedido : '-'}/${ruta != '' ? ruta : '-'}/${caja != '' ? caja : '-'}`)
                .then(resp => {
                    setData(resp.data)
                })
        } catch (err) {
            console.log(err)
        }
        setCargando(false)
    }

    const imprimir = async () => {
        setimprimiendo(true)
        try {
            await WmSApi.get<string>(`ImpresionPrecioCodigos/${pedido != '' ? pedido : '-'}/${ruta != '' ? ruta : '-'}/${caja != '' ? caja : '-'}/${fecha != '' ? fecha : '-'}`)
                .then(resp => {
                    if(resp.data != "OK"){
                        alert(resp.data);
                    }
                })
        } catch (err) {
            console.log(err)
        }
        setimprimiendo(false)
    }


    const Limpiar = () => {
        setPedido('')
        setRuta('')
        setcaja('')
    }

    const columns: Column<ImpresionEtiquetaPrecio>[] = useMemo(
        () => [
            {
                Header: 'Cliente',
                accessor: 'nombre',
            },
            {
                Header: 'Codigo Barra',
                accessor: 'codigoBarra',
            },
            {
                Header: 'Articulo',
                accessor: 'articulo',
            },
            {
                Header: 'Descripcion',
                accessor: 'descripcion',
            },
            {
                Header: 'Estilo',
                accessor: 'estilo',
            },
            {
                Header: 'Talla',
                accessor: 'talla',
            },
            {
                Header: 'Color',
                accessor: 'idColor',
            },
            {
                Header: 'Precio',
                accessor: 'precio',
            },
            {
                Header: 'Cantidad',
                accessor: 'qty',
            },
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

    return (
        <div>
            <h2 style={{ textAlign: 'center' }}>Configuracion Precios Codigos</h2>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', gap: '10px' }}>
                <div>
                    <label htmlFor="Pedido" style={{ marginRight: '10px' }}>Pedido:</label>
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
                    <label htmlFor="Ruta" style={{ marginRight: '10px' }}>Ruta:</label>
                    <input
                        type="text"
                        id="Ruta"
                        value={ruta}
                        onChange={(e) => setRuta(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="Caja" style={{ marginRight: '10px' }}>Caja:</label>
                    <input
                        type="text"
                        id="Caja"
                        value={caja}
                        onChange={(e) => setcaja(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="Fecha" style={{ marginRight: '10px' }}>Fecha:</label>
                    <input
                        type="text"
                        id="Fecha"
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
                <button
                    onClick={() => {
                        getData()
                    }}
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
                <button
                    onClick={() => {

                        Limpiar()
                    }}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    Limpiar
                </button>

                <button
                    onClick={() => {

                        imprimir()
                    }}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: imprimiendo ? '#ccc' : '#007bff',
                        color: 'white',
                        cursor: imprimiendo ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    disabled = {imprimiendo}
                >
                    Imprimir
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

export default ImpresionEtiquetaPreciosScreen;

