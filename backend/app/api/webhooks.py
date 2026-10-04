from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
from app.database import SessionLocal
from app.models.models import TransactionModel

router = APIRouter(tags=["webhooks"])

class POSTransaction(BaseModel):
    amount: float
    timestamp: Optional[datetime] = None

@router.post("/api/webhooks/pos")
def pos_webhook(transaction: POSTransaction):
    db = SessionLocal()
    try:
        db_tx = TransactionModel(
            id=str(uuid.uuid4()),
            amount=transaction.amount,
            timestamp=transaction.timestamp or datetime.utcnow()
        )
        db.add(db_tx)
        db.commit()
        return {"status": "success", "transaction_id": db_tx.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
