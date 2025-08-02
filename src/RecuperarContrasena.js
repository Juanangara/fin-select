import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase'; // Importa la instancia de autenticación de tu archivo firebase.js
import { useNavigate } from 'react-router-dom';
import './EstilosCss/RecupeContrasena.css';

export default function RecuperarContrasena() {
  // Estado para almacenar el email y gestionar la retroalimentación
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordReset = async (e) => {
    e.preventDefault(); // Evita que la página se recargue al enviar el formulario

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFeedback('Por favor, ingresa tu correo electrónico.');
      return;
    }

    setIsLoading(true); // Activa el estado de carga
    setFeedback(''); // Limpia la retroalimentación anterior

    try {
      // Envía el correo de recuperación
      await sendPasswordResetEmail(auth, trimmedEmail);
      setFeedback('Hemos enviado un enlace para restablecer tu contraseña a tu correo. Por favor, revísalo.');
      setEmail(''); // Limpia el campo del email después del éxito
    } catch (err) {
      console.error(err);
      
      // Manejo de errores más específico y amigable
      if (err.code === 'auth/user-not-found') {
        setFeedback('No se encontró ningún usuario con ese correo electrónico.');
      } else if (err.code === 'auth/invalid-email') {
        setFeedback('El formato del correo electrónico no es válido.');
      } else {
        setFeedback('Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.');
      }
    } finally {
      setIsLoading(false); // Desactiva el estado de carga
    }
  };

  return (
    <div className="recuperar-container">
      <h2 className="recuperar-title">Recuperar Contraseña</h2>
      <form onSubmit={handlePasswordReset}>
        <input
          type="email"
          className="recuperar-input"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading} // Deshabilita el input mientras se procesa la solicitud
        />
        <button
          type="submit"
          className="recuperar-button"
          disabled={isLoading} // Deshabilita el botón mientras se procesa la solicitud
        >
          {isLoading ? 'Enviando...' : 'Enviar enlace'}
        </button>
      </form>
      {feedback && <p className="recuperar-feedback">{feedback}</p>}
      <p
        className="recuperar-volver"
        onClick={() => navigate('/login')}
      >
        Volver al inicio de sesión
      </p>
    </div>
  );
}