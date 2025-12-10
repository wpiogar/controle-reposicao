/**
 * App Principal - Sistema de Controle de Reposição
 * 
 * Aplicação independente para gerenciamento de compras e reposição
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ReposicaoPage from './pages/reposicao/ReposicaoPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota principal - redireciona para /reposicao */}
        <Route path="/" element={<Navigate to="/reposicao" replace />} />
        
        {/* Rota do sistema de reposição */}
        <Route path="/reposicao" element={<ReposicaoPage />} />
        
        {/* Rota 404 - redireciona para principal */}
        <Route path="*" element={<Navigate to="/reposicao" replace />} />
      </Routes>
    </Router>
  );
}

export default App;