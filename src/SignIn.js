// SignIn.js
import { useState } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, dbRT } from "./firebase";
import { ref, set } from "firebase/database";
import { useNavigate } from "react-router-dom";
import "./EstilosCss/SignIn.css"; // Importa los estilos

function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");

  // Actualiza los datos del formulario
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Función que se ejecuta al hacer click en el botón de registro
  const handleRegister = async () => {
    const { nombre, apellido, telefono, email, password } = formData;

    // Validación 1: Verificar que todos los campos estén llenos
    if (!nombre || !apellido || !telefono || !email || !password) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    // Validación 2: Validar que el correo tenga un formato correcto
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError("El correo no es válido.");
      return;
    }

    try {
      // Intenta registrar al usuario con email y contraseña
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Guarda datos adicionales en la Realtime Database usando el UID del usuario
      await set(ref(dbRT, "users/" + userCredential.user.uid), {
        nombre,
        apellido,
        telefono,
        email,
        provider: "password" // Este atributo vincula la información con la autenticación
      });

      // Cierra la sesión para que el usuario no quede logueado automáticamente
      await signOut(auth);

      // Si todo sale bien, redirige a la página de Login
      navigate("/login");
    } catch (err) {
      // Validación 3: Si el correo ya está en uso, Firebase arroja un error
      if (err.code === "auth/email-already-in-use") {
        setError("El correo ya está registrado.");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-content">
        <h2>Sign In</h2>
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
        <input
          type="tel"
          placeholder="Teléfono"
          name="telefono"
          value={formData.telefono}
          onChange={handleChange}
          required
        />
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
          onClick={handleRegister}
        >
          Registrarse
        </button>
        <button className="back-button" onClick={() => navigate("/")}>
          Volver
        </button>
      </div>
    </div>
  );
}

export default SignIn;
