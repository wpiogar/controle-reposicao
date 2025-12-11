"""
Modelos de banco de dados - Sistema de Controle de Reposição
"""
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Product(Base):
    """
    Modelo de Produto
    """
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False, index=True)
    saldo_anterior = Column(Float, default=0)
    saldo_atual = Column(Float, default=0)
    vendas = Column(Float, default=0)
    diferenca = Column(Float, default=0)
    compras = Column(Float, default=0)
    compras_com_adicional = Column(Float, default=0)
    percentual_adicional = Column(Integer, default=10)
    data_contagem = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())