"""
Rotas da API - Sistema de Controle de Reposição
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.reposicao import Product
from app.schemas.reposicao import ProductResponse, ProductCreate, ProductUpdate, ProductBulkCreate

router = APIRouter()

@router.get("/products", response_model=List[ProductResponse])
def listar_produtos(
    skip: int = 0,
    limit: int = 10000,
    db: Session = Depends(get_db)
):
    """
    Lista todos os produtos
    """
    produtos = db.query(Product).offset(skip).limit(limit).all()
    return produtos

@router.get("/products/{product_id}", response_model=ProductResponse)
def obter_produto(product_id: int, db: Session = Depends(get_db)):
    """
    Obtém um produto específico por ID
    """
    produto = db.query(Product).filter(Product.id == product_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return produto

@router.post("/products", response_model=ProductResponse)
def criar_produto(produto: ProductCreate, db: Session = Depends(get_db)):
    """
    Cria um novo produto
    """
    db_produto = Product(**produto.model_dump())
    db.add(db_produto)
    db.commit()
    db.refresh(db_produto)
    return db_produto

@router.post("/products/bulk", response_model=List[ProductResponse])
def criar_produtos_em_lote(dados: ProductBulkCreate, db: Session = Depends(get_db)):
    """
    Cria múltiplos produtos de uma vez (importação Excel)
    """
    produtos_criados = []
    for produto_data in dados.produtos:
        db_produto = Product(**produto_data.model_dump())
        db.add(db_produto)
        produtos_criados.append(db_produto)
    
    db.commit()
    
    for produto in produtos_criados:
        db.refresh(produto)
    
    return produtos_criados

@router.put("/products/{product_id}", response_model=ProductResponse)
def atualizar_produto(
    product_id: int,
    produto: ProductUpdate,
    db: Session = Depends(get_db)
):
    """
    Atualiza um produto existente
    """
    db_produto = db.query(Product).filter(Product.id == product_id).first()
    if not db_produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    for key, value in produto.model_dump().items():
        setattr(db_produto, key, value)
    
    db.commit()
    db.refresh(db_produto)
    return db_produto

@router.delete("/products/{product_id}")
def deletar_produto(product_id: int, db: Session = Depends(get_db)):
    """
    Deleta um produto
    """
    db_produto = db.query(Product).filter(Product.id == product_id).first()
    if not db_produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    db.delete(db_produto)
    db.commit()
    return {"message": "Produto deletado com sucesso"}

@router.delete("/products")
def deletar_todos_produtos(db: Session = Depends(get_db)):
    """
    Deleta todos os produtos (limpar sistema)
    """
    db.query(Product).delete()
    db.commit()
    return {"message": "Todos os produtos foram deletados"}