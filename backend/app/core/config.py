"""
Configurações da aplicação
"""
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Configurações do banco de dados
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@localhost:5432/reposicao"
    )
    
    # Configurações da API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Sistema de Controle de Reposição"
    
    # CORS
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://controle-reposicao.onrender.com"
    ]
    
    class Config:
        case_sensitive = True

settings = Settings()