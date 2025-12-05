from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.risk_profile import RiskProfile
from app.schemas.risk_profile import RiskProfileCreate, RiskProfileUpdate

class CRUDRiskProfile(CRUDBase[RiskProfile, RiskProfileCreate, RiskProfileUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: RiskProfileCreate, user_id: int, risk_score: int, risk_category: str
    ) -> RiskProfile:
        db_obj = RiskProfile(
            user_id=user_id,
            risk_score=risk_score,
            risk_category=risk_category,
            answers=obj_in.answers
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_user(self, db: Session, *, user_id: int) -> RiskProfile | None:
        return db.query(RiskProfile).filter(RiskProfile.user_id == user_id).first()

risk_profile = CRUDRiskProfile(RiskProfile)
