from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import Base, engine, SessionLocal
from .seed import run_seed
from .routers import auth, catalogs, users, tickets, activities


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Help Desk TI & Informe Mensual API",
    version="2.0.0",
    description="API REST estilo GLPI ligero para Gestión de Incidentes TI e Informes Mensuales de Actividades.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

app.include_router(auth.router)
app.include_router(catalogs.router)
app.include_router(users.router)
app.include_router(tickets.router)
app.include_router(activities.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "helpdesk-ti-api"}
