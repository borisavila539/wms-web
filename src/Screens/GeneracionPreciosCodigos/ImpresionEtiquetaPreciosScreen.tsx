

import React, { useEffect, useMemo, useState } from 'react'
import { WmSApi } from '../../api/WMSapi'
import { useTable, Column } from 'react-table';
import { ImpresionEtiquetaPrecio, ImpresionPreciosForm, initialImpresionPreciosParms } from '../../interfaces/GeneracionPrecioCodigos/GeneracionPrecioCodigoInterface';
import { ImpresorasInterface } from '../../interfaces/ImpresorasInterface';

const ImpresionEtiquetaPreciosScreen = () => {
    const [data, setData] = useState<ImpresionEtiquetaPrecio[]>([])
    const [cargando, setCargando] = useState<boolean>(false)
    const [imprimiendo, setimprimiendo] = useState<boolean>(false)
    const [form, setImpresionPreciosForm] = useState<ImpresionPreciosForm>(initialImpresionPreciosParms);
    const [impresoras, setimpresoras] = useState<ImpresorasInterface[]>([])
    
    const mostrarCantidad = (form.pedido.trim() !== '' || form.ruta.trim() !== '')  &&
        (form.codigoArticulo.trim() !== '' ) && 
        form.talla.trim() !== '' &&
        form.color.trim() !== '';

    const ocultar = form.esGeneracionLibre && form.codigoArticulo.trim() !== '' ;

    const mostrarCaja = !form.esGeneracionLibre;
    const mostrarCodigoArticulo = form.esGeneracionLibre;
    const mostrarTallaYColor = form.esGeneracionLibre && ocultar ;
    const mostrarCantidadInput = mostrarTallaYColor && mostrarCantidad ;


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement | HTMLSelectElement;
        const { name, value, type } = target;
        setImpresionPreciosForm(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? (target as HTMLInputElement).checked : value
        }));
    };

    const getImpresoras = async () => {
        try {
            await WmSApi.get<ImpresorasInterface[]>('Impresoras').then(resp => {
                setimpresoras(resp.data)
                setImpresionPreciosForm(prev => ({ ...prev, impresora: resp.data[0].iM_IPPRINTER }))
            })
        } catch (err) {

        }
    }

    const getData = async () => {
        setCargando(true)
        try {
            const url = 'GetPrecioCodigos';
            await WmSApi.get<ImpresionEtiquetaPrecio[]>(url, { params: form })
                .then(resp => {
                    setData(resp.data)
                    console.log(resp.data)
                })
        } catch (err) {
            console.log(err)
        }
        setCargando(false)
    }

    const imprimir = async () => {
        setimprimiendo(true)
        try {
            await WmSApi.get<string>('ImpresionPrecioCodigos', { params: form })
                .then(resp => {
                    if (resp.data != "OK") {
                        alert(resp.data);
                    }
                })
        } catch (err) {
            console.log(err)
        }
        setimprimiendo(false)
    }


    const Limpiar = () => {
        setImpresionPreciosForm(initialImpresionPreciosParms);
    }

    const columns: Column<ImpresionEtiquetaPrecio>[] = useMemo(
        () => [
            {
                Header: 'Cliente',
                accessor: 'nombre',
            },
            {
                Header: 'Caja',
                accessor: 'imiB_BOXCODE',
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

    useEffect(() => {
        getImpresoras()
    }, [])

    return (
        <div>
            <h2 style={{ textAlign: 'center' }}>Configuracion Precios Codigos</h2>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', gap: '10px' }}>

                <div>
                    <label htmlFor="Generacion_Libre" style={{ marginRight: '10px' }}>Generación Libre</label>
                    <input
                        type="checkbox"
                        id="generacion_Libre"
                        name="esGeneracionLibre"
                        checked={form.esGeneracionLibre}
                        onChange={handleChange}
                        style={{
                            padding: '8px',
                            border: '2px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                            cursor: 'pointer',
                            height: '20px',
                            marginTop: '4px'
                        }}
                    />
                </div>

                <div>
                    <label htmlFor="Pedido" style={{ marginRight: '10px' }}>Pedido</label>
                    <input
                        type="text"
                        id="pedido"
                        name="pedido"
                        value={form.pedido}
                        onChange={handleChange}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>

                <div>
                    <label htmlFor="Ruta" style={{ marginRight: '10px' }}>Ruta</label>
                    <input
                        type="text"
                        id="Ruta"
                        name="ruta"
                        value={form.ruta}
                        onChange={handleChange}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>

                {mostrarCaja && (
                    <div>
                        <label htmlFor="Caja" style={{ marginRight: '10px' }}>Caja</label>
                        <input
                            type="text"
                            id="Caja"
                            name="caja"
                            value={form.caja}
                            onChange={handleChange}
                            style={{
                                padding: '8px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                width: '100px',
                            }}
                        />
                    </div>
                )}

                {mostrarCodigoArticulo && (
                    <div>
                        <label htmlFor="CodigogoArticulo" style={{ marginRight: '10px' }}>Codigo Art.</label>
                        <input
                            type="text"
                            id="codigoArticulo"
                            name="codigoArticulo"
                            value={form.codigoArticulo}
                            onChange={handleChange}
                            style={{
                                padding: '8px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                width: '100px',
                            }}
                        />
                    </div>
                )}

                {mostrarTallaYColor && (
                    <>
                        <div>
                            <label htmlFor="Talla" style={{ marginRight: '10px' }}>Talla</label>
                            <input
                                type="text"
                                id="talla"
                                name="talla"
                                value={form.talla}
                                onChange={handleChange}
                                style={{
                                    padding: '8px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    width: '100px',
                                }}
                            />
                        </div>
                        <div>
                            <label htmlFor="Color" style={{ marginRight: '10px' }}>Color</label>
                            <input
                                type="text"
                                id="color"
                                name="color"
                                value={form.color}
                                onChange={handleChange}
                                style={{
                                    padding: '8px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    width: '100px',
                                }}
                            />
                        </div>
                    </>
                )}

                {mostrarCantidadInput && (
                    <div>
                        <label htmlFor="CantidadImprimir" style={{ marginRight: '10px' }}>Cantidad</label>
                        <input
                            type='text'
                            id="canidadImprimir"
                            name="cantidadImprimir"
                            value={form.cantidadImprimir}
                            onChange={handleChange}
                            style={{
                                padding: '8px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                width: '100px',
                            }}
                        />
                    </div>
                )}

                <div>
                    <label htmlFor="Fecha" style={{ marginRight: '10px' }}>Fecha</label>
                    <input
                        type="text"
                        id="Fecha"
                        name="fecha"
                        value={form.fecha}
                        onChange={handleChange}
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
                    disabled={imprimiendo}
                >
                    Imprimir
                </button>
                <div>

                    <select name="impresora" id="impresora" onChange={handleChange} value={form.impresora}>
                        {impresoras.map((impresora) => (
                            <option key={impresora.iM_IPPRINTER} value={impresora.iM_IPPRINTER}>
                                {impresora.iM_DESCRIPTION_PRINTER}
                            </option>
                        ))}
                    </select>

                </div>
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

