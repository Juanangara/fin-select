// Login.js
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import "./EstilosCss/Login.css";
import finSelectLogo from "./fin-select.png";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (err) {
      setError("Correo o contraseña inválida");
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <img src={finSelectLogo} alt="Fin Select" className="logo" />
      </div>
      <div className="login-content">
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button">
            Iniciar Sesión
          </button>
        </form>

        {/* Volver */}
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/")}
        >
          Volver
        </button>

        {/* Nueva línea de Olvidaste tu contraseña */}
        <p className="signup-text">
          ¿Olvidaste tu contraseña?{" "}
          <span
            className="signup-link"
            onClick={() => navigate("/recuperar-Contraseña")}
          >
            Recuperar
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
