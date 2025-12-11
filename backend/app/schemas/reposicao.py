"""
Schemas Pydantic - Sistema de Controle de Reposição
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ProductBase(BaseModel):
    """
    Schema base do produto
    """
    nome: str
    saldo_anterior: float = 0
    saldo_atual: float = 0
    vendas: float = 0
    diferenca: float = 0
    compras: float = 0
    compras_com_adicional: float = 0
    percentual_adicional: int = 10
    data_contagem: str

class ProductCreate(ProductBase):
    """
    Schema para criação de produto
    """
    pass

class ProductUpdate(ProductBase):
    """
    Schema para atualização de produto
    """
    pass

class ProductResponse(ProductBase):
    """
    Schema de resposta do produto
    """
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ProductBulkCreate(BaseModel):
    """
    Schema para criação em lote (importação Excel)
    """
    produtos: list[ProductCreate]