from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    project_name: str = "AisleIQ"
    debug: bool = True
    database_url: str = "sqlite:///./aisleiq.db"
    
    # Vision settings
    model_name: str = "yolov8n.pt"
    confidence_threshold: float = 0.3
    target_fps: int = 15
    resize_width: int = 640
    resize_height: int = 480
    
    # Analytics settings
    track_loss_timeout: float = 2.0
    min_visit_duration: float = 1.0
    
    # Phase 23: Staff Uniform Exclusion (comma-separated colors, e.g. "red,blue")
    staff_uniform_colors: str = ""
    
    class Config:
        env_file = ".env"

settings = Settings()
