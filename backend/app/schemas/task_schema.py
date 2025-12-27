from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict

class TaskFiles(BaseModel):
    foreground: Optional[str] = Field(None, alias="Foreground")
    background: Optional[str] = Field(None, alias="Background")
    audio: Optional[str] = Field(None, alias="Audio Track")
    thumbnail: Optional[str] = Field(None, alias="Thumbnail")

    class Config:
        populate_by_name = True

class CaptionSettings(BaseModel):
    font: str = "Liberation-Sans-Bold"
    size: int = 80
    color: str = "yellow"
    y_pos: int = 1300
    x_pos: Optional[str] = "center" 
    words_per_screen: int = 1

class TaskCreateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scripts: Optional[str] = None
    resolution: str = "1080x1920"
    fps: int = 24
    duration: float = 30.0
    
    # --- AI GENERATION TOGGLES ---
    generate_script: bool = False
    generate_audio: bool = False
    generate_images: bool = True
    generate_video: bool = False
    
    # Visual & Audio Settings
    background_color: Optional[str] = None
    vignette_intensity: int = 0
    
    # Metadata
    # MODIFIED: project_id is now optional
    project_id: Optional[int] = None
    files: Optional[TaskFiles] = None
    captions: Optional[CaptionSettings] = None
    
    # NLE Timeline Data
    timeline: Optional[List[Dict[str, Any]]] = None 

    class Config:
        populate_by_name = True