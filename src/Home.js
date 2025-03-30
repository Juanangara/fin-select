// Home.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase"; // Importa Firebase
import "./EstilosCss/Home.css";
import finSelectLogo from "./fin-select.png";

function Home() {
  const navigate = useNavigate();

  const handleCredito = () => {
    navigate("/credito");
  };

  const handleCDT = () => {
    navigate("/Tasa CDT");
  };

  // Nueva función para Cuenta de ahorros
  const handleCuentaAhorros = () => {
    navigate("/CuentaAhorros");
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <img src={finSelectLogo} alt="Fin Select" className="home-logo" />
      </div>

      <div className="home-content">
        <button className="home-button" onClick={handleCredito}>
          Créditos
        </button>

        <button className="home-button" onClick={handleCDT}>
          Tasas-CDT
        </button>

        {/* Nuevo botón para Cuenta de ahorros */}
        <button className="home-button" onClick={handleCuentaAhorros}>
          Cuenta de ahorros
        </button>

        <button className="home-button logout-button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default Home;
