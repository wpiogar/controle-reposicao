import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

import pandas as pd
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.reposicao import Product
from datetime import datetime

def importar_extrato_chefweb(arquivo_excel, data_contagem=None):
    if not data_contagem:
        data_contagem = datetime.now().strftime('%Y-%m-%d')
    
    print(f"\n{'='*80}")
    print(f"IMPORTACAO DE EXTRATO CHEFWEB")
    print(f"{'='*80}\n")
    print(f"Arquivo: {arquivo_excel}")
    print(f"Data da Contagem: {data_contagem}\n")
    
    try:
        print("Lendo planilha...")
        df = pd.read_excel(arquivo_excel)
        
        colunas_esperadas = ['Produto', 'Saldo Anterior', 'Saldo Atual', 'Vendas']
        if list(df.columns) != colunas_esperadas:
            raise ValueError(f"Colunas esperadas: {colunas_esperadas}")
        
        print(f"Planilha validada: {len(df)} produtos\n")
        
        db = SessionLocal()
        
        try:
            produtos_importados = 0
            produtos_com_erro = 0
            
            for index, row in df.iterrows():
                try:
                    nome = str(row['Produto']).strip()
                    saldo_anterior = float(row['Saldo Anterior']) if pd.notna(row['Saldo Anterior']) else 0
                    saldo_atual = float(row['Saldo Atual']) if pd.notna(row['Saldo Atual']) else 0
                    vendas = float(row['Vendas']) if pd.notna(row['Vendas']) else 0
                    
                    if not nome or len(nome) < 2:
                        produtos_com_erro += 1
                        continue
                    
                    diferenca = saldo_anterior - saldo_atual
                    compras = saldo_atual - vendas
                    percentual_adicional = 10
                    
                    if compras < 0:
                        quantidade_base = abs(compras)
                        adicional = (quantidade_base * percentual_adicional) / 100
                        compras_com_adicional = quantidade_base + adicional
                    else:
                        compras_com_adicional = 0
                    
                    produto = Product(
                        nome=nome,
                        saldo_anterior=saldo_anterior,
                        saldo_atual=saldo_atual,
                        vendas=vendas,
                        diferenca=diferenca,
                        compras=compras,
                        compras_com_adicional=compras_com_adicional,
                        percentual_adicional=percentual_adicional,
                        data_contagem=data_contagem
                    )
                    
                    db.add(produto)
                    produtos_importados += 1
                    
                    if (index + 1) % 50 == 0:
                        print(f"   Processados: {index + 1}/{len(df)}...")
                
                except Exception as e:
                    print(f"Erro na linha {index + 2}: {str(e)}")
                    produtos_com_erro += 1
            
            print(f"\nSalvando no banco...")
            db.commit()
            
            print(f"\n{'='*80}")
            print(f"IMPORTACAO CONCLUIDA")
            print(f"{'='*80}\n")
            print(f"Importados: {produtos_importados}")
            print(f"Erros: {produtos_com_erro}")
            print(f"Total: {len(df)}\n")
            
        except Exception as e:
            db.rollback()
            print(f"\nERRO: {str(e)}")
            raise
        finally:
            db.close()
    
    except Exception as e:
        print(f"\nERRO: {str(e)}\n")
        raise

if __name__ == '__main__':
    arquivo = 'extrato_processado_formatado.xlsx'
    data_contagem = sys.argv[1] if len(sys.argv) > 1 else None
    importar_extrato_chefweb(arquivo, data_contagem)
