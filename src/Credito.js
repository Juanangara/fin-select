import React, { useState } from "react";
import "./EstilosCss/Credito.css";
import { creditOptions } from "./ArreglosCredito"; // Ajusta la ruta
import { auth, dbRT } from "./firebase"; // Ajusta la ruta
import { ref, push } from "firebase/database";
import finSelectLogo from "./fin-select.png";


const Credito = () => {
  // Obtenemos los tipos disponibles (las claves del objeto creditOptions)
  const tiposDisponibles = Object.keys(creditOptions);

  // Estados para cada nivel de selección
  const [selectedTipo, setSelectedTipo] = useState("");
  const [selectedProducto, setSelectedProducto] = useState("");
  const [selectedPlazo, setSelectedPlazo] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Estado para guardar la fecha de corte utilizada
  const [fechaCorte, setFechaCorte] = useState("");
  // Flag para evitar guardar actividad duplicada
  const [activitySaved, setActivitySaved] = useState(false);
  // Estado para controlar la visualización de los resultados
  const [showAllResults, setShowAllResults] = useState(false);

  // Función para obtener las 2 fechas de corte más recientes
  const fetchFechasCorte = async () => {
    const url =
      "https://www.datos.gov.co/resource/w9zh-vetq.json?$select=fecha_corte&$order=fecha_corte DESC&$limit=2";
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Error al obtener las fechas de corte");
    }
    const data = await response.json();
    return data.map((item) => item.fecha_corte);
  };

  // Función que obtiene la penúltima fecha de corte y ejecuta la consulta con ella
  const handleBuscar = async () => {
    if (!selectedTipo || !selectedProducto || !selectedPlazo) {
      alert("Por favor, seleccione todos los campos");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fechas = await fetchFechasCorte();
      let fechaSeleccionada = "";
      if (fechas.length >= 2) {
        // Usamos la penúltima fecha (índice 1)
        fechaSeleccionada = fechas[1];
      } else if (fechas.length > 0) {
        fechaSeleccionada = fechas[0];
      }
      setFechaCorte(fechaSeleccionada);

      const whereClause = `tipo_de_cr_dito='${selectedTipo}'`;
      const additionalFilters = ` AND producto_de_cr_dito='${selectedProducto}' AND plazo_de_cr_dito='${selectedPlazo}'`;
      const dateFilter = ` AND fecha_corte='${fechaSeleccionada}'`;
      const where = whereClause + additionalFilters + dateFilter;

      const params = new URLSearchParams({
        "$where": where,
        "$select":
          "nombre_entidad, sum(tasa_efectiva_promedio * montos_desembolsados)/sum(montos_desembolsados) as tasa_promedio",
        "$group": "nombre_entidad",
        "$order": "tasa_promedio ASC",
      });

      const response = await fetch(
        `https://www.datos.gov.co/resource/w9zh-vetq.json?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Error al consultar la API");
      }
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para guardar la actividad del usuario (filtros y datos personales)
  const guardarActividad = () => {
    const user = auth.currentUser;
    if (!user) {
      alert("No hay usuario autenticado. Por favor, inicie sesión.");
      return;
    }
    if (!activitySaved) {
      const userDataToSave = {
        userId: user.uid,
        correo: user.email || "Sin correo",
        telefono: user.phoneNumber || "Sin teléfono",
        selectedTipo,
        selectedProducto,
        selectedPlazo,
        fecha: new Date().toISOString(),
      };

      push(ref(dbRT, "userActivitiesCredito"), userDataToSave)
        .then(() => {
          console.log("Actividad guardada con éxito");
          setActivitySaved(true);
        })
        .catch((error) => {
          console.error("Error al guardar la actividad:", error);
        });
    }
  };

  // Al presionar "Mostrar", se guarda la actividad y se ejecuta la consulta usando la penúltima fecha de corte
  const handleShowResults = async () => {
    if (!selectedTipo || !selectedProducto || !selectedPlazo) {
      alert("Por favor, seleccione todos los campos");
      return;
    }
    guardarActividad();
    await handleBuscar();
  };

  // Opciones dinámicas:
  const productosDisponibles = selectedTipo ? Object.keys(creditOptions[selectedTipo].Productos) : [];
  const plazosDisponibles =
    selectedTipo && selectedProducto ? creditOptions[selectedTipo].Productos[selectedProducto] : [];

  // Función para formatear la fecha de corte a un formato legible
  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="credit-container">
      <div className="logo-header">
        <img src={finSelectLogo} alt="Fin Select" className="logo" />
      </div>
  
      <div className="credit-header">
        <h2 className="credit-title">Créditos</h2>
        {fechaCorte && (
          <p className="credit-date">
            Fecha de corte: {formatearFecha(fechaCorte)}
          </p>
        )}
      </div>
  
      {/* wrapper que crea el grid de 2 cols + 1 col */}
      <div className="controls-wrapper">
        <div className="credit-controls">
          <label className="credit-label">
            Tipo de Crédito:
            <select
              className="credit-select"
              value={selectedTipo}
              onChange={(e) => {
                setSelectedTipo(e.target.value);
                setSelectedProducto("");
                setSelectedPlazo("");
                setActivitySaved(false);
              }}
            >
              <option value="">Seleccione</option>
              {tiposDisponibles.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </label>
        </div>
  
        {selectedTipo && (
          <div className="credit-controls">
            <label className="credit-label">
              Producto:
              <select
                className="credit-select"
                value={selectedProducto}
                onChange={(e) => {
                  setSelectedProducto(e.target.value);
                  setSelectedPlazo("");
                  setActivitySaved(false);
                }}
              >
                <option value="">Seleccione</option>
                {productosDisponibles.map((prod) => (
                  <option key={prod} value={prod}>
                    {prod}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
  
        {selectedProducto && (
          <div className="credit-controls">
            <label className="credit-label">
              Plazo:
              <select
                className="credit-select"
                value={selectedPlazo}
                onChange={(e) => {
                  setSelectedPlazo(e.target.value);
                  setActivitySaved(false);
                }}
              >
                <option value="">Seleccione</option>
                {plazosDisponibles.map((plazo, index) => (
                  <option key={index} value={plazo}>
                    {plazo}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>
  
      <button className="credit-button" onClick={handleShowResults}>
        Mostrar
      </button>
  
      {loading && <p className="credit-loading">Cargando...</p>}
      {error && <p className="credit-error">Error: {error}</p>}
  
      {results.length > 0 && (
        <div>
          <table className="credit-table">
            <thead className="credit-table-head">
              <tr>
                <th className="credit-table-th">Ranking</th>
                <th className="credit-table-th">Entidad</th>
                <th className="credit-table-th">Tasa (E.A.)</th>
              </tr>
            </thead>
            <tbody className="credit-table-body">
              {results
                .slice(0, showAllResults ? results.length : 5)
                .map((item, index) => (
                  <tr key={index} className="credit-table-row">
                    <td className="credit-table-cell">{index + 1}</td>
                    <td className="credit-table-cell">{item.nombre_entidad}</td>
                    <td className="credit-table-cell">
                      {parseFloat(item.tasa_promedio).toFixed(1)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <button
            className="credit-button"
            onClick={() => setShowAllResults(!showAllResults)}
          >
            {showAllResults ? "Ver menos" : "Ver más"}
          </button>
        </div>
      )}
    </div>
  );
  
};

export default Credito;
