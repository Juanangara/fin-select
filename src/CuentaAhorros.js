import React, { useState, useEffect } from 'react';
import './EstilosCss/CuentaAhorros.css';

// Importamos Firebase (asegúrate de ajustar la ruta)
import { auth, dbRT } from './firebase';
import { ref, push } from 'firebase/database';

const TRMFooter = () => {
  const [trm, setTrm] = useState(null);

  useEffect(() => {
    // Reemplaza la URL por la de una API real que devuelva la TRM
    fetch('https://www.datos.gov.co')
      .then(response => response.json())
      .then(data => {
        setTrm(data.trmValue);
      })
      .catch(error => {
        console.error("Error al obtener la TRM:", error);
      });
  }, []);

  return (
    <footer className="trm-footer">
      <p>TRM: {trm ? `${trm} COP/USD` : "Cargando TRM..."}</p>
    </footer>
  );
};

const CuentaAhorros = () => {
  const [data, setData] = useState(null);
  const [selectedOption, setSelectedOption] = useState('Seleccione una opción');
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [activitySaved, setActivitySaved] = useState(false);

  // Opciones fijas según lo solicitado
  const options = [
    'Seleccione una opción',
    'Depósitos de ahorro activos',
    'Depósitos de ahorro inactivos',
    'Cuenta de ahorro especial en pesos',
    'Cuentas de ahorro AFC en pesos',
    'Certificado de ahorro valor real'
  ];

  useEffect(() => {
    // Se asume que el archivo JSON se encuentra en la carpeta public
    fetch('/CuentaAhorroPersonaNatural.json')
      .then(response => response.json())
      .then(jsonData => {
        setData(jsonData);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error al cargar CuentaAhorroPersonaNatural.json:", error);
        setLoading(false);
      });
  }, []);

  // Cada vez que se cambie la opción, reiniciamos los resultados y el flag para guardar actividad
  const handleSelectChange = (e) => {
    setSelectedOption(e.target.value);
    setShowResults(false);
    setActivitySaved(false);
  };

  const handleShowResults = () => {
    if (selectedOption === 'Seleccione una opción') {
      alert('Debe seleccionar una opción');
      return;
    }

    // Obtenemos el usuario actual
    const user = auth.currentUser;
    if (!user) {
      alert('No hay usuario autenticado. Por favor inicie sesión.');
      return;
    }

    // Solo guardamos la actividad si aún no se ha guardado para esta selección
    if (!activitySaved) {
      // Extraer información del usuario (displayName, email, etc.)
      // Se puede obtener el nombre completo desde displayName, si se requiere se puede procesar
      const userDataToSave = {
        userId: user.uid,
        correo: user.email || 'Sin correo',
        opcionSeleccionada: selectedOption,
        fecha: new Date().toISOString()
      };

      push(ref(dbRT, 'userActivities'), userDataToSave)
        .then(() => {
          console.log('Actividad guardada con éxito');
          setActivitySaved(true);
        })
        .catch((error) => {
          console.error('Error al guardar la actividad:', error);
        });
    }

    setShowResults(true);
  };

  if (loading) return <div className="cuenta-ahorro-loading">Cargando...</div>;
  if (!data) return <div className="cuenta-ahorro-error">Error al cargar los datos.</div>;

  // Se asume que la fila de encabezado se encuentra en el índice 1 del JSON.
  // Si no se utiliza, se elimina la variable.
  // const headerRow = data[1];

  // Procesamos los datos a partir del índice 2, en pares: una fila para la entidad y la siguiente para las tasas.
  const pairedData = [];
  for (let i = 2; i < data.length; i += 2) {
    const entityRow = data[i];
    const ratesRow = data[i + 1];
    if (!ratesRow) break;
    const entidad = entityRow["ESTABLECIMIENTOS DE CRÉDITO\nTasas efectivas anuales con corte al 2025-03-14"];
    pairedData.push({
      entidad,
      "Depósitos de ahorro activos": ratesRow["Unnamed: 2"],
      "Depósitos de ahorro inactivos": ratesRow["Unnamed: 3"],
      "Cuenta de ahorro especial en pesos": ratesRow["Unnamed: 4"],
      "Cuentas de ahorro AFC en pesos": ratesRow["Unnamed: 5"],
      "Certificado de ahorro valor real": ratesRow["Unnamed: 6"],
    });
  }

  // Filtramos las filas que tengan entidad válida y que no sean notas
  const validData = pairedData.filter(item => item.entidad && !item.entidad.startsWith('•'));

  // Calculamos el ranking para la opción seleccionada.
  // Si el valor numérico es 0 (o "0" o "0.00%"), se mostrará "Sin datos".
  const rankedData = validData
    .map(item => {
      const originalValue = item[selectedOption];
      let rawValue = originalValue;
      if (rawValue == null) rawValue = "0 %";
      let rate = parseFloat(rawValue.toString().replace('%', '').trim());
      if (isNaN(rate)) rate = 0;
      const displayValue = rate === 0 ? "Sin datos" : rawValue;
      return {
        entidad: item.entidad,
        rate,
        displayValue,
      };
    })
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);

  return (
    <div className="cuenta-ahorro-container">
      <h1 className="cuenta-ahorro-title">Top 5 Mejores Tasas de Cuenta de Ahorro</h1>
      <div className="cuenta-ahorro-controls">
        <label htmlFor="option" className="cuenta-ahorro-label">Opción:</label>
        <select
          id="option"
          className="cuenta-ahorro-select"
          value={selectedOption}
          onChange={handleSelectChange}
        >
          {options.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button className="cuenta-ahorro-button" onClick={handleShowResults}>
          Mostrar
        </button>
      </div>
      {showResults && (
        <table className="cuenta-ahorro-table">
          <thead className="cuenta-ahorro-thead">
            <tr>
              <th className="cuenta-ahorro-th">Ranking</th>
              <th className="cuenta-ahorro-th">Entidad</th>
              <th className="cuenta-ahorro-th">Tasa</th>
            </tr>
          </thead>
          <tbody className="cuenta-ahorro-tbody">
            {rankedData.map((item, index) => (
              <tr key={index} className="cuenta-ahorro-row">
                <td className="cuenta-ahorro-cell">{index + 1}</td>
                <td className="cuenta-ahorro-cell">{item.entidad}</td>
                <td className="cuenta-ahorro-cell">{item.displayValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <TRMFooter />
    </div>
  );
};

export default CuentaAhorros;
