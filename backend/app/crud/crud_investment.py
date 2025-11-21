from app.crud.base import CRUDBase
from app.models.investment import Investment
from app.schemas.models import InvestmentCreate, InvestmentUpdate
from sqlalchemy.orm import Session
from typing import List

class CRUDInvestment(CRUDBase[Investment, InvestmentCreate, InvestmentUpdate]):
    def create_with_owner(self, db: Session, *, obj_in: InvestmentCreate, owner_id: int) -> Investment:
        db_obj = Investment(**obj_in.dict(), owner_id=owner_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_by_owner(
        self, db: Session, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[Investment]:
        return (
            db.query(self.model)
            .filter(Investment.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

investment = CRUDInvestment(Investment)
