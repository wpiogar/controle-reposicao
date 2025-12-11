/**
 * Tipos e Interfaces - Sistema de Controle de Reposição
 * 
 * Define todas as estruturas de dados utilizadas na aplicação
 * 
 * ATUALIZADO: Removido campo "entrada"
 */

// Interface principal do produto
export interface Product {
  id?: number;
  nome: string;
  saldo_anterior: number;
  saldo_atual: number;
  vendas: number;
  diferenca: number;
  compras: number;
  compras_com_adicional: number;
  percentual_adicional: number;
  data_contagem: string;
  created_at?: string;
  updated_at?: string;
}

// Interface para dados do formulário (sem campos calculados)
export interface ProductFormData {
  nome: string;
  saldo_anterior: number;
  saldo_atual: number;
  vendas: number;
  percentual_adicional: number;
}

// Interface para importação de Excel
export interface ExcelImportData {
  nome: string;
  saldo_anterior?: number;  // Opcional - vem da planilha processada
  saldo_atual?: number;     // Opcional - vem da planilha processada
  vendas?: number;          // Opcional - vem da planilha processada
}

// Interface para histórico
export interface HistorySnapshot {
  id: number;
  data_contagem: string;
  total_produtos: number;
  total_comprar: number;
  created_at: string;
}

// Enum para status de compra
export enum CompraStatus {
  PRECISA_COMPRAR = 'precisa',
  NAO_PRECISA = 'nao_precisa'
}

// Interface para filtros
export interface ProductFilters {
  search: string;
  status: CompraStatus | 'todos';
  sortBy: 'nome' | 'diferenca' | 'compras';
  sortOrder: 'asc' | 'desc';
}