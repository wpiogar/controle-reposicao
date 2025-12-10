/**
 * Componente: Importação de Produtos via Excel
 * 
 * Permite o upload de planilhas Excel (.xlsx, .xls) contendo
 * nomes de produtos para iniciar uma nova contagem
 * 
 * ATUALIZADO: Usando ExcelJS ao invés de XLSX
 */

import React, { useState, useRef } from 'react';
import * as ExcelJS from 'exceljs';
import { ExcelImportData } from '../../types/reposicao.types';
import './ImportExcel.css';

interface ImportExcelProps {
  onImport: (produtos: ExcelImportData[]) => void;
  onCancel: () => void;
}

const ImportExcel: React.FC<ImportExcelProps> = ({ onImport, onCancel }) => {
  
  // Estados do componente
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [erro, setErro] = useState<string>('');
  const [preview, setPreview] = useState<ExcelImportData[]>([]);
  
  // Referência para o input de arquivo
  const inputArquivoRef = useRef<HTMLInputElement>(null);

  /**
   * Manipula a seleção de arquivo
   */
  const handleArquivoSelecionado = (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivoSelecionado = event.target.files?.[0];
    
    // Limpa estados anteriores
    setErro('');
    setPreview([]);
    
    if (!arquivoSelecionado) {
      setArquivo(null);
      return;
    }
    
    // Valida extensão do arquivo
    const extensoesValidas = ['.xlsx', '.xls'];
    const extensao = arquivoSelecionado.name.substring(
      arquivoSelecionado.name.lastIndexOf('.')
    ).toLowerCase();
    
    if (!extensoesValidas.includes(extensao)) {
      setErro('Formato de arquivo inválido. Use apenas .xlsx ou .xls');
      setArquivo(null);
      return;
    }
    
    setArquivo(arquivoSelecionado);
  };

  /**
   * Processa o arquivo Excel e extrai os nomes dos produtos
   */
  const processarArquivo = async () => {
    if (!arquivo) {
      setErro('Nenhum arquivo selecionado');
      return;
    }
    
    setCarregando(true);
    setErro('');
    
    try {
      // Cria uma nova workbook
      const workbook = new ExcelJS.Workbook();
      
      // Lê o arquivo
      const arrayBuffer = await arquivo.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      
      // Pega a primeira planilha
      const worksheet = workbook.worksheets[0];
      
      if (!worksheet) {
        throw new Error('A planilha está vazia');
      }
      
      // Extrai nomes de produtos (assume que estão na primeira coluna)
      const produtos: ExcelImportData[] = [];
      
      // Itera sobre as linhas
      worksheet.eachRow((row, rowNumber) => {
        // Pega o valor da primeira célula
        const primeiraColuna = row.getCell(1);
        const nomeProduto = primeiraColuna.value;
        
        // Valida se há nome e não é um cabeçalho comum
        if (
          nomeProduto &&
          typeof nomeProduto === 'string' &&
          nomeProduto.trim() !== '' &&
          nomeProduto.toLowerCase() !== 'produto' &&
          nomeProduto.toLowerCase() !== 'nome'
        ) {
          produtos.push({
            nome: nomeProduto.trim()
          });
        }
      });
      
      // Valida se encontrou produtos
      if (produtos.length === 0) {
        throw new Error('Nenhum produto válido encontrado na planilha');
      }
      
      // Remove duplicatas
      const produtosUnicos = produtos.filter(
        (produto, index, self) =>
          index === self.findIndex((p) => p.nome === produto.nome)
      );
      
      // Atualiza preview
      setPreview(produtosUnicos);
      
    } catch (error: any) {
      console.error('Erro ao processar arquivo:', error);
      setErro(error.message || 'Erro ao processar o arquivo Excel');
      setPreview([]);
    } finally {
      setCarregando(false);
    }
  };

  /**
   * Confirma a importação dos produtos
   */
  const handleConfirmarImportacao = () => {
    if (preview.length > 0) {
      onImport(preview);
    }
  };

  /**
   * Reseta o formulário
   */
  const handleReset = () => {
    setArquivo(null);
    setErro('');
    setPreview([]);
    if (inputArquivoRef.current) {
      inputArquivoRef.current.value = '';
    }
  };

  return (
    <div className="import-excel-container">
      <div className="import-excel-card">
        
        {/* Cabeçalho */}
        <div className="import-header">
          <h2 className="import-title">Importar Produtos</h2>
          <p className="import-subtitle">
            Faça upload de uma planilha Excel com os nomes dos produtos
          </p>
        </div>
        
        {/* Área de upload */}
        <div className="import-body">
          
          {/* Input de arquivo */}
          <div className="file-input-wrapper">
            <input
              ref={inputArquivoRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleArquivoSelecionado}
              className="file-input"
              id="arquivo-excel"
            />
            <label htmlFor="arquivo-excel" className="file-input-label">
              <span className="file-icon">📁</span>
              <span className="file-text">
                {arquivo ? arquivo.name : 'Selecione um arquivo Excel'}
              </span>
            </label>
          </div>
          
          {/* Informações sobre o formato */}
          <div className="format-info">
            <p className="format-info-title">Formato esperado:</p>
            <ul className="format-info-list">
              <li>Arquivo Excel (.xlsx ou .xls)</li>
              <li>Nomes dos produtos na primeira coluna</li>
              <li>Uma linha por produto</li>
              <li>Cabeçalhos serão ignorados automaticamente</li>
            </ul>
          </div>
          
          {/* Botão de processar */}
          {arquivo && !preview.length && (
            <button
              className="btn btn-process"
              onClick={processarArquivo}
              disabled={carregando}
            >
              {carregando ? 'Processando...' : 'Processar Arquivo'}
            </button>
          )}
          
          {/* Mensagem de erro */}
          {erro && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span className="alert-text">{erro}</span>
            </div>
          )}
          
          {/* Preview dos produtos */}
          {preview.length > 0 && (
            <div className="preview-container">
              <div className="preview-header">
                <h3 className="preview-title">
                  Produtos encontrados: {preview.length}
                </h3>
                <button
                  className="btn-link"
                  onClick={handleReset}
                >
                  Selecionar outro arquivo
                </button>
              </div>
              
              <div className="preview-list">
                {preview.slice(0, 10).map((produto, index) => (
                  <div key={index} className="preview-item">
                    <span className="preview-number">{index + 1}</span>
                    <span className="preview-name">{produto.nome}</span>
                  </div>
                ))}
                
                {preview.length > 10 && (
                  <div className="preview-more">
                    E mais {preview.length - 10} produtos...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Rodapé com ações */}
        <div className="import-footer">
          <button
            className="btn btn-cancel"
            onClick={onCancel}
          >
            Cancelar
          </button>
          
          <button
            className="btn btn-confirm"
            onClick={handleConfirmarImportacao}
            disabled={preview.length === 0}
          >
            Importar {preview.length > 0 && `(${preview.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportExcel;