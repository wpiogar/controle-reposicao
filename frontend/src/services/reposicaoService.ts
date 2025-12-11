/**
 * Serviço de API - Sistema de Controle de Reposição
 * 
 * Integração com backend FastAPI
 */

import { Product, ExcelImportData } from '../types/reposicao.types';

// URL da API (altere conforme ambiente)
const API_URL = import.meta.env.VITE_API_URL || 'https://reposicao-api.onrender.com/api/v1/reposicao';

/**
 * Busca todos os produtos
 */
export const listarProdutos = async (): Promise<Product[]> => {
  const response = await fetch(`${API_URL}/products`);
  if (!response.ok) {
    throw new Error('Erro ao buscar produtos');
  }
  return response.json();
};

/**
 * Cria um novo produto
 */
export const criarProduto = async (produto: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> => {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(produto),
  });
  if (!response.ok) {
    throw new Error('Erro ao criar produto');
  }
  return response.json();
};

/**
 * Cria múltiplos produtos de uma vez (importação)
 */
export const criarProdutosEmLote = async (produtos: Omit<Product, 'id' | 'created_at' | 'updated_at'>[]): Promise<Product[]> => {
  const response = await fetch(`${API_URL}/products/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ produtos }),
  });
  if (!response.ok) {
    throw new Error('Erro ao criar produtos em lote');
  }
  return response.json();
};

/**
 * Atualiza um produto existente
 */
export const atualizarProduto = async (id: number, produto: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> => {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(produto),
  });
  if (!response.ok) {
    throw new Error('Erro ao atualizar produto');
  }
  return response.json();
};

/**
 * Deleta um produto
 */
export const deletarProduto = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Erro ao deletar produto');
  }
};

/**
 * Deleta todos os produtos
 */
export const deletarTodosProdutos = async (): Promise<void> => {
  const response = await fetch(`${API_URL}/products`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Erro ao deletar todos os produtos');
  }
};