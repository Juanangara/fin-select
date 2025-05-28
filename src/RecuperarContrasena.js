import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';
import { useNavigate } from 'react-router-dom';
import './EstilosCss/RecupeContrasena.css';

export default function RecuperarContrasena() {
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const navigate = useNavigate();

  const handleReset = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFeedback('Por favor ingresa un correo.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setFeedback('Revisa tu correo para restablecer tu contraseña.');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setFeedback('No existe un usuario con ese correo.');
      } else if (err.code === 'auth/invalid-email') {
        setFeedback('El correo ingresado no es válido.');
      } else {
        setFeedback('Ocurrió un error. Intenta de nuevo.');
      }
    }
  };

  return (
    
    <div className="recuperar-container">
      <h2 className="recuperar-title">Recuperar Contraseña</h2>
      <input
        type="email"
        className="recuperar-input"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setFeedback(''); }}
      />
      <button
        className="recuperar-button"
        onClick={handleReset}
      >
        Enviar enlace
      </button>
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
