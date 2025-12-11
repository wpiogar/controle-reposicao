/**
 * Componente: Header do Sistema de Controle de Reposição
 * 
 * Exibe o cabeçalho da aplicação com título, informações do período
 * e ações principais disponíveis
 */

import React from 'react';
import './ReposicaoHeader.css';

interface ReposicaoHeaderProps {
  totalProdutos: number;
  totalPrecisaComprar: number;
  dataContagem: string;
  onNovaContagem: () => void;
  onAdicionarProduto: () => void;
  onExportar: () => void;
}

const ReposicaoHeader: React.FC<ReposicaoHeaderProps> = ({
  totalProdutos,
  totalPrecisaComprar,
  dataContagem,
  onNovaContagem,
  onAdicionarProduto,
  onExportar
}) => {
  
  /**
   * Formata a data para exibição em português
   */
  const formatarData = (data: string): string => {
    const dataObj = new Date(data);
    return dataObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <header className="reposicao-header">
      {/* Container principal do header */}
      <div className="header-container">
        
        {/* Seção: Título e informações */}
        <div className="header-info">
          <h1 className="header-title">Controle de Reposição</h1>
          <p className="header-subtitle">
            Sistema de gestão de compras - Período de 7 dias
          </p>
          
          {/* Badges com informações rápidas */}
          <div className="header-badges">
            <div className="badge badge-info">
              <span className="badge-label">Total de Produtos:</span>
              <span className="badge-value">{totalProdutos}</span>
            </div>
            
            <div className="badge badge-warning">
              <span className="badge-label">Precisam Comprar:</span>
              <span className="badge-value">{totalPrecisaComprar}</span>
            </div>
            
            <div className="badge badge-secondary">
              <span className="badge-label">Data da Contagem:</span>
              <span className="badge-value">
                {dataContagem ? formatarData(dataContagem) : 'Não definida'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Seção: Botões de ação */}
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={onNovaContagem}
            title="Iniciar nova contagem"
          >
            <span className="btn-icon">+</span>
            Nova Contagem
          </button>
          
          <button 
            className="btn btn-success"
            onClick={onAdicionarProduto}
            title="Adicionar produto individual"
          >
            <span className="btn-icon">+</span>
            Adicionar Produto
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={onExportar}
            title="Exportar lista de compras"
            disabled={totalProdutos === 0}
          >
            <span className="btn-icon">↓</span>
            Exportar
          </button>
        </div>
      </div>
    </header>
  );
};

export default ReposicaoHeader;