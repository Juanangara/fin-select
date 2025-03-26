// ProtectedRoute.js
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <p>Cargando...</p>; // o un spinner
  }

  // Si no hay usuario, redirige a /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay usuario, renderiza el contenido
  return children;
}

export default ProtectedRoute;
