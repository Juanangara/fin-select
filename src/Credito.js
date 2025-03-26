import React, { useState } from 'react';
import './EstilosCss/Credito.css';
import { creditOptions } from './ArreglosCredito'; // Asegúrate de ajustar la ruta

const Credito = () => {
  // Obtenemos los tipos disponibles (las claves del objeto creditOptions)
  const tiposDisponibles = Object.keys(creditOptions);

  // Estados para cada nivel de selección
  const [selectedTipo, setSelectedTipo] = useState('');
  const [selectedProducto, setSelectedProducto] = useState('');
  const [selectedPlazo, setSelectedPlazo] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fechaCorte, setFechaCorte] = useState('');

  // Función para obtener la última fecha de corte
  const fetchLastFechaCorte = async () => {
    const url = 'https://www.datos.gov.co/resource/w9zh-vetq.json?$order=fecha_corte DESC&$limit=1';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Error al obtener la última fecha de corte');
    }
    const data = await response.json();
    return data[0]?.fecha_corte;
  };

  // Función que arma la consulta y la ejecuta al presionar el botón Buscar
  const handleBuscar = async () => {
    // Validamos que se hayan seleccionado todos los campos
    if (!selectedTipo || !selectedProducto || !selectedPlazo) {
      alert('Por favor, seleccione todos los campos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Obtenemos la última fecha de corte
      const lastFechaCorte = await fetchLastFechaCorte();
      if (!lastFechaCorte) {
        throw new Error('No se encontró la última fecha de corte');
      }
      setFechaCorte(lastFechaCorte);

      // Construimos la cláusula where
      const whereClause = `tipo_de_cr_dito='${selectedTipo}'`;
      const additionalFilters = ` AND producto_de_cr_dito='${selectedProducto}' AND plazo_de_cr_dito='${selectedPlazo}'`;
      const dateFilter = ` AND fecha_corte='${lastFechaCorte}'`;
      const where = whereClause + additionalFilters + dateFilter;

      // Parámetros de la consulta usando la fórmula ponderada
      const params = new URLSearchParams({
        '$where': where,
        '$select': 'nombre_entidad, sum(tasa_efectiva_promedio * montos_desembolsados)/sum(montos_desembolsados) as tasa_promedio',
        '$group': 'nombre_entidad',
        '$order': 'tasa_promedio ASC',
        '$limit': '5'
      });

      const response = await fetch(`https://www.datos.gov.co/resource/w9zh-vetq.json?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Error al consultar la API');
      }
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generamos opciones dinámicas:
  // Productos disponibles según el tipo seleccionado
  const productosDisponibles = selectedTipo ? Object.keys(creditOptions[selectedTipo].Productos) : [];
  // Plazos disponibles según el tipo y producto seleccionado
  const plazosDisponibles = selectedTipo && selectedProducto ? creditOptions[selectedTipo].Productos[selectedProducto] : [];

  return (
    <div className="tasa-cdt-container">
      <div className="tasa-cdt-header">
        <h2 className="tasa-cdt-title">Consulta de Créditos</h2>
        {fechaCorte && <p className="tasa-cdt-fecha">Fecha de corte: {fechaCorte}</p>}
      </div>

      <div className="tasa-cdt-controls">
        <label className="tasa-cdt-label">
          Tipo de Crédito:
          <select
            className="tasa-cdt-select"
            value={selectedTipo}
            onChange={(e) => {
              setSelectedTipo(e.target.value);
              setSelectedProducto('');
              setSelectedPlazo('');
            }}
          >
            <option value="">Seleccione</option>
            {tiposDisponibles.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </label>
      </div>

      {selectedTipo && (
        <div className="tasa-cdt-controls">
          <label className="tasa-cdt-label">
            Producto:
            <select
              className="tasa-cdt-select"
              value={selectedProducto}
              onChange={(e) => {
                setSelectedProducto(e.target.value);
                setSelectedPlazo('');
              }}
            >
              <option value="">Seleccione</option>
              {productosDisponibles.map(prod => (
                <option key={prod} value={prod}>{prod}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {selectedProducto && (
        <div className="tasa-cdt-controls">
          <label className="tasa-cdt-label">
            Plazo:
            <select
              className="tasa-cdt-select"
              value={selectedPlazo}
              onChange={(e) => setSelectedPlazo(e.target.value)}
            >
              <option value="">Seleccione</option>
              {plazosDisponibles.map((plazo, index) => (
                <option key={index} value={plazo}>{plazo}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      <button className="tasa-cdt-button" onClick={handleBuscar}>Buscar</button>

      {loading && <p className="tasa-cdt-loading">Cargando...</p>}
      {error && <p className="tasa-cdt-error">Error: {error}</p>}

      {results.length > 0 && (
        <div>
          <table className="tasa-cdt-table">
            <thead className="tasa-cdt-thead">
              <tr>
                <th className="tasa-cdt-th">Entidad</th>
                <th className="tasa-cdt-th">Tasa (E.A.)</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item, index) => (
                <tr key={index} className="tasa-cdt-row">
                  <td className="tasa-cdt-cell">{item.nombre_entidad}</td>
                  <td className="tasa-cdt-cell">
                    {parseFloat(item.tasa_promedio).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <footer className="trm-footer">
        © 2025 Consulta de Créditos
      </footer>
    </div>
  );
};

export default Credito;
