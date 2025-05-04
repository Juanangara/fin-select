// AuthOptions.js
import React from 'react';
import { useNavigate } from "react-router-dom";
import './EstilosCss/AuthOptions.css';
import finSelectLogo from './fin-select.png'; // Asegúrate de que la ruta sea correcta

function AuthOptions() {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="auth-content">
        <img src={finSelectLogo} alt="Fin Select" className="logo" />
        <button className="login-button" onClick={() => navigate("/login")}>
          Inciar Sesión
        </button>
        <p className="signup-text">
          ¿No tienes una cuenta?{" "}
          <span className="signup-link" onClick={() => navigate("/signin")}>
            Regístrate
          </span>
        </p>
      </div>
    </div>
  );
}

export default AuthOptions;
