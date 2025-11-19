from app.crud.base import CRUDBase
from app.models.mutual_fund import MutualFund
from app.schemas.models import MutualFundCreate
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert

class CRUDMutualFund(CRUDBase[MutualFund, MutualFundCreate, MutualFundCreate]):
    def upsert(self, db: Session, *, obj_in: MutualFundCreate) -> MutualFund:
        insert_stmt = insert(self.model).values(obj_in.dict())
        do_update_stmt = insert_stmt.on_conflict_do_update(
            index_elements=['scheme_code'],
            set_=obj_in.dict(exclude_unset=True)
        )
        db.execute(do_update_stmt)
        db.commit()
        return db.query(self.model).get(obj_in.scheme_code)

mutual_fund = CRUDMutualFund(MutualFund)
