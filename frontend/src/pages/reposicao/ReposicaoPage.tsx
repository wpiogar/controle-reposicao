/**
 * Página: Sistema de Controle de Reposição
 * 
 * Página principal que integra todos os componentes e gerencia
 * o estado global da aplicação
 * 
 * ATUALIZADO: Nova estrutura com Saldo Anterior e Saldo Atual
 */

import React, { useState, useEffect } from 'react';
import { Product, ExcelImportData } from '../../types/reposicao.types';
import * as reposicaoService from '../../services/reposicaoService';
import { gerarRelatorioPDF } from '../../services/pdfExportService';
import ReposicaoHeader from '../../components/reposicao/ReposicaoHeader';
import ImportExcel from '../../components/reposicao/ImportExcel';
import ProductsGrid from '../../components/reposicao/ProductsGrid';
import ProductModal from '../../components/reposicao/ProductModal';
import './ReposicaoPage.css';

const ReposicaoPage: React.FC = () => {
  
  // Estados principais
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Product | null>(null);
  const [mostrarImportacao, setMostrarImportacao] = useState<boolean>(false);
  const [mostrarModal, setMostrarModal] = useState<boolean>(false);
  const [mostrarModalNovoProduto, setMostrarModalNovoProduto] = useState<boolean>(false);
  const [dataContagem, setDataContagem] = useState<string>('');
  const [proximoId, setProximoId] = useState<number>(1);
  const [carregando, setCarregando] = useState<boolean>(false);

  /**
   * Carrega dados do localStorage ao montar componente
   */
  useEffect(() => {
    carregarDadosBackend();
  }, []);

  /**
   * Carrega dados salvos do localStorage
   */
  const carregarDadosBackend = async () => {
    try {
      setCarregando(true);
      const produtosCarregados = await reposicaoService.listarProdutos();
      setProdutos(produtosCarregados);
      
      // Define data da contagem baseado no primeiro produto
      if (produtosCarregados.length > 0) {
        setDataContagem(produtosCarregados[0].data_contagem);
      }
      
      // Define próximo ID
      if (produtosCarregados.length > 0) {
        const maxId = Math.max(...produtosCarregados.map(p => p.id || 0));
        setProximoId(maxId + 1);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      mostrarNotificacao('error', 'Erro ao carregar produtos do servidor');
    } finally {
      setCarregando(false);
    }
  };

  /**
   * Calcula total de produtos que precisam comprar
   */
  const calcularTotalPrecisaComprar = (): number => {
    return produtos.filter(p => p.compras > 0).length;
  };

  /**
   * Manipula importação de produtos do Excel
   */
  const handleImportarProdutos = async (produtosImportados: ExcelImportData[]) => {
    try {
      setCarregando(true);
      
      // Define data da contagem como hoje
      const dataHoje = new Date().toISOString().split('T')[0];
      setDataContagem(dataHoje);
      
      // Cria produtos com valores padrão
      const novosProdutos = produtosImportados.map((item) => ({
        nome: item.nome,
        saldo_anterior: 0,
        saldo_atual: 0,
        vendas: 0,
        diferenca: 0,
        compras: 0,
        compras_com_adicional: 0,
        percentual_adicional: 10,
        data_contagem: dataHoje
      }));
      
      // Envia para o backend
      const produtosCriados = await reposicaoService.criarProdutosEmLote(novosProdutos);
      
      // Atualiza estado
      setProdutos(produtosCriados);
      setMostrarImportacao(false);
      
      // Feedback visual
      mostrarNotificacao('success', `${produtosCriados.length} produtos importados com sucesso!`);
    } catch (error) {
      console.error('Erro ao importar produtos:', error);
      mostrarNotificacao('error', 'Erro ao importar produtos');
    } finally {
      setCarregando(false);
    }
  };

/**
 * Manipula atualização de produto
 */
const handleAtualizarProduto = async (id: number, produtoAtualizado: Product) => {
  try {
    // Atualiza localmente primeiro (otimista)
    setProdutos(prevProdutos =>
      prevProdutos.map(p =>
        p.id === id ? produtoAtualizado : p
      )
    );
    
    // Envia para o backend
    const { id: _, created_at, updated_at, ...produtoParaEnviar } = produtoAtualizado;
    await reposicaoService.atualizarProduto(id, produtoParaEnviar);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    mostrarNotificacao('error', 'Erro ao salvar alterações');
    // Recarrega do backend em caso de erro
    carregarDadosBackend();
  }
};

  /**
   * Manipula exclusão de produto
   */
  const handleExcluirProduto = async (id: number) => {
    try {
      // Confirma exclusão
      const produto = produtos.find(p => p.id === id);
      if (!produto) return;
      
      const confirmar = window.confirm(
        `Tem certeza que deseja excluir o produto "${produto.nome}"?`
      );
      
      if (confirmar) {
        // Atualiza localmente primeiro
        setProdutos(prevProdutos => prevProdutos.filter(p => p.id !== id));
        
        // Envia para o backend
        await reposicaoService.deletarProduto(id);
        mostrarNotificacao('info', 'Produto excluído com sucesso');
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      mostrarNotificacao('error', 'Erro ao excluir produto');
      // Recarrega do backend em caso de erro
      carregarDadosBackend();
    }
  };

  /**
   * Abre modal de detalhes
   */
  const handleAbrirModal = (produto: Product) => {
    setProdutoSelecionado(produto);
    setMostrarModal(true);
  };

  /**
   * Fecha modal de detalhes
   */
  const handleFecharModal = () => {
    setMostrarModal(false);
    setProdutoSelecionado(null);
  };

  /**
   * Salva alterações do modal
   */
  const handleSalvarModal = (produtoAtualizado: Product) => {
    handleAtualizarProduto(produtoAtualizado.id!, produtoAtualizado);
    handleFecharModal();
    mostrarNotificacao('success', 'Produto atualizado com sucesso!');
  };

  /**
   * Inicia nova contagem (limpa tudo)
   */
  const handleNovaContagem = async () => {
    try {
      // Confirma se há produtos
      if (produtos.length > 0) {
        const confirmar = window.confirm(
          'Iniciar uma nova contagem irá limpar todos os dados atuais. Deseja continuar?'
        );
        
        if (!confirmar) return;
        
        setCarregando(true);
        
        // Deleta todos os produtos do backend
        await reposicaoService.deletarTodosProdutos();
      }
      
      // Limpa dados locais
      setProdutos([]);
      setDataContagem('');
      setProximoId(1);
      
      // Abre importação
      setMostrarImportacao(true);
    } catch (error) {
      console.error('Erro ao limpar produtos:', error);
      mostrarNotificacao('error', 'Erro ao limpar produtos');
    } finally {
      setCarregando(false);
    }
  };

  /**
 * Abre modal para adicionar produto avulso
 */
const handleAdicionarProduto = () => {
  // Cria produto vazio
  const novoProduto: Product = {
    id: proximoId,
    nome: '',
    saldo_anterior: 0,
    saldo_atual: 0,
    vendas: 0,
    diferenca: 0,
    compras: 0,
    compras_com_adicional: 0,
    percentual_adicional: 10,
    data_contagem: dataContagem || new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  setProdutoSelecionado(novoProduto);
  setMostrarModalNovoProduto(true);
};

/**
 * Salva novo produto criado manualmente
 */
const handleSalvarNovoProduto = async (produto: Product) => {
  try {
    // Valida nome
    if (!produto.nome || produto.nome.trim().length === 0) {
      alert('Nome do produto é obrigatório');
      return;
    }
    
    setCarregando(true);
    
    // Define data de contagem se não existir
    const dataAtual = dataContagem || new Date().toISOString().split('T')[0];
    if (!dataContagem) {
      setDataContagem(dataAtual);
    }
    
    // Remove campos não necessários para criação
    const { id, created_at, updated_at, ...produtoParaCriar } = produto;
    produtoParaCriar.data_contagem = dataAtual;
    
    // Cria no backend
    const produtoCriado = await reposicaoService.criarProduto(produtoParaCriar);
    
    // Adiciona à lista
    setProdutos(prevProdutos => [...prevProdutos, produtoCriado]);
    
    // Fecha modal
    setMostrarModalNovoProduto(false);
    setProdutoSelecionado(null);
    
    mostrarNotificacao('success', 'Produto adicionado com sucesso!');
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    mostrarNotificacao('error', 'Erro ao adicionar produto');
  } finally {
    setCarregando(false);
  }
};

  /**
 * Exporta relatório de compras em PDF
 */
const handleExportar = () => {
  try {
    gerarRelatorioPDF({
      dataContagem,
      produtos
    });
    
    mostrarNotificacao('success', 'Relatório de compras exportado com sucesso!');
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    mostrarNotificacao('error', 'Erro ao gerar relatório PDF');
  }
};

  /**
   * Mostra notificação temporária
   */
  const mostrarNotificacao = (
    tipo: 'success' | 'error' | 'warning' | 'info',
    mensagem: string
  ) => {
    console.log(`[${tipo.toUpperCase()}] ${mensagem}`);
  };

  return (
    <div className="reposicao-page">
      
      {/* Header */}
      <ReposicaoHeader
        totalProdutos={produtos.length}
        totalPrecisaComprar={calcularTotalPrecisaComprar()}
        dataContagem={dataContagem}
        onNovaContagem={handleNovaContagem}
        onAdicionarProduto={handleAdicionarProduto}
        onExportar={handleExportar}
      />
      
      {/* Conteúdo Principal */}
      <div className="reposicao-content">
        <div className="content-container">

          {/* Loading */}
          {carregando && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Carregando...</p>
            </div>
          )}
          
          {/* Estado: Sem produtos */}
          {produtos.length === 0 && !mostrarImportacao && (
            <div className="empty-state-large">
              <div className="empty-icon-large">📊</div>
              <h2 className="empty-title">Nenhuma contagem ativa</h2>
              <p className="empty-description">
                Comece importando uma planilha com os nomes dos produtos
                que você deseja controlar.
              </p>
              <button
                className="btn btn-large btn-primary"
                onClick={() => setMostrarImportacao(true)}
              >
                <span className="btn-icon">📁</span>
                Importar Planilha
              </button>
            </div>
          )}
          
          {/* Estado: Com produtos */}
          {produtos.length > 0 && (
            <ProductsGrid
              produtos={produtos}
              onUpdateProduto={handleAtualizarProduto}
              onDeleteProduto={handleExcluirProduto}
              onOpenModal={handleAbrirModal}
            />
          )}
        </div>
      </div>
      
      {/* Modal de Importação */}
      {mostrarImportacao && (
        <ImportExcel
          onImport={handleImportarProdutos}
          onCancel={() => setMostrarImportacao(false)}
        />
      )}
      
      {/* Modal de Detalhes */}
      {mostrarModal && produtoSelecionado && (
        <ProductModal
          produto={produtoSelecionado}
          onClose={handleFecharModal}
          onSave={handleSalvarModal}
        />
      )}

      {/* Modal de Novo Produto */}
      {mostrarModalNovoProduto && produtoSelecionado && (
        <ProductModal
          produto={produtoSelecionado}
          onClose={() => {
            setMostrarModalNovoProduto(false);
            setProdutoSelecionado(null);
          }}
          onSave={handleSalvarNovoProduto}
        />
      )}
    </div>
  );
};

export default ReposicaoPage;