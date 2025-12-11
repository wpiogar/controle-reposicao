/**
 * Serviço de Exportação de PDF - Sistema de Controle de Reposição
 * 
 * Gera relatórios profissionais em PDF com design moderno
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product } from '../types/reposicao.types';

interface PDFExportOptions {
  dataContagem: string;
  produtos: Product[];
}

/**
 * Gera relatório de vendas/compras em PDF
 */
export const gerarRelatorioPDF = (options: PDFExportOptions): void => {
  const { dataContagem, produtos } = options;
  
  // Filtra apenas produtos que precisam comprar
  const produtosParaComprar = produtos.filter(p => p.compras < 0);
  
  if (produtosParaComprar.length === 0) {
    alert('Não há produtos para comprar no momento');
    return;
  }
  
  // Cria documento PDF (A4)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Configurações
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  // ============= CABEÇALHO =============
  
  // Fundo do cabeçalho (preto)
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Título principal
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de vendas', margin, 25);
  
  // Subtítulo
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Visualize atividades de vendas, pipeline e', margin, 32);
  doc.text('indicadores-chave de desempenho', margin, 37);
  
  // ============= CARDS DE RESUMO =============
  
  let yPosition = 65;
  
  // Calcula métricas
  const totalProdutos = produtosParaComprar.length;
  const totalQuantidade = produtosParaComprar.reduce((sum, p) => {
    return sum + (p.compras_com_adicional || Math.abs(p.compras));
  }, 0);
  const mediaCompras = Math.round(totalQuantidade / totalProdutos);
  
  // Card 1: Desempenho das vendas
  desenharCard(doc, margin, yPosition, 'Desempenho das vendas', [
    { label: 'Total de itens', value: totalProdutos.toString() },
    { label: 'Média por item', value: mediaCompras.toString() }
  ]);
  
  // Card 2: Status dos leads
  desenharCard(doc, margin + 65, yPosition, 'Status dos leads', [
    { label: 'Precisa comprar', value: totalProdutos.toString() },
    { label: 'Total produtos', value: produtos.length.toString() }
  ]);
  
  // Card 3: Receita de campanha
  desenharCard(doc, margin + 130, yPosition, 'Receita de campanha', [
    { label: 'Quantidade total', value: totalQuantidade.toString() },
    { label: 'Período', value: '7 dias' }
  ]);
  
  // ============= SEÇÃO: COMPRAS =============
  
  yPosition = 135;
  
  // Título da seção
  doc.setFillColor(240, 240, 240);
  doc.rect(0, yPosition, pageWidth, 12, 'F');
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Compras', margin, yPosition + 8);
  
  yPosition += 20;
  
  // Tabela de produtos
  const tableData = produtosParaComprar.map((produto, index) => [
    (index + 1).toString(),
    produto.nome,
    Math.abs(produto.compras).toString(),
    produto.compras_com_adicional 
      ? produto.compras_com_adicional.toString() 
      : '-',
    `${produto.percentual_adicional}%`
  ]);
  
  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'Produto', 'Compras', 'Com Adicional', '% Adicional']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 10,
      cellPadding: 5
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left', cellWidth: 70 },
      2: { halign: 'center', cellWidth: 25, textColor: [211, 47, 47], fontStyle: 'bold' },
      3: { halign: 'center', cellWidth: 30, textColor: [25, 118, 210], fontStyle: 'bold' },
      4: { halign: 'center', cellWidth: 30 }
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      // Rodapé em cada página
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${currentPage} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      
      // Data de geração
      const dataGeracao = new Date().toLocaleString('pt-BR');
      doc.text(
        `Gerado em ${dataGeracao}`,
        margin,
        pageHeight - 10
      );
    }
  });
  
  // ============= INFORMAÇÕES FINAIS =============
  
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  // Box de informações
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, finalY, pageWidth - (margin * 2), 25, 3, 3, 'S');
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'bold');
  doc.text('Informações do Relatório', margin + 5, finalY + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Data da Contagem: ${formatarData(dataContagem)}`, margin + 5, finalY + 15);
  doc.text(`Total de Produtos para Comprar: ${totalProdutos}`, margin + 5, finalY + 20);
  doc.text(`Quantidade Total Necessária: ${totalQuantidade}`, margin + 90, finalY + 15);
  doc.text(`Sistema: Controle de Reposição`, margin + 90, finalY + 20);
  
  // Salva o PDF
  const nomeArquivo = `relatorio_compras_${dataContagem.replace(/-/g, '')}.pdf`;
  doc.save(nomeArquivo);
};

/**
 * Desenha um card de resumo
 */
const desenharCard = (
  doc: jsPDF,
  x: number,
  y: number,
  titulo: string,
  items: Array<{ label: string; value: string }>
): void => {
  const cardWidth = 55;
  const cardHeight = 45;
  
  // Fundo do card (amarelo/dourado)
  doc.setFillColor(255, 200, 100);
  doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');
  
  // Título do card
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, x + 5, y + 8);
  
  // Items do card
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  let itemY = y + 18;
  items.forEach(item => {
    // Label
    doc.setTextColor(60, 60, 60);
    doc.text(item.label, x + 5, itemY);
    
    // Valor
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(item.value, x + 5, itemY + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    itemY += 15;
  });
};

/**
 * Formata data para exibição
 */
const formatarData = (data: string): string => {
  const dataObj = new Date(data);
  return dataObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};