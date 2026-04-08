from lxml import etree
import models
from sqlalchemy.orm import Session
import datetime

def ns(tag):
    return f"{{http://schemas.microsoft.com/project}}{tag}"

def parse_and_store_ms_project_xml(xml_content: bytes, filename: str, db: Session) -> str:
    root = etree.fromstring(xml_content)
    
    project = models.Project(
        name=filename.replace('.xml', ''),
        mpp_file_path=filename
    )
    db.add(project)
    db.flush()
    
    # Parse tasks
    tasks = root.find(ns("Tasks"))
    if tasks is not None:
        for t in tasks.findall(ns("Task")):
            uid = t.findtext(ns("UID"))
            name = t.findtext(ns("Name"), default="Unknown Task")
            
            start_str = t.findtext(ns("Start"))
            finish_str = t.findtext(ns("Finish"))
            wbs = t.findtext(ns("WBS"))
            notes = t.findtext(ns("Notes"))
            
            planned_start = None
            planned_finish = None
            
            try:
                if start_str:
                    planned_start = datetime.datetime.fromisoformat(start_str.split('T')[0])
                if finish_str:
                    planned_finish = datetime.datetime.fromisoformat(finish_str.split('T')[0])
            except ValueError:
                pass
            
            task_model = models.Task(
                project_id=project.id,
                uid=uid,
                name=name,
                wbs_code=wbs,
                planned_start=planned_start,
                planned_finish=planned_finish,
                notes=notes
            )
            db.add(task_model)
            
    db.commit()
    return project.id
