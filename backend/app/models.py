# backend/app/models.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    # Changed to UUID to match Supabase auth.users ID format
    id = Column(UUID(as_uuid=True), primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    # Renamed from credits_balance to credits to match the SQL schema
    credits = Column(Integer, default=10)
    projects = relationship("Project", back_populates="owner")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String, nullable=True)
    platform = Column(String, default='YouTube')
    color_code = Column(String, default='#000000')
    emoji = Column(String, default='VP')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Must match the User.id type (UUID)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    owner = relationship("User", back_populates="projects")
    tasks = relationship("Task", back_populates="project")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, default='New AI Video')
    description = Column(Text, nullable=True)
    script = Column(Text, nullable=True)
    status = Column(String, default="Processing") 
    resolution = Column(String, default="1080x1920")
    fps = Column(Integer, default=24)
    
    progress = Column(Integer, default=0)
    video_url = Column(String, nullable=True)
    
    # AI Generation Flags
    generate_script = Column(Boolean, default=False)
    generate_audio = Column(Boolean, default=False)
    generate_images = Column(Boolean, default=True)
    generate_video = Column(Boolean, default=False)
    
    background_color = Column(String, nullable=True)
    vignette_intensity = Column(Integer, default=0)
    caption_font = Column(String, default="Liberation-Sans-Bold")
    caption_size = Column(Integer, default=80)
    caption_color = Column(String, default="yellow")
    caption_y = Column(Integer, default=1300)
    caption_x = Column(String, default="center")
    caption_words_per_screen = Column(Integer, default=1)

    timeline_data = Column(JSON, nullable=True)

    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    project = relationship("Project", back_populates="tasks")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())