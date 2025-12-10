/**
 * Componente: Modal de Detalhes do Produto
 * 
 * Exibe um modal com informações detalhadas do produto
 * e permite edição de todos os campos
 * 
 * ATUALIZADO: Nova estrutura com Saldo Anterior e Saldo Atual
 */

import React, { useState, useEffect } from 'react';
import { Product, ProductFormData } from '../../types/reposicao.types';
import {
  calcularDiferenca,
  calcularCompras,
  calcularComprasComAdicional,
  precisaComprar,
  formatarNumero,
  validarFormulario
} from '../../utils/reposicaoCalculations';
import './ProductModal.css';

interface ProductModalProps {
  produto: Product | null;
  onClose: () => void;
  onSave: (produto: Product) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({
  produto,
  onClose,
  onSave
}) => {
  
  // Estados do formulário
  const [formData, setFormData] = useState<ProductFormData>({
    nome: '',
    saldo_anterior: 0,
    saldo_atual: 0,
    vendas: 0,
    entrada: 0,
    percentual_adicional: 10
  });
  
  const [erros, setErros] = useState<Record<string, string>>({});
  const [modoEdicao, setModoEdicao] = useState<boolean>(false);

  /**
   * Inicializa formulário quando produto muda
   */
  useEffect(() => {
    if (produto) {
      setFormData({
        nome: produto.nome,
        saldo_anterior: produto.saldo_anterior,
        saldo_atual: produto.saldo_atual,
        vendas: produto.vendas,
        percentual_adicional: produto.percentual_adicional
      });
      setModoEdicao(false);
      setErros({});
    }
  }, [produto]);

  /**
   * Calcula valores derivados baseado no formulário atual
   */
  const calcularValoresDerivados = () => {
    const diferenca = calcularDiferenca(
      formData.saldo_anterior,
      formData.saldo_atual
    );
    
    const compras = calcularCompras(
      formData.saldo_atual,
      formData.vendas
    );
    
    const compras_com_adicional = calcularComprasComAdicional(
      compras,
      formData.percentual_adicional
    );
    
    return { diferenca, compras, compras_com_adicional };
  };

  /**
   * Valida campos individuais
   */
  const validarCampo = (campo: keyof ProductFormData, valor: any): string => {
    switch (campo) {
      case 'nome':
        if (!valor || valor.trim().length === 0) {
          return 'Nome do produto é obrigatório';
        }
        if (valor.trim().length < 3) {
          return 'Nome deve ter pelo menos 3 caracteres';
        }
        return '';
        
      case 'saldo_anterior':
      case 'saldo_atual':
      case 'vendas':
        if (valor < 0) {
          return 'Valor não pode ser negativo';
        }
        return '';
        
      case 'percentual_adicional':
        if (valor < 1 || valor > 100) {
          return 'Percentual deve estar entre 1 e 100';
        }
        return '';
        
      default:
        return '';
    }
  };

  /**
   * Manipula mudança de campo
   */
  const handleCampoChange = (campo: keyof ProductFormData, valor: any) => {
    // Atualiza valor
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));
    
    // Valida campo
    const erro = validarCampo(campo, valor);
    setErros(prev => ({
      ...prev,
      [campo]: erro
    }));
  };

  /**
   * Manipula blur do campo para conversão de string para número
   */
  const handleCampoBlur = (campo: keyof ProductFormData) => {
    if (campo !== 'nome') {
      const valor = parseFloat(formData[campo] as any) || 0;
      setFormData(prev => ({
        ...prev,
        [campo]: valor
      }));
    }
  };

  /**
   * Valida formulário completo
   */
  const validarFormularioCompleto = (): boolean => {
    const novosErros: Record<string, string> = {};
    
    Object.keys(formData).forEach(campo => {
      const erro = validarCampo(
        campo as keyof ProductFormData,
        formData[campo as keyof ProductFormData]
      );
      if (erro) {
        novosErros[campo] = erro;
      }
    });
    
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  /**
   * Manipula salvamento
   */
  const handleSalvar = () => {
    if (!validarFormularioCompleto()) {
      return;
    }
    
    if (!produto) {
      return;
    }
    
    const { diferenca, compras, compras_com_adicional } = calcularValoresDerivados();

    const produtoAtualizado: Product = {
      ...produto,
      nome: formData.nome.trim(),
      saldo_anterior: formData.saldo_anterior,
      saldo_atual: formData.saldo_atual,
      vendas: formData.vendas,
      percentual_adicional: formData.percentual_adicional,
      diferenca,
      compras,
      compras_com_adicional: compras_com_adicional || 0
    };
    
    onSave(produtoAtualizado);
  };

  /**
   * Manipula cancelamento
   */
  const handleCancelar = () => {
    if (modoEdicao && produto) {
      // Restaura valores originais
      setFormData({
        nome: produto.nome,
        saldo_anterior: produto.saldo_anterior,
        saldo_atual: produto.saldo_atual,
        vendas: produto.vendas,
        percentual_adicional: produto.percentual_adicional
      });
      setErros({});
      setModoEdicao(false);
    } else {
      onClose();
    }
  };

  /**
   * Gera array de opções de percentual
   */
  const gerarOpcoesPercentual = (): number[] => {
    return Array.from({ length: 100 }, (_, i) => i + 1);
  };

  /**
   * Fecha modal ao clicar no backdrop
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Não renderiza se não houver produto
  if (!produto) {
    return null;
  }

  const { diferenca, compras, compras_com_adicional } = calcularValoresDerivados();
  const precisaCompra = precisaComprar(compras);

  return (
    <div className="product-modal-overlay" onClick={handleBackdropClick}>
      <div className="product-modal">
        
        {/* Cabeçalho */}
        <div className="modal-header">
          <h2 className="modal-title">Detalhes do Produto</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>
        
        {/* Corpo */}
        <div className="modal-body">
          
          {/* Status visual */}
          <div className={`status-banner ${precisaCompra ? 'status-alerta' : 'status-ok'}`}>
            <span className="status-icon">
              {precisaCompra ? '⚠️' : '✅'}
            </span>
            <span className="status-text">
              {precisaCompra 
                ? 'Este produto precisa de reposição' 
                : 'Este produto não precisa de reposição'}
            </span>
          </div>
          
          {/* Formulário */}
          <form className="modal-form">
            
            {/* Nome do Produto */}
            <div className="form-group">
              <label className="form-label">
                Nome do Produto
                <span className="required">*</span>
              </label>
              {modoEdicao ? (
                <input
                  type="text"
                  className={`form-input ${erros.nome ? 'input-error' : ''}`}
                  value={formData.nome}
                  onChange={(e) => handleCampoChange('nome', e.target.value)}
                  placeholder="Digite o nome do produto"
                />
              ) : (
                <div className="form-value-display">{formData.nome}</div>
              )}
              {erros.nome && (
                <span className="error-message">{erros.nome}</span>
              )}
            </div>
            
            {/* Grid de campos numéricos */}
            <div className="form-grid">
              
              {/* Saldo Anterior */}
              <div className="form-group">
                <label className="form-label">
                  Saldo Anterior
                  <span className="required">*</span>
                </label>
                {modoEdicao ? (
                  <input
                    type="number"
                    className={`form-input ${erros.saldo_anterior ? 'input-error' : ''}`}
                    value={formData.saldo_anterior}
                    onChange={(e) => handleCampoChange('saldo_anterior', e.target.value)}
                    onBlur={() => handleCampoBlur('saldo_anterior')}
                    min="0"
                    step="1"
                  />
                ) : (
                  <div className="form-value-display">
                    {formatarNumero(formData.saldo_anterior)}
                  </div>
                )}
                {erros.saldo_anterior && (
                  <span className="error-message">{erros.saldo_anterior}</span>
                )}
                <span className="form-help">Saldo do período anterior</span>
              </div>
              
              {/* Saldo Atual */}
              <div className="form-group">
                <label className="form-label">
                  Saldo Atual (Inventário)
                  <span className="required">*</span>
                </label>
                {modoEdicao ? (
                  <input
                    type="number"
                    className={`form-input ${erros.saldo_atual ? 'input-error' : ''}`}
                    value={formData.saldo_atual}
                    onChange={(e) => handleCampoChange('saldo_atual', e.target.value)}
                    onBlur={() => handleCampoBlur('saldo_atual')}
                    min="0"
                    step="1"
                  />
                ) : (
                  <div className="form-value-display">
                    {formatarNumero(formData.saldo_atual)}
                  </div>
                )}
                {erros.saldo_atual && (
                  <span className="error-message">{erros.saldo_atual}</span>
                )}
                <span className="form-help">Quantidade em estoque atual</span>
              </div>
              
              {/* Vendas */}
              <div className="form-group">
                <label className="form-label">
                  Vendas (7 dias)
                  <span className="required">*</span>
                </label>
                {modoEdicao ? (
                  <input
                    type="number"
                    className={`form-input ${erros.vendas ? 'input-error' : ''}`}
                    value={formData.vendas}
                    onChange={(e) => handleCampoChange('vendas', e.target.value)}
                    onBlur={() => handleCampoBlur('vendas')}
                    min="0"
                    step="1"
                  />
                ) : (
                  <div className="form-value-display">
                    {formatarNumero(formData.vendas)}
                  </div>
                )}
                {erros.vendas && (
                  <span className="error-message">{erros.vendas}</span>
                )}
                <span className="form-help">Quantidade vendida no período</span>
              </div>
              
              {/* Percentual Adicional */}
              <div className="form-group">
                <label className="form-label">
                  Percentual Adicional
                  <span className="required">*</span>
                </label>
                {modoEdicao ? (
                  <select
                    className={`form-select ${erros.percentual_adicional ? 'input-error' : ''}`}
                    value={formData.percentual_adicional}
                    onChange={(e) => handleCampoChange(
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
                ) : (
                  <div className="form-value-display">
                    {formData.percentual_adicional}%
                  </div>
                )}
                {erros.percentual_adicional && (
                  <span className="error-message">{erros.percentual_adicional}</span>
                )}
                <span className="form-help">Margem de segurança para compra</span>
              </div>
            </div>
            
            {/* Valores Calculados */}
            <div className="calculated-section">
              <h3 className="section-title">Valores Calculados</h3>
              
              <div className="calculated-grid">
                {/* Diferença */}
                <div className="calculated-item">
                  <span className="calculated-label">Diferença</span>
                  <span className="calculated-value">
                    {formatarNumero(diferenca)}
                  </span>
                  <span className="calculated-formula">
                    (Saldo Anterior - Saldo Atual)
                  </span>
                </div>
                
                {/* Compras */}
                <div className="calculated-item">
                  <span className="calculated-label">Compras Necessárias</span>
                  <span className={`calculated-value ${
                    precisaCompra ? 'value-vermelho' : 'value-verde'
                  }`}>
                    {formatarNumero(compras)}
                  </span>
                  <span className="calculated-formula">
                    (Saldo Atual - Vendas)
                  </span>
                </div>
                
                {/* Compras com Adicional */}
                {compras_com_adicional !== null && (
                  <div className="calculated-item">
                    <span className="calculated-label">Compras + Adicional ({formData.percentual_adicional}%)</span>
                    <span className="calculated-value value-info">
                      {formatarNumero(compras_com_adicional)}
                    </span>
                    <span className="calculated-formula">
                      Com margem de segurança
                    </span>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
        
        {/* Rodapé */}
        <div className="modal-footer">
          {!modoEdicao ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={onClose}
              >
                Fechar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setModoEdicao(true)}
              >
                Editar
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-secondary"
                onClick={handleCancelar}
              >
                Cancelar
              </button>
              <button
                className="btn btn-success"
                onClick={handleSalvar}
              >
                Salvar Alterações
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductModal;