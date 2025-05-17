import React, { useState, useEffect } from "react";
import "./EstilosCss/TasaCDT.css";

import { auth, dbRT } from "./firebase"; // Ajusta la ruta según tu estructura
import { ref, push } from "firebase/database";
import finSelectLogo from "./fin-select.png";

const TasaCDT = () => {
  const [cdtData, setCdtData] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState("Seleccione una opción");
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [activitySaved, setActivitySaved] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false); // Estado para controlar "Ver más" y "Ver menos"

  useEffect(() => {
    // Se asume que CDT.json se encuentra en la carpeta public
    fetch("/CDT.json")
      .then((response) => response.json())
      .then((data) => {
        setCdtData(data);
        setLoading(false);
        // Configuración inicial: usamos la fila de encabezados (índice 2)
        const headerRow = data[2];
        const termKeys = Object.keys(headerRow).filter(
          (key) =>
            key !==
              "ESTABLECIMIENTOS DE CRÉDITO\nTasas efectivas anuales con corte al 2025-04-29" &&
            key !== "Unnamed: 0"
        );
        // Si no hay términos, dejamos la opción por defecto
        if (termKeys.length === 0) {
          setSelectedTerm("");
        }
      })
      .catch((error) => {
        console.error("Error al cargar CDT.json:", error);
        setLoading(false);
      });
  }, []);

  const handleSelectChange = (e) => {
    setSelectedTerm(e.target.value);
    setShowResults(false);
    // Reiniciamos el flag para guardar actividad cuando se cambie la opción
    setActivitySaved(false);
  };

  const handleShowResults = () => {
    // Verificar que se haya seleccionado una opción válida
    if (selectedTerm === "Seleccione una opción" || !selectedTerm) {
      alert("Debe seleccionar una opción");
      return;
    }

    // Obtener el usuario actual
    const user = auth.currentUser;
    if (!user) {
      alert("No hay usuario autenticado. Por favor inicie sesión.");
      return;
    }

    // Solo guardar la actividad si aún no se ha guardado para esta selección
    if (!activitySaved) {
      // Preparamos la información a guardar en la base de datos
      const userDataToSave = {
        userId: user.uid,
        correo: user.email || "Sin correo",
        selectedTerm, // Opción seleccionada (plazo)
        cdt: "CDT",
        fecha: new Date().toISOString(),
      };

      // Guardamos la actividad en la Realtime Database
      push(ref(dbRT, "userActivitiesTasaCDT"), userDataToSave)
        .then(() => {
          console.log("Actividad guardada con éxito");
          // Marcamos que ya se ha guardado la actividad para evitar duplicados
          setActivitySaved(true);
        })
        .catch((error) => {
          console.error("Error al guardar la actividad:", error);
        });
    }

    // Mostramos los resultados
    setShowResults(true);
  };

  if (loading) return <div className="tasa-cdt-loading">Cargando...</div>;
  if (!cdtData)
    return <div className="tasa-cdt-error">Error al cargar los datos.</div>;

  // Extraemos el header y definimos la clave de identidad
  const headerRow = cdtData[2];
  const identityColumnKey =
    "ESTABLECIMIENTOS DE CRÉDITO\nTasas efectivas anuales con corte al 2025-04-29";
  const termKeys = Object.keys(headerRow).filter(
    (key) => key !== identityColumnKey && key !== "Unnamed: 0"
  );

  // Encontramos la clave correspondiente al plazo seleccionado
  const selectedTermKey = termKeys.find(
    (key) => headerRow[key] === selectedTerm
  );

  // Obtenemos las filas de datos (desde la fila 3 en adelante), descartando filas sin información o notas.
  const dataRows = cdtData.slice(3).filter((row) => {
    const identidad = row[identityColumnKey];
    return identidad && !identidad.startsWith("•");
  });

  // Calculamos las tasas numéricas para el plazo seleccionado, comprobando valores nulos y ordenamos de mayor a menor.
  const rankedData = dataRows
    .map((row) => {
      let rawValue = row[selectedTermKey];
      if (rawValue === "-" || rawValue == null) rawValue = "sin datos"; // Reemplazar "-" o nulos por "sin datos"
      let rate = parseFloat(rawValue.toString().replace("%", "").trim());
      if (isNaN(rate)) {
        rate = 0;
      }
      return {
        identidad: row[identityColumnKey],
        rate,
        rawValue,
      };
    })
    .sort((a, b) => b.rate - a.rate)
    .slice(0, -1); // Excluir la última fila de la tabla
  return (
    <div className="tasa-cdt-container">
      {/* 1. Logo primero */}
      <div className="logo-header">
        <img src={finSelectLogo} alt="Fin Select" className="logoTasaCDT" />
      </div>

      {/* 2. Título a continuación */}
      <h1 className="tasa-cdt-title">Mejores tasas‑CDT</h1>

      {/* 3. Controles después del título */}
      <div className="tasa-cdt-controls">
        <label htmlFor="term" className="tasa-cdt-label">
          Plazo:
        </label>
        <select
          id="term"
          className="tasa-cdt-select"
          value={selectedTerm}
          onChange={handleSelectChange}
        >
          <option value="">Seleccione una opción</option>
          {termKeys.map((key, index) => (
            <option key={index} value={headerRow[key]}>
              {headerRow[key]}
            </option>
          ))}
        </select>
        <button className="tasa-cdt-button" onClick={handleShowResults}>
          Mostrar
        </button>
      </div>

      {/* 4. Resultados */}
      {showResults && (
        <div className="tasa-cdt-table-wrapper">
          <table className="tasa-cdt-table">
            <thead className="tasa-cdt-thead">
              <tr>
                <th className="tasa-cdt-th">Ranking</th>
                <th className="tasa-cdt-th">Entidad</th>
                <th className="tasa-cdt-th">Tasa</th>
              </tr>
            </thead>
            <tbody className="tasa-cdt-tbody">
              {rankedData
                .slice(0, showAllResults ? rankedData.length : 5)
                .map((item, index) => (
                  <tr key={index} className="tasa-cdt-row">
                    <td className="tasa-cdt-cell">{index + 1}</td>
                    <td className="tasa-cdt-cell">{item.identidad}</td>
                    <td className="tasa-cdt-cell">{item.rawValue}</td>
                  </tr>
                ))}
            </tbody>
          </table>

          <button
            className="tasa-cdt-button tasa-cdt-showmore"
            onClick={() => setShowAllResults(!showAllResults)}
          >
            {showAllResults ? "Ver menos" : "Ver más"}
          </button>
        </div>
      )}
    </div>
  );
};

export default TasaCDT;
