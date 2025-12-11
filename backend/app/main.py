"""
Aplicação principal FastAPI - Sistema de Controle de Reposição
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.routes import reposicao

# Cria as tabelas no banco
Base.metadata.create_all(bind=engine)

# Cria aplicação FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rota raiz
@app.get("/")
def root():
    return {
        "message": "Sistema de Controle de Reposição API",
        "status": "online",
        "docs": "/docs"
    }

# Rota de health check
@app.get("/health")
def health():
    return {"status": "healthy"}

# Inclui rotas da API
app.include_router(
    reposicao.router,
    prefix=f"{settings.API_V1_STR}/reposicao",
    tags=["reposicao"]
)