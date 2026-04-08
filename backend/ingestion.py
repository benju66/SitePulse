import xml.etree.ElementTree as ET
import models
from sqlalchemy.orm import Session
import datetime

def parse_and_store_ms_project_xml(file_path: str, filename: str, db: Session) -> str:
    with open(file_path, "rb") as f:
        xml_content = f.read()

    # MS Project XML namespace
    ns = {'ns': 'http://schemas.microsoft.com/project'}
    
    root = ET.fromstring(xml_content.decode('utf-8'))
    
    project = models.Project(
        name=filename.replace('.xml', ''),
        mpp_file_path=file_path,
        raw_xml_content=xml_content.decode('utf-8')
    )
    db.add(project)
    db.flush()
    
    # Smart Tagging logic: Build a dictionary of UID to Name, and parent mappings
    task_elements = root.findall('.//ns:Tasks/ns:Task', ns)
    
    tasks_dict = {}
    for t in task_elements:
        uid = t.findtext('ns:UID', namespaces=ns)
        name = t.findtext('ns:Name', namespaces=ns, default="Unknown Task")
        outline_level = int(t.findtext('ns:OutlineLevel', namespaces=ns, default="1"))
        
        tasks_dict[uid] = {
            'element': t,
            'name': name,
            'outline_level': outline_level,
            'parent_name': None
        }

    # Derive WBS parent logic using OutlineLevel traversing
    current_parents = {}
    for uid, data in tasks_dict.items():
        lvl = data['outline_level']
        current_parents[lvl] = data['name']
        if lvl > 1:
            data['parent_name'] = current_parents.get(lvl - 1)
            
    # Process tasks and store in DB
    for uid, data in tasks_dict.items():
        t = data['element']
        
        # WBS Code
        wbs = t.findtext('ns:WBS', namespaces=ns)
        notes = t.findtext('ns:Notes', namespaces=ns)
        
        start_str = t.findtext('ns:Start', namespaces=ns)
        finish_str = t.findtext('ns:Finish', namespaces=ns)
        
        planned_start = None
        planned_finish = None
        try:
            if start_str:
                planned_start = datetime.datetime.fromisoformat(start_str.split('T')[0])
            if finish_str:
                planned_finish = datetime.datetime.fromisoformat(finish_str.split('T')[0])
        except ValueError:
            pass
            
        name = data['name']
        if data['parent_name']:
            # Apply WBS Inheritance Smart Tagging
            name = f"[{data['parent_name']}] {name}"
            
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
