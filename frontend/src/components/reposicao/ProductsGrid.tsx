/**
 * Componente: Grid de Produtos
 * 
 * Exibe a tabela principal com todos os produtos e permite
 * edição inline dos valores, com cálculos automáticos
 * 
 * ATUALIZADO: Nova estrutura com Saldo Anterior e Saldo Atual
 */

import React, { useState, useEffect } from 'react';
import { Product, ProductFilters } from '../../types/reposicao.types';
import {
  calcularDiferenca,
  calcularCompras,
  calcularComprasComAdicional,
  precisaComprar,
  formatarNumero
} from '../../utils/reposicaoCalculations';
import './ProductsGrid.css';

interface ProductsGridProps {
  produtos: Product[];
  onUpdateProduto: (id: number, produto: Product) => void;
  onDeleteProduto: (id: number) => void;
  onOpenModal: (produto: Product) => void;
}

const ProductsGrid: React.FC<ProductsGridProps> = ({
  produtos,
  onUpdateProduto,
  onDeleteProduto,
  onOpenModal
}) => {
  
  // Estados do componente
  const [produtosEditaveis, setProdutosEditaveis] = useState<Product[]>(produtos);
  const [filtros, setFiltros] = useState<ProductFilters>({
    search: '',
    status: 'todos',
    sortBy: 'nome',
    sortOrder: 'asc'
  });

  const updateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const [paginaAtual, setPaginaAtual] = useState<number>(1);
  const itensPorPagina = 50;

  const produtosPaginados = React.useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return produtosFiltrados.slice(inicio, fim);
  }, [produtosFiltrados, paginaAtual]);

  const totalPaginas = Math.ceil(produtosFiltrados.length / itensPorPagina);

  /**
   * Atualiza lista quando produtos externos mudam
   */
  useEffect(() => {
    setProdutosEditaveis(produtos);
  }, [produtos]);

  /**
   * Atualiza um campo do produto e recalcula valores
   */
  const handleCampoChange = (
    id: number,
    campo: keyof Product,
    valor: string | number
  ) => {
    // Atualiza imediatamente a UI
    setProdutosEditaveis(prevProdutos => {
      return prevProdutos.map(produto => {
        if (produto.id === id) {
          const produtoAtualizado = {
            ...produto,
            [campo]: typeof valor === 'string' ? parseFloat(valor) || 0 : valor
          };
          
          // Recalcula diferença
          produtoAtualizado.diferenca = calcularDiferenca(
            produtoAtualizado.saldo_anterior,
            produtoAtualizado.saldo_atual
          );
          
          // Recalcula compras
          produtoAtualizado.compras = calcularCompras(
            produtoAtualizado.saldo_atual,
            produtoAtualizado.vendas
          );
          
          // Recalcula compras com adicional
          produtoAtualizado.compras_com_adicional = calcularComprasComAdicional(
            produtoAtualizado.compras,
            produtoAtualizado.percentual_adicional
          ) || 0;
          
          return produtoAtualizado;
        }
        return produto;
      });
    });
    
    // Debounce da notificação ao componente pai
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      setProdutosEditaveis(prevProdutos => {
        const produto = prevProdutos.find(p => p.id === id);
        if (produto) {
          onUpdateProduto(id, produto);
        }
        return prevProdutos;
      });
    }, 500);
  };

  /**
   * Filtra e ordena produtos baseado nos filtros ativos
   */
  const getProdutosFiltrados = (): Product[] => {
    let resultado = [...produtosEditaveis];
    
    // Filtro de busca
    if (filtros.search) {
      const termoBusca = filtros.search.toLowerCase();
      resultado = resultado.filter(p =>
        p.nome.toLowerCase().includes(termoBusca)
      );
    }
    
    // Filtro de status
    if (filtros.status !== 'todos') {
      if (filtros.status === 'precisa') {
        resultado = resultado.filter(p => precisaComprar(p.compras));
      } else {
        resultado = resultado.filter(p => !precisaComprar(p.compras));
      }
    }
    
    // Ordenação
    resultado.sort((a, b) => {
      let valorA: any = a[filtros.sortBy];
      let valorB: any = b[filtros.sortBy];
      
      // Ordenação de strings
      if (typeof valorA === 'string') {
        valorA = valorA.toLowerCase();
        valorB = valorB.toLowerCase();
      }
      
      if (filtros.sortOrder === 'asc') {
        return valorA > valorB ? 1 : -1;
      } else {
        return valorA < valorB ? 1 : -1;
      }
    });
    
    return resultado;
  };

  /**
   * Alterna direção de ordenação
   */
  const handleSort = (campo: 'nome' | 'diferenca' | 'compras') => {
    setFiltros(prev => ({
      ...prev,
      sortBy: campo,
      sortOrder: prev.sortBy === campo && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  /**
   * Gera array de opções de percentual (1 a 100)
   */
  const gerarOpcoesPercentual = (): number[] => {
    return Array.from({ length: 100 }, (_, i) => i + 1);
  };

  const produtosFiltrados = React.useMemo(() => getProdutosFiltrados(), [
    produtosEditaveis,
    filtros
  ]);

  return (
    <div className="products-grid-container">
      
      {/* Barra de filtros */}
      <div className="grid-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Buscar produto..."
            className="filter-search"
            value={filtros.search}
            onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
          />
        </div>
        
        <div className="filter-group">
          <select
            className="filter-select"
            value={filtros.status}
            onChange={(e) => setFiltros({ ...filtros, status: e.target.value as any })}
          >
            <option value="todos">Todos os produtos</option>
            <option value="precisa">Precisa comprar</option>
            <option value="nao_precisa">Não precisa comprar</option>
          </select>
        </div>
        
        <div className="filter-info">
          {produtosFiltrados.length} de {produtosEditaveis.length} produtos
        </div>
      </div>
      
      {/* Tabela de produtos */}
      <div className="grid-table-wrapper">
        <table className="grid-table">
          <thead>
            <tr>
              <th 
                className="sortable"
                onClick={() => handleSort('nome')}
              >
                Produto
                {filtros.sortBy === 'nome' && (
                  <span className="sort-indicator">
                    {filtros.sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th>Saldo Anterior</th>
              <th>Saldo Atual</th>
              <th>Vendas</th>
              <th 
                className="sortable"
                onClick={() => handleSort('diferenca')}
              >
                Diferença
                {filtros.sortBy === 'diferenca' && (
                  <span className="sort-indicator">
                    {filtros.sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('compras')}
              >
                Compras
                {filtros.sortBy === 'compras' && (
                  <span className="sort-indicator">
                    {filtros.sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th>Adicional</th>
              <th>Ações</th>
            </tr>
          </thead>
          
          <tbody>
            {produtosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">
                  <div className="empty-icon">📦</div>
                  <p>Nenhum produto encontrado</p>
                </td>
              </tr>
            ) : (
              produtosPaginados.map((produto) => (
                <tr key={produto.id}>
                  {/* Nome do Produto */}
                  <td className="cell-produto">
                    <strong>{produto.nome}</strong>
                  </td>
                  
                  {/* Saldo Anterior */}
                  <td>
                    <input
                      type="number"
                      className="input-number"
                      value={produto.saldo_anterior}
                      onChange={(e) => handleCampoChange(
                        produto.id!,
                        'saldo_anterior',
                        e.target.value
                      )}
                      min="0"
                    />
                  </td>
                  
                  {/* Saldo Atual */}
                  <td>
                    <input
                      type="number"
                      className="input-number"
                      value={produto.saldo_atual}
                      onChange={(e) => handleCampoChange(
                        produto.id!,
                        'saldo_atual',
                        e.target.value
                      )}
                      min="0"
                    />
                  </td>
                  
                  {/* Vendas */}
                  <td>
                    <input
                      type="number"
                      className="input-number"
                      value={produto.vendas}
                      onChange={(e) => handleCampoChange(
                        produto.id!,
                        'vendas',
                        e.target.value
                      )}
                      min="0"
                    />
                  </td>
                  
                  {/* Diferença (calculado) */}
                  <td>
                    <span className="badge-diferenca">
                      {formatarNumero(produto.diferenca)}
                    </span>
                  </td>
                  
                  {/* Compras (calculado) */}
                  <td>
                    <span className={`badge-compras ${
                      precisaComprar(produto.compras) 
                        ? 'badge-vermelho' 
                        : 'badge-verde'
                    }`}>
                      {formatarNumero(produto.compras)}
                    </span>
                  </td>
                  
                  {/* Percentual Adicional */}
                  <td>
                    <select
                      className="select-percentual"
                      value={produto.percentual_adicional}
                      onChange={(e) => handleCampoChange(
                        produto.id!,
                        'percentual_adicional',
                        parseInt(e.target.value)
                      )}
                    >
                      {gerarOpcoesPercentual().map(valor => (
                        <option key={valor} value={valor}>
                          {valor}%
                        </option>
                      ))}
                    </select>
                  </td>
                  
                  {/* Ações */}
                  <td className="cell-actions">
                    <button
                      className="btn-action btn-view"
                      onClick={() => onOpenModal(produto)}
                      title="Ver detalhes"
                    >
                      👁️
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => onDeleteProduto(produto.id!)}
                      title="Excluir produto"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
            disabled={paginaAtual === 1}
          >
            ← Anterior
          </button>
          
          <span className="pagination-info">
            Página {paginaAtual} de {totalPaginas}
          </span>
          
          <button
            className="pagination-btn"
            onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
            disabled={paginaAtual === totalPaginas}
          >
            Próxima →
          </button>
        </div>
      )}
      
      {/* Resumo */}
      {produtosFiltrados.length > 0 && (
        <div className="grid-summary">
          <div className="summary-item">
            <span className="summary-label">Total de produtos:</span>
            <span className="summary-value">{produtosFiltrados.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Precisam comprar:</span>
            <span className="summary-value summary-warning">
              {produtosFiltrados.filter(p => precisaComprar(p.compras)).length}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Não precisam:</span>
            <span className="summary-value summary-success">
              {produtosFiltrados.filter(p => !precisaComprar(p.compras)).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsGrid;