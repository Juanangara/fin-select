import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthOptions from "./AuthOptions";
import Login from "./Login";
import SignIn from "./SignIn";
import Home from "./Home";
import Credito from "./Credito";
import TasaCDT from "./TasaCDT";
import Historico from "./Historico";
import CuentaAhorros from "./CuentaAhorros";
import RecuperarContrasena from "./RecuperarContrasena";
import ProtectedRoute from "./ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Páginas de autenticación pública */}
        <Route path="/" element={<AuthOptions />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/recuperar-contraseña" element={<RecuperarContrasena />}/>

        {/* Rutas protegidas: requiere autenticación */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/credito"
          element={
            <ProtectedRoute>
              <Credito />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasa-cdt"
          element={
            <ProtectedRoute>
              <TasaCDT />
            </ProtectedRoute>
          }
        />
        <Route
          path="/historico"
          element={
            <ProtectedRoute>
              <Historico />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cuenta-ahorros"
          element={
            <ProtectedRoute>
              <CuentaAhorros />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
