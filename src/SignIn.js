import { useState } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, dbRT } from "./firebase";
import { ref, set } from "firebase/database";
import { useNavigate } from "react-router-dom";
import "./EstilosCss/SignIn.css"; // Importa tus estilos

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
  // Estado para el código de país, por defecto "+57"
  const [countryCode, setCountryCode] = useState("+57");
  const [error, setError] = useState("");
  const [showTerms, setShowTerms] = useState(false);

  // Array de códigos de país
  const countryCodes = [
    "+57",
    "+1",
    "+44",
    "+52",
    "+34",
    "+33",
    "+49",
    "+61",
    "+81",
    "+86"
  ];

  // Actualiza los datos del formulario
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    const { nombre, apellido, telefono, email, password } = formData;

    // Validación de campos
    if (!nombre || !apellido || !telefono || !email || !password) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    // Validar formato de correo
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError("El correo no es válido.");
      return;
    }

    try {
      // Registrar al usuario con email y contraseña
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Guarda datos adicionales en la Realtime Database junto con la aceptación de términos.
      // Combinamos el countryCode y el teléfono ingresado.
      await set(ref(dbRT, "users/" + userCredential.user.uid), {
        nombre,
        apellido,
        telefono: countryCode + formData.telefono,
        email,
        provider: "password",
        termsAccepted: true
      });

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

  // Al presionar "Registrarse" se muestra el modal de términos
  const handleRegisterClick = () => {
    const { nombre, apellido, telefono, email, password } = formData;
    if (!nombre || !apellido || !telefono || !email || !password) {
      setError("Por favor, completa todos los campos.");
      return;
    }
    setShowTerms(true);
  };

  const handleTermsAccept = () => {
    setShowTerms(false);
    handleRegister();
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
        {/* Contenedor para código de país y teléfono */}
        <div className="telefono-container">
          <select
            className="pais-codigo-select"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
          >
            {countryCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
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
        <button className="back-button" onClick={() => navigate("/")}>
          Volver
        </button>
      </div>
      {showTerms && (
        <TermsModal onAccept={handleTermsAccept} onCancel={handleTermsCancel} />
      )}
    </div>
  );
}

export default SignIn;
