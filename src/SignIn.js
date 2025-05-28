import { useState } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, dbRT } from "./firebase";
import { ref, set } from "firebase/database";
import { useNavigate } from "react-router-dom";
import "./EstilosCss/SignIn.css";

// Componente Modal para Términos y Condiciones
function TermsModal({ onAccept, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Términos y Condiciones</h3>
        <p>
          Al registrarte, aceptas que se registre tu actividad en la página y que se almacenen tus datos.
        </p>
        <div className="modal-actions">
          <button onClick={onAccept} className="modal-accept">
            Acepto
          </button>
          <button onClick={onCancel} className="modal-cancel">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    password: ""
  });
  const [countryCode, setCountryCode] = useState("+57");
  const [error, setError] = useState("");
  const [showTerms, setShowTerms] = useState(false);

  const countryCodes = [
    "+57", "+1", "+44", "+52", "+34",
    "+33", "+49", "+61", "+81", "+86"
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // limpiar error al escribir
  };

  // Regex simple para validar formato de email
  const emailRegex = /^\S+@\S+\.\S+$/;

  // Se dispara al presionar el botón "Registrarse"
  const handleRegisterClick = () => {
    const { nombre, apellido, telefono, email, password } = formData;

    // 1. Validar campos no vacíos
    if (!nombre || !apellido || !telefono || !email || !password) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    // 2. Validar formato de correo
    if (!emailRegex.test(email.trim())) {
      setError("El correo no es válido.");
      return;
    }

    // Si todo OK, mostrar modal
    setShowTerms(true);
  };

  const handleTermsAccept = async () => {
    setShowTerms(false);
    const { nombre, apellido, telefono, email, password } = formData;
    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);

      // Guardar datos en Realtime DB
      await set(ref(dbRT, `users/${userCredential.user.uid}`), {
        nombre,
        apellido,
        telefono: countryCode + telefono,
        email: email.trim(),
        provider: "password",
        termsAccepted: true
      });

      // Cerrar sesión y redirigir a login
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("El correo ya está registrado.");
      } else {
        setError(err.message);
      }
    }
  };

  const handleTermsCancel = () => {
    setShowTerms(false);
    alert("Debe aceptar los términos y condiciones para registrarse.");
  };

  return (
    <div className="signin-container">
      <div className="signin-content">
        <h2>Registro</h2>

        <input
          type="text"
          placeholder="Nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          placeholder="Apellido"
          name="apellido"
          value={formData.apellido}
          onChange={handleChange}
          required
        />

        <div className="telefono-container">
          <select
            className="pais-codigo-select"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
          >
            {countryCodes.map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
          <input
            type="tel"
            placeholder="Teléfono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            required
          />
        </div>

        <input
          type="email"
          placeholder="Correo"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        {error && <p className="error-message">{error}</p>}

        <button
          type="button"
          className="register-button"
          onClick={handleRegisterClick}
        >
          Registrarse
        </button>
        <button
          className="back-button"
          onClick={() => navigate("/")}
        >
          Volver
        </button>
      </div>

      {showTerms && (
        <TermsModal
          onAccept={handleTermsAccept}
          onCancel={handleTermsCancel}
        />
      )}
    </div>
  );
}

export default SignIn;
