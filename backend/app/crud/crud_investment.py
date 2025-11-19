from app.crud.base import CRUDBase
from app.models.investment import Investment
from app.schemas.models import InvestmentCreate, InvestmentUpdate

class CRUDInvestment(CRUDBase[Investment, InvestmentCreate, InvestmentUpdate]):
    pass

investment = CRUDInvestment(Investment)
