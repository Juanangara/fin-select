import React, { useState } from "react";
import "./EstilosCss/Credito.css";
import { creditOptions } from "./ArreglosCredito"; // Asegúrate de ajustar la ruta
import { auth, dbRT } from "./firebase"; // Asegúrate de ajustar la ruta
import { ref, push } from "firebase/database";

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
  // Usamos una fecha fija como fecha de corte (por ejemplo, 14 de marzo de 2025)
  const fixedFechaCorte = "2025-03-14T00:00:00.000";
  const [fechaCorte, setFechaCorte] = useState(fixedFechaCorte);
  // Flag para evitar guardar actividad duplicada
  const [activitySaved, setActivitySaved] = useState(false);

  // Función que arma la consulta y la ejecuta al presionar el botón Buscar
  const handleBuscar = async () => {
    // Validamos que se hayan seleccionado todos los campos
    if (!selectedTipo || !selectedProducto || !selectedPlazo) {
      alert("Por favor, seleccione todos los campos");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Usamos la fecha fija como fecha de corte
      setFechaCorte(fixedFechaCorte);

      // Construimos la cláusula WHERE
      const whereClause = `tipo_de_cr_dito='${selectedTipo}'`;
      const additionalFilters = ` AND producto_de_cr_dito='${selectedProducto}' AND plazo_de_cr_dito='${selectedPlazo}'`;
      const dateFilter = ` AND fecha_corte='${fixedFechaCorte}'`;
      const where = whereClause + additionalFilters + dateFilter;

      // Parámetros de la consulta usando la fórmula ponderada:
      // sum(tasa_efectiva_promedio * montos_desembolsados)/sum(montos_desembolsados)
      const params = new URLSearchParams({
        $where: where,
        $select:
          "nombre_entidad, sum(tasa_efectiva_promedio * montos_desembolsados)/sum(montos_desembolsados) as tasa_promedio",
        $group: "nombre_entidad",
        $order: "tasa_promedio ASC",
        $limit: "5",
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
    // Obtener el usuario actual
    const user = auth.currentUser;
    if (!user) {
      alert("No hay usuario autenticado. Por favor, inicie sesión.");
      return;
    }

    // Solo se guarda la actividad si aún no se ha guardado para esta selección
    if (!activitySaved) {
      // Separamos nombre y apellido del displayName (suponiendo que están separados por espacio)
      const fullName = user.displayName || "Sin nombre";
      const nameParts = fullName.split(" ");
      
      const userDataToSave = {
        userId: user.uid,
        correo: user.email || "Sin correo", 
        selectedTipo, // Tipo de crédito seleccionado
        selectedProducto, // Producto seleccionado
        selectedPlazo, // Plazo seleccionado
        fecha: new Date().toISOString(),
      };

      // Guardamos en el nodo "userActivitiesCredito"
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

  // Formateamos la fecha de corte a un formato legible
  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Al presionar el botón "Mostrar", guardamos la actividad (si no se ha guardado) y mostramos resultados
  const handleShowResults = () => {
    // Verificar que se hayan seleccionado todos los campos
    if (!selectedTipo || !selectedProducto || !selectedPlazo) {
      alert("Por favor, seleccione todos los campos");
      return;
    }

    // Guardamos la actividad si aún no se ha guardado
    guardarActividad();

    // Ejecutamos la consulta a la API
    handleBuscar();
  };

  // Generamos opciones dinámicas:
  // Productos disponibles según el tipo seleccionado
  const productosDisponibles = selectedTipo
    ? Object.keys(creditOptions[selectedTipo].Productos)
    : [];
  // Plazos disponibles según el tipo y producto seleccionado
  const plazosDisponibles =
    selectedTipo && selectedProducto
      ? creditOptions[selectedTipo].Productos[selectedProducto]
      : [];

  return (
    <div className="tasa-cdt-container">
      <div className="tasa-cdt-header">
        <h2 className="tasa-cdt-title">Consulta de créditos</h2>
        {fechaCorte && <p className="tasa-cdt-fecha">Fecha de corte: {formatearFecha(fechaCorte)}</p>}
      </div>

      <div className="tasa-cdt-controls">
        <label className="tasa-cdt-label">
          Tipo de Crédito:
          <select
            className="tasa-cdt-select"
            value={selectedTipo}
            onChange={(e) => {
              setSelectedTipo(e.target.value);
              setSelectedProducto("");
              setSelectedPlazo("");
              setActivitySaved(false); // Reiniciamos para permitir guardar nueva actividad
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
        <div className="tasa-cdt-controls">
          <label className="tasa-cdt-label">
            Producto:
            <select
              className="tasa-cdt-select"
              value={selectedProducto}
              onChange={(e) => {
                setSelectedProducto(e.target.value);
                setSelectedPlazo("");
                setActivitySaved(false);
              }}
            >
              <option className="boton-seleccione" value="">
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
        <div className="tasa-cdt-controls">
          <label className="tasa-cdt-label">
            Plazo:
            <select
              className="tasa-cdt-select"
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

      <button className="tasa-cdt-button" onClick={handleShowResults}>
        Mostrar
      </button>

      {loading && <p className="tasa-cdt-loading">Cargando...</p>}
      {error && <p className="tasa-cdt-error">Error: {error}</p>}

      {results.length > 0 && (
        <div>
          <table className="tasa-cdt-table">
            <thead className="tasa-cdt-thead">
              <tr>
                <th className="tasa-cdt-th">Ranking</th>
                <th className="tasa-cdt-th">Entidad</th>
                <th className="tasa-cdt-th">Tasa (E.A.)</th>
              </tr>
            </thead>
            <tbody className="tasa-cdt-tbody">
              {results.map((item, index) => (
                <tr key={index} className="tasa-cdt-row">
                  <td className="tasa-cdt-cell">{index + 1}</td>
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

      <footer className="trm-footer">© 2025 Consulta de créditos</footer>
    </div>
  );
};

export default Credito;
