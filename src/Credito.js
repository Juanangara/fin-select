import React, { useState, useEffect, useCallback } from "react";
import "./EstilosCss/Credito.css";
import { creditOptions } from "./ArreglosCredito";
import { auth, dbRT } from "./firebase";
import { ref, push } from "firebase/database";
import finSelectLogo from "./fin-select.png";

// Función auxiliar para formatear la fecha (fuera del componente para evitar re-creación)
const formatearFecha = (fechaISO) => {
  if (!fechaISO) return "";
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const Credito = () => {
  const tiposDisponibles = Object.keys(creditOptions);

  const [selectedTipo, setSelectedTipo] = useState("");
  const [selectedProducto, setSelectedProducto] = useState("");
  const [selectedPlazo, setSelectedPlazo] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fechaCorte, setFechaCorte] = useState("");
  const [activitySavedForSelection, setActivitySavedForSelection] = useState({});
  const [showAllResults, setShowAllResults] = useState(false);

  const [availableCutoffDates, setAvailableCutoffDates] = useState([]);

  // useEffect para obtener las fechas de corte una sola vez al montar el componente
  useEffect(() => {
    const fetchCutoffDates = async () => {
      try {
        // La API devuelve las fechas ordenadas de más reciente a más antigua
        const url =
          "https://www.datos.gov.co/resource/w9zh-vetq.json?$select=fecha_corte&$order=fecha_corte DESC&$limit=2";
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Error al obtener las fechas de corte");
        }
        const data = await response.json();
        setAvailableCutoffDates(data.map((item) => item.fecha_corte));
      } catch (err) {
        console.error("Error al cargar fechas de corte:", err);
        setError("No se pudieron cargar las fechas de corte iniciales.");
      }
    };
    fetchCutoffDates();
  }, []);

  // --- MODIFICACIÓN CLAVE AQUÍ ---
  // Función para obtener la fecha de corte preferida (primero la última, luego la penúltima)
  const getSelectedCutoffDate = useCallback(() => {
    if (availableCutoffDates.length > 0) {
      return availableCutoffDates[0]; // **Prioridad 1: Usa la última fecha de corte (índice 0)**
    }
    // Si no hay última fecha (ej. array vacío), no hay nada que devolver
    return "";
  }, [availableCutoffDates]);
  // --- FIN MODIFICACIÓN CLAVE ---


  // Función para guardar la actividad del usuario (memoizada con useCallback)
  const guardarActividad = useCallback(() => {
    const user = auth.currentUser;
    if (!user) {
      setError("No hay usuario autenticado. Por favor, inicie sesión.");
      return;
    }

    const currentSelectionKey = `${selectedTipo}-${selectedProducto}-${selectedPlazo}`;

    if (!activitySavedForSelection[currentSelectionKey]) {
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
          setActivitySavedForSelection((prev) => ({
            ...prev,
            [currentSelectionKey]: true,
          }));
        })
        .catch((err) => {
          console.error("Error al guardar la actividad:", err);
          setError("Error al guardar su actividad. Intente de nuevo.");
        });
    }
  }, [selectedTipo, selectedProducto, selectedPlazo, activitySavedForSelection]);

  // Función principal para buscar (memoizada con useCallback)
  const handleBuscar = useCallback(async () => {
    if (!selectedTipo || !selectedProducto || !selectedPlazo) {
      setError("Por favor, seleccione todos los campos.");
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const fechaSeleccionada = getSelectedCutoffDate();
      if (!fechaSeleccionada) {
        throw new Error(
          "No se encontró una fecha de corte válida para la consulta. Verifique la disponibilidad de datos."
        );
      }
      setFechaCorte(fechaSeleccionada);

      const whereClause = `tipo_de_cr_dito='${selectedTipo}' AND producto_de_cr_dito='${selectedProducto}' AND plazo_de_cr_dito='${selectedPlazo}'`;
      const dateFilter = `fecha_corte='${fechaSeleccionada}'`;
      const fullWhere = `${whereClause} AND ${dateFilter}`;

      const params = new URLSearchParams({
        $where: fullWhere,
        $select:
          "nombre_entidad, sum(tasa_efectiva_promedio * montos_desembolsados)/sum(montos_desembolsados) as tasa_promedio",
        $group: "nombre_entidad",
        $order: "tasa_promedio ASC",
      });

      const response = await fetch(
        `https://www.datos.gov.co/resource/w9zh-vetq.json?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(
          `Error al consultar la API: ${response.status} ${response.statusText}`
        );
      }
      const data = await response.json();

      if (data.length === 0) {
        setError("No se encontraron resultados para los filtros seleccionados.");
        setResults([]);
      } else {
        setResults(data);
      }
    } catch (err) {
      console.error("Error en handleBuscar:", err);
      setError(`Ocurrió un error al cargar los datos: ${err.message}.`);
      setResults([]);
    } finally {
      setLoading(false);
      setShowAllResults(false);
    }
  }, [selectedTipo, selectedProducto, selectedPlazo, getSelectedCutoffDate]);

  // La función handleShowResults ahora coordina las dos acciones
  const handleShowResults = async () => {
    if (!selectedTipo || !selectedProducto || !selectedPlazo) {
      setError("Por favor, seleccione todos los campos.");
      return;
    }

    guardarActividad();
    await handleBuscar();
  };

  const productosDisponibles = selectedTipo
    ? Object.keys(creditOptions[selectedTipo]?.Productos || {})
    : [];
  const plazosDisponibles =
    selectedTipo && selectedProducto
      ? creditOptions[selectedTipo]?.Productos[selectedProducto] || []
      : [];

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
                setError(null);
                setResults([]);
              }}
            >
              <option value="" disabled>
                Seleccione
              </option>
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
                  setError(null);
                  setResults([]);
                }}
              >
                <option value="" disabled>
                  Seleccione
                </option>
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
                  setSelectedPlazo(e.target.value);
                  setError(null);
                  setResults([]);
                }}
              >
                <option value="" disabled>
                  Seleccione
                </option>
                {plazosDisponibles.map((plazo, index) => (
                  <option key={plazo} value={plazo}>
                    {plazo}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      <button
        className="credit-button"
        onClick={handleShowResults}
        disabled={loading || !selectedTipo || !selectedProducto || !selectedPlazo}
      >
        {loading ? "Buscando..." : "Mostrar"}
      </button>

      {loading && <p className="credit-loading">Cargando...</p>}
      {error && <p className="credit-error">Error: {error}</p>}

      {results.length > 0 && (
        <div className="credit-results-section">
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
                  <tr key={item.nombre_entidad || index} className="credit-table-row">
                    <td className="credit-table-cell">{index + 1}</td>
                    <td className="credit-table-cell">{item.nombre_entidad}</td>
                    <td className="credit-table-cell">
                      {parseFloat(item.tasa_promedio).toFixed(2)}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {results.length > 5 && (
            // ***** CAMBIO AQUÍ: Envuelto el botón en el nuevo div *****
            <div className="credit-toggle-link-container">
              <button
                className="credit-button credit-toggle-results"
                onClick={() => setShowAllResults(!showAllResults)}
              >
                {showAllResults ? "Ver menos" : "Ver más"}
              </button>
            </div>
            // **********************************************************
          )}
        </div>
      )}
    </div>
  );
};

export default Credito;