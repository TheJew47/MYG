from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    credits_balance = Column(Integer, default=100)
    projects = relationship("Project", back_populates="owner")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String, nullable=True)
    platform = Column(String)
    color_code = Column(String)
    emoji = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    owner_id = Column(String, ForeignKey("users.id"))
    owner = relationship("User", back_populates="projects")
    tasks = relationship("Task", back_populates="project")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    script = Column(Text, nullable=True)
    status = Column(String, default="Draft") 
    resolution = Column(String, default="1080x1920")
    
    progress = Column(Integer, default=0)
    video_url = Column(String, nullable=True)
    
    # Settings
    background_color = Column(String, nullable=True)
    generate_images = Column(Boolean, default=True)
    vignette_intensity = Column(Integer, default=0)
    
    caption_font = Column(String, default="Liberation-Sans-Bold")
    caption_size = Column(Integer, default=80)
    caption_color = Column(String, default="yellow")
    caption_y = Column(Integer, default=1300)
    caption_x = Column(String, default="center") # Added caption_x
    caption_words_per_screen = Column(Integer, default=1)

    project_id = Column(Integer, ForeignKey("projects.id"))
    project = relationship("Project", back_populates="tasks")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())