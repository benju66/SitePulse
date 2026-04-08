from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models
import schemas
import ingestion

# Create all database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Project Pulse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Project Pulse API"}

@app.post("/api/v1/projects/upload")
async def upload_project_xml(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.xml'):
        raise HTTPException(status_code=400, detail="Only XML files are supported currently.")
    
    contents = await file.read()
    
    try:
        project_id = ingestion.parse_and_store_ms_project_xml(contents, file.filename, db)
        return {"message": "Project parsed and saved successfully.", "project_id": project_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/tasks", response_model=list[schemas.Task])
def get_tasks(timeframe: str = "3weeks", db: Session = Depends(get_db)):
    tasks = db.query(models.Task).all()
    return tasks

@app.post("/api/v1/tasks/{task_id}/start")
def start_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    import datetime
    task.actual_start = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Task started", "task_id": task_id}

@app.post("/api/v1/tasks/{task_id}/finish")
def finish_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    import datetime
    task.actual_finish = datetime.datetime.utcnow()
    task.percent_complete = 100
    db.commit()
    return {"message": "Task finished", "task_id": task_id}
