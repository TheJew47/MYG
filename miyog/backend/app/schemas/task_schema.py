from pydantic import BaseModel, Field
from typing import Optional

class TaskFiles(BaseModel):
    foreground: Optional[str] = Field(None, alias="Foreground")
    background: Optional[str] = Field(None, alias="Background")
    audio: Optional[str] = Field(None, alias="Audio Track")
    thumbnail: Optional[str] = Field(None, alias="Thumbnail")

    class Config:
        allow_population_by_field_name = True

class CaptionSettings(BaseModel):
    font: str = "Liberation-Sans-Bold"
    size: int = 80
    color: str = "yellow"
    y_pos: int = 1300
    x_pos: Optional[str] = "center" # Added x_pos
    words_per_screen: int = 1

class TaskCreateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scripts: Optional[str] = None
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    resolution: str = "1080x1920"
    
    # Flags
    background_color: Optional[str] = None
    no_captions: bool = False
    no_tts: bool = False
    keep_background_audio: bool = False 
    generate_images: bool = True
    
    # Audio Settings
    voice: str = "af_heart"
    audio_speed: float = 1.0
    
    # Visual Effects
    vignette_intensity: int = 0  # 0 to 100
    
    project_id: int
    files: Optional[TaskFiles] = None
    captions: Optional[CaptionSettings] = None

    class Config:
        allow_population_by_field_name = True