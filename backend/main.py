from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from fastapi.responses import Response
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
    import datetime
    # We will use simple start date bounding for actionable tasks
    today = datetime.datetime.utcnow().replace(tzinfo=None)
    three_weeks = today + datetime.timedelta(days=21)
    
    tasks = db.query(models.Task).filter(
        models.Task.planned_start.isnot(None),
        models.Task.planned_start <= three_weeks,
        models.Task.planned_finish >= today
    ).order_by(models.Task.planned_start.asc()).all()
    
    return tasks

@app.post("/api/v1/tasks/{task_id}/start")
def start_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    import datetime
    update = models.TaskUpdate(
        task_id=task_id,
        status=models.UpdateStatus.pending,
        requested_actual_start=datetime.datetime.utcnow()
    )
    db.add(update)
    db.commit()
    return {"message": "Start update submitted for approval", "task_id": task_id}

@app.post("/api/v1/tasks/{task_id}/finish")
def finish_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    import datetime
    update = models.TaskUpdate(
        task_id=task_id,
        status=models.UpdateStatus.pending,
        requested_actual_finish=datetime.datetime.utcnow(),
        requested_percent_complete=100
    )
    db.add(update)
    db.commit()
    return {"message": "Finish update submitted for approval", "task_id": task_id}

@app.post("/api/v1/tasks/{task_id}/roadblock")
def report_roadblock(task_id: str, roadblock_data: schemas.RoadblockCreate, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    roadblock = models.Roadblock(
        task_id=task_id,
        category=roadblock_data.category,
        note=roadblock_data.note,
        photo_url=roadblock_data.photo_url
    )
    db.add(roadblock)
    db.commit()
    return {"message": "Roadblock reported successfully"}

@app.get("/api/v1/updates", response_model=list[schemas.TaskUpdateResponse])
def get_pending_updates(status: str = "pending", db: Session = Depends(get_db)):
    # Assuming user fetches pending status by default
    query_status = models.UpdateStatus(status)
    updates = db.query(models.TaskUpdate).filter(models.TaskUpdate.status == query_status).all()
    return updates

@app.post("/api/v1/updates/{update_id}/approve")
def approve_update(update_id: str, db: Session = Depends(get_db)):
    import datetime
    update = db.query(models.TaskUpdate).filter(models.TaskUpdate.id == update_id).first()
    if not update:
        raise HTTPException(status_code=404, detail="Update not found")
    
    if update.status != models.UpdateStatus.pending:
        raise HTTPException(status_code=400, detail="Update is not pending")
        
    task = db.query(models.Task).filter(models.Task.id == update.task_id).first()
    
    # Apply changes
    if update.requested_actual_start:
        task.actual_start = update.requested_actual_start
    if update.requested_actual_finish:
        task.actual_finish = update.requested_actual_finish
    if update.requested_percent_complete is not None:
        task.percent_complete = update.requested_percent_complete
        
    update.status = models.UpdateStatus.approved
    update.approved_at = datetime.datetime.utcnow()
    
    db.commit()
    return {"message": "Update approved"}

@app.get("/api/v1/projects/export")
def export_project_xml(db: Session = Depends(get_db)):
    project = db.query(models.Project).first()
    if not project:
        raise HTTPException(status_code=404, detail="No projects found.")

    import export
    try:
        xml_bytes = export.generate_updated_xml(project.id, db)
        return Response(content=xml_bytes, media_type="application/xml", headers={
            "Content-Disposition": f"attachment; filename=updated_{project.name}.xml"
        })
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
