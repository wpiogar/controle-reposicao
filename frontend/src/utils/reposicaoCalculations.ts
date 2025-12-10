/**
 * Funções de Cálculo - Sistema de Controle de Reposição
 * 
 * Centraliza todas as regras de negócio e cálculos da aplicação
 * 
 * REGRAS ATUALIZADAS:
 * - Diferença = Saldo Anterior - Saldo Atual
 * - Compras = Saldo Atual - Vendas (+ percentual adicional)
 */

import { Product, ProductFormData } from '../types/reposicao.types';

/**
 * Calcula a diferença entre saldo anterior e saldo atual
 * Fórmula: Saldo Anterior - Saldo Atual
 * 
 * @param saldoAnterior - Saldo do período anterior
 * @param saldoAtual - Saldo atual (inventário)
 * @returns Diferença calculada
 */
export const calcularDiferenca = (
  saldoAnterior: number,
  saldoAtual: number
): number => {
  return saldoAnterior - saldoAtual;
};

/**
 * Calcula a quantidade necessária para compra
 * Fórmula: Saldo Atual - Vendas (+ percentual adicional se resultado for positivo)
 * 
 * @param saldoAtual - Saldo atual (inventário)
 * @param vendas - Quantidade vendida no período
 * @param percentual - Percentual adicional (1-100)
 * @returns Quantidade a comprar
 */
export const calcularCompras = (
  saldoAtual: number,
  vendas: number
): number => {
  // Fórmula: Saldo Atual - Vendas
  return saldoAtual - vendas;
};

/**
 * Calcula compras com percentual adicional aplicado
 * Só calcula se o valor base de compras for negativo
 * 
 * @param compras - Valor base de compras (pode ser negativo)
 * @param percentual - Percentual adicional (1-100)
 * @returns Quantidade com percentual ou null se não aplicável
 */
export const calcularComprasComAdicional = (
  compras: number,
  percentual: number
): number | null => {
  // Só aplica percentual se precisar comprar (negativo)
  if (compras >= 0) {
    return null;
  }
  
  // Converte para positivo, aplica percentual e arredonda
  const quantidadeBase = Math.abs(compras);
  const adicional = (quantidadeBase * percentual) / 100;
  return Math.ceil(quantidadeBase + adicional);
};

/**
 * Determina se o produto precisa de reposição
 * 
 * @param compras - Quantidade calculada para comprar
 * @returns true se precisa comprar, false caso contrário
 */
export const precisaComprar = (compras: number): boolean => {
  return compras < 0;
};

/**
 * Retorna a classe CSS baseada no status de compra
 * 
 * @param compras - Quantidade a comprar
 * @returns Nome da classe CSS
 */
export const getStatusClass = (compras: number): string => {
  return precisaComprar(compras) ? 'status-vermelho' : 'status-verde';
};

/**
 * Calcula todos os campos derivados de um produto
 * 
 * @param formData - Dados do formulário
 * @returns Produto completo com campos calculados
 */
export const calcularProdutoCompleto = (
  formData: ProductFormData
): Omit<Product, 'id' | 'created_at' | 'updated_at' | 'data_contagem'> => {
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
  ) || 0;
  
  return {
    nome: formData.nome,
    saldo_anterior: formData.saldo_anterior,
    saldo_atual: formData.saldo_atual,
    vendas: formData.vendas,
    diferenca,
    compras,
    compras_com_adicional,
    percentual_adicional: formData.percentual_adicional
  };
};

/**
 * Formata número para exibição
 * 
 * @param valor - Número a formatar
 * @returns String formatada
 */
export const formatarNumero = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR').format(valor);
};

/**
 * Valida se todos os campos numéricos são válidos
 * 
 * @param formData - Dados do formulário
 * @returns true se válido, false caso contrário
 */
export const validarFormulario = (formData: ProductFormData): boolean => {
  return (
    formData.nome.trim().length > 0 &&
    formData.saldo_anterior >= 0 &&
    formData.saldo_atual >= 0 &&
    formData.vendas >= 0 &&
    formData.percentual_adicional >= 1 &&
    formData.percentual_adicional <= 100
  );
};