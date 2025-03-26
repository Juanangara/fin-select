// App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthOptions from "./AuthOptions";
import Login from "./Login";
import SignIn from "./SignIn";
import Home from "./Home";
import Credito from "./Credito";
import TasaCDT from "./TasaCDT";
import Historico from "./Historico";
import CuentaAhorros from "./CuentaAhorros"; // Importa la nueva página
import ProtectedRoute from "./ProtectedRoute"; // Ya existente

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthOptions />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signin" element={<SignIn />} />

        {/* Rutas protegidas */}
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
          path="/Tasa CDT"
          element={
            <ProtectedRoute>
              <TasaCDT />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Historico"
          element={
            <ProtectedRoute>
              <Historico />
            </ProtectedRoute>
          }
        />
        <Route
          path="/CuentaAhorros"
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
