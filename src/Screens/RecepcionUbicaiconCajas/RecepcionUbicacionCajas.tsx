import React, { useEffect, useMemo, useState } from 'react'
import { WmSApi } from '../../api/WMSapi'
import { RecepcionUbicacionCajasInterface } from '../../interfaces/RecepcionUbicacioncajas/RecepcionUbicacionCajasInterface'
import { useTable, usePagination, Column } from 'react-table';

const RecepcionUbicacionCajas = () => {
  const [data, setData] = useState<RecepcionUbicacionCajasInterface[]>([])
  const [cargando, setCargando] = useState<boolean>(false)
  const [sincronizando, setSincronizando] = useState<boolean>(false)

  const [page, setPage] = useState<number>(0)
  const [anio, setAnio] = useState<string>('')
  const [lote, setLote] = useState<string>('1223G')
  const [totalPages, setTotalPages] = useState<number>(1)

  const sync = async () => {
    setSincronizando(true)
    try {
      await WmSApi.get<RecepcionUbicacionCajasInterface[]>(`RecepcionUbicacionCajas`)
    } catch (err) {

    }
    setSincronizando(false)
  }
  const getData = async () => {
    setCargando(true)
    try {
      await WmSApi.get<RecepcionUbicacionCajasInterface[]>(`RecepcionUbicacionCajas/${anio}/${lote}/${page-1}/50`)
        .then(resp => {
          setData(resp.data)
          setTotalPages(resp.data[0].paginas)
        })
    } catch (err) {

    }
    setCargando(false)
  }

  const columns: Column<RecepcionUbicacionCajasInterface>[] = useMemo(
    () => [
      {
        Header: 'Lote',
        accessor: 'lote',
      },
      {
        Header: 'Orden',
        accessor: 'op',
      },
      {
        Header: 'Articulo',
        accessor: 'articulo',
      },
      {
        Header: 'Numero de Caja',
        accessor: 'numeroDeCaja',
      },
      {
        Header: 'Talla',
        accessor: 'talla',
      },
      {
        Header: 'Cantidad en Caja',
        accessor: 'cantidadEnCaja',
      },
      {
        Header: 'Fecha de Envio',
        accessor: 'fechaDeEnvio',
      },
      {
        Header: 'Fecha de Recepcion',
        accessor: 'fechaDeRecepcion',
      },
      {
        Header: 'Color',
        accessor: 'color',
      },
      {
        Header: 'Ubicacion',
        accessor: 'ubicacion',
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
      <h2 style={{textAlign: 'center'}}>Recepcion Ubicacion Cajas</h2>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', gap: '10px' }}>
        <div>
          <label htmlFor="page" style={{ marginRight: '10px' }}>Pagina:</label>
          <input
            type="number"
            id="page"
            value={page}
            min={1}
            max={totalPages+1}
            step={1}
            onChange={(e) => setPage(parseInt(e.target.value!= ''?e.target.value:'0' ))}
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              width: '30px',
            }}
          />
          <span>/{totalPages+1}</span>
        </div>
        <div>
          <label htmlFor="year" style={{ marginRight: '10px' }}>Año:</label>
          <input
            type="text"
            id="year"
            value={anio}
            onChange={(e) => setAnio(e.target.value.replace(/\D/, ''))} // Solo permite valores numéricos
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              width: '100px',
            }}
          />
        </div>
        <div>
          <label htmlFor="lote" style={{ marginRight: '10px' }}>Lote:</label>
          <input
            type="text"
            id="lote"
            value={lote}
            onChange={(e) => setLote(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              width: '200px',
            }}
          />
        </div>
        <button
          onClick={()=>{
            getData()
            setPage(1)
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

export default RecepcionUbicacionCajas
