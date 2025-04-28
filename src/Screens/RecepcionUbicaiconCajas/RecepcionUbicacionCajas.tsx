import React, { useEffect, useMemo, useState } from 'react'
import { WmSApi } from '../../api/WMSapi'
import { RecepcionUbicacionCajasInterface, RecepcionUbicacionFiltro, ResumenCajasUnidadesTP } from '../../interfaces/RecepcionUbicacioncajas/RecepcionUbicacionCajasInterface'
import { useTable, Column } from 'react-table';
import * as XLSX from 'xlsx';

import { saveAs } from 'file-saver';

const RecepcionUbicacionCajas = () => {
  const [data, setData] = useState<RecepcionUbicacionCajasInterface[]>([])
  const [dataResumenTP, setDataResumenTP] = useState<ResumenCajasUnidadesTP[]>([])
  const [cargando, setCargando] = useState<boolean>(false)
  const [sincronizando, setSincronizando] = useState<boolean>(false)
  const [descargando, setDescargando] = useState<boolean>(false)


  const [page, setPage] = useState<number>(0)
  const [anio, setAnio] = useState<string>('')
  const [lote, setLote] = useState<string>('')
  const [orden, setOrden] = useState<string>('')
  const [articulo, setArticulo] = useState<string>('')
  const [talla, setTalla] = useState<string>('')
  const [ubicacion, setUbicacion] = useState<string>('')
  const [color, setColor] = useState<string>('')
  //const [tipo, setTipo] = useState<boolean>(true)
  const [Tipo, setTipo] = useState<{ key: string, value: string }[]>(
    [
      { key: 'DENIM', value: 'DENIM' },
      { key: 'TP', value: 'TP' },
      { key: 'MB', value: 'MB' }
    ])

  const [totalPages, setTotalPages] = useState<number>(1)
  const [tiposelected, settiposelected] = useState<string>('DENIM')
  const sync = async () => {
    setSincronizando(true)
    try {

      await WmSApi.get<RecepcionUbicacionCajasInterface[]>(`RecepcionUbicacionCajasSync/${tiposelected}`)
    } catch (err) {

    }
    setSincronizando(false)
  }
  const getData = async () => {
    setCargando(true)
    try {
      let filtro: RecepcionUbicacionFiltro = {
        lote,
        orden,
        articulo,
        talla,
        color,
        ubicacion,
        page,
        size: 50,
        tipo: tiposelected
      }
      await WmSApi.post<RecepcionUbicacionCajasInterface[]>(`RecepcionUbicacionCajas`, filtro)
        .then(resp => {
          setData(resp.data)
          setTotalPages(resp.data[0].paginas)
        })

      if (tiposelected == "TP") {
        await WmSApi.post<ResumenCajasUnidadesTP[]>(`ResumenCajasUnidadesTP`, filtro)
          .then(resp => {
            setDataResumenTP(resp.data)
          })
      }
    } catch (err) {

    }
    setCargando(false)
  }

  const handleDownload = async () => {
    setDescargando(true)
    let datos: RecepcionUbicacionCajasInterface[] = []
    try {
      let filtro: RecepcionUbicacionFiltro = {
        lote,
        orden,
        articulo,
        talla,
        color,
        ubicacion,
        page,
        size: 200000,
        tipo: tiposelected

      }
      await WmSApi.post<RecepcionUbicacionCajasInterface[]>(`RecepcionUbicacionCajas`, filtro).then(resp => {
        datos = resp.data
      })
      // Convertir el JSON en una hoja de cálculo
      const worksheet = XLSX.utils.json_to_sheet(datos);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

      // Generar el archivo de Excel y crear un Blob
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

      // Usar file-saver para descargar el archivo
      saveAs(blob, 'Recepcion Cajas.xlsx');
    } catch (err) {

    }


    setDescargando(false)
  };

  const abrir = () => {
    const element = document.createElement('a')
    element.target = '_blank'
    element.href = 'http://10.100.2.17:8090/'
    document.body.appendChild(element)

    if (element) {
      element.click()
    }

    document.body.removeChild(element)
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
      <h2 style={{ textAlign: 'center' }}>Recepcion Ubicacion Cajas</h2>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', gap: '10px' }}>
        <div style={{ padding: '20px' }}>
          <label>
            <select
              name='Tipo'
              value={tiposelected}
              onChange={(val) => settiposelected(val.target.value)}
            >
              {Tipo.map(element => {

                return (
                  <option value={element.value}>{element.value}</option>
                )
              })}
            </select>

          </label>
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
              width: '100px',
            }}
          />
        </div>
        <div>
          <label htmlFor="orden" style={{ marginRight: '10px' }}>Orden:</label>
          <input
            type="text"
            id="orden"
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              width: '100px',
            }}
          />
        </div>

        <div>
          <label htmlFor="articulo" style={{ marginRight: '10px' }}>Articulo:</label>
          <input
            type="text"
            id="articulo"
            value={articulo}
            onChange={(e) => setArticulo(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              width: '100px',
            }}
          />
        </div>

        <div>
          <label htmlFor="talla" style={{ marginRight: '10px' }}>Talla:</label>
          <input
            type="text"
            id="talla"
            value={talla}
            onChange={(e) => setTalla(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              width: '100px',
            }}
          />
        </div>
        <div>
          <label htmlFor="color" style={{ marginRight: '10px' }}>Color:</label>
          <input
            type="text"
            id="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
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
            onChange={(e) => setUbicacion(e.target.value)}
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
        {
          tiposelected == 'MB' &&
          <button
            onClick={abrir}
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
            Despacho MB
          </button>
        }

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
        {
          tiposelected == 'DENIM' &&
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
        }



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
      <div>
        {
          tiposelected == "TP" && dataResumenTP.length > 0 &&
          <div>
            <table border={1}>
              <thead>
                <td>Talla</td>
                <td>Cajas</td>
                <td>Unidades</td>
              </thead>
              <tbody>
                {
                  dataResumenTP.map(element =>
                  (
                    <tr>
                      <td>{element.talla}</td>
                      <td>{element.cajas}</td>
                      <td>{element.unidades}</td>
                    </tr>
                  )
                  )
                }
              </tbody>
            </table>
          </div>
        }
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
