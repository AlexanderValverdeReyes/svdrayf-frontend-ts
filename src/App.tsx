// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Componentes Públicos Informativos
import NavbarPublico from '@/components/publico/NavbarPublico';
import FooterPublico from '@/components/publico/FooterPublico';
import Home from '@/pages/Home';
import Services from '@/pages/Services';
import Paraderos from '@/pages/Paraderos';

// Páginas de Control del Sistema Interno
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import '@/App.css';

function AppContent(): React.JSX.Element {
  const location = useLocation();
  
  // Definimos las rutas privadas del ecosistema donde la barra pública desaparece
  const rutasPrivadas: string[] = ['/login', '/dashboard'];
  const ocultarElementosPublicos: boolean = rutasPrivadas.includes(location.pathname.toLowerCase());

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* El Navbar público de la Landing Page SOLO se muestra en las rutas informativas */}
      {!ocultarElementosPublicos && <NavbarPublico />}
      
      <div className="flex-grow">
        <Routes>
          {/*  Capa Pública Informativa */}
          <Route path="/" element={<Home />} />
          <Route path="/servicios" element={<Services />} />
          <Route path="/paraderos" element={<Paraderos />} />
          
          {/*  Pasarela de Autenticación Unificada (CUS-06) */}
          <Route path="/login" element={<LoginPage />} />
          
          {/*  Semáforo Central Seguro (PostgreSQL / Neon.tech) */}
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </div>
      
      {/* El Footer público de la Landing Page SOLO se muestra en las rutas informativas */}
      {!ocultarElementosPublicos && <FooterPublico />}
    </div>
  );
}

export default function App(): React.JSX.Element {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}