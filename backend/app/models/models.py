from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class CameraModel(Base):
    __tablename__ = "cameras"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    source_type = Column(String)
    source_path = Column(String)
    repeat = Column(Boolean, default=True)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    zones = relationship("ZoneModel", back_populates="camera", cascade="all, delete-orphan")
    visits = relationship("VisitModel", back_populates="camera", cascade="all, delete-orphan")

class ZoneModel(Base):
    __tablename__ = "zones"

    id = Column(String, primary_key=True, index=True)
    camera_id = Column(String, ForeignKey("cameras.id"))
    name = Column(String)
    polygon_json = Column(Text) # Store as JSON string since SQLite doesn't have native arrays
    color = Column(String)
    enabled = Column(Boolean, default=True)

    camera = relationship("CameraModel", back_populates="zones")
    visits = relationship("VisitModel", back_populates="zone", cascade="all, delete-orphan")

class VisitModel(Base):
    __tablename__ = "visits"

    id = Column(String, primary_key=True, index=True)
    camera_id = Column(String, ForeignKey("cameras.id"), index=True)
    zone_id = Column(String, ForeignKey("zones.id"), index=True)
    track_id = Column(Integer)
    entry_time = Column(DateTime, index=True)
    exit_time = Column(DateTime, nullable=True)
    duration = Column(Float, default=0.0)
    status = Column(String)

    camera = relationship("CameraModel", back_populates="visits")
    zone = relationship("ZoneModel", back_populates="visits")
