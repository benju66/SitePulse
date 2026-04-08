import xml.etree.ElementTree as ET
import models
from sqlalchemy.orm import Session
import datetime

def generate_updated_xml(project_id: str, db: Session) -> bytes:
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project or not project.raw_xml_content:
        raise ValueError("Project or original XML not found.")

    ET.register_namespace('', 'http://schemas.microsoft.com/project')
    ns = {'ns': 'http://schemas.microsoft.com/project'}
    
    root = ET.fromstring(project.raw_xml_content)
    
    # Pre-load tasks from db that have actuals
    tasks = db.query(models.Task).filter(
        models.Task.project_id == project_id,
        (models.Task.actual_start.isnot(None)) | (models.Task.actual_finish.isnot(None))
    ).all()
    
    task_map = {t.uid: t for t in tasks if t.uid}
    
    for tk in root.findall('.//ns:Tasks/ns:Task', ns):
        uid_elem = tk.find('ns:UID', ns)
        if uid_elem is None or uid_elem.text not in task_map:
            continue
            
        db_task = task_map[uid_elem.text]
        
        if db_task.actual_start:
            astart = tk.find('ns:ActualStart', ns)
            if astart is None:
                astart = ET.SubElement(tk, '{http://schemas.microsoft.com/project}ActualStart')
            astart.text = db_task.actual_start.isoformat()
            
        if db_task.actual_finish:
            afinish = tk.find('ns:ActualFinish', ns)
            if afinish is None:
                afinish = ET.SubElement(tk, '{http://schemas.microsoft.com/project}ActualFinish')
            afinish.text = db_task.actual_finish.isoformat()
            
            pcomp = tk.find('ns:PercentComplete', ns)
            if pcomp is None:
                pcomp = ET.SubElement(tk, '{http://schemas.microsoft.com/project}PercentComplete')
            pcomp.text = "100"
            
    xml_str = ET.tostring(root, encoding='utf-8', method='xml', xml_declaration=True)
    return xml_str
