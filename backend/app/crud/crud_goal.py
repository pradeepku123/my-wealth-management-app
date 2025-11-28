from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.crud.base import CRUDBase
from app.models.goal import Goal
from app.models.investment import Investment
from app.schemas.goal import GoalCreate, GoalUpdate

class CRUDGoal(CRUDBase[Goal, GoalCreate, GoalUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: GoalCreate, owner_id: int
    ) -> Goal:
        db_obj = Goal(
            name=obj_in.name,
            target_amount=obj_in.target_amount,
            target_date=obj_in.target_date,
            monthly_sip_amount=obj_in.monthly_sip_amount,
            owner_id=owner_id,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_by_owner(
        self, db: Session, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[Goal]:
        return (
            db.query(self.model)
            .filter(Goal.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def link_investments(self, db: Session, *, goal_id: int, investment_ids: List[int]) -> Goal:
        goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not goal:
            return None
        
        # Clear existing links
        from app.models.goal_investment import GoalInvestment
        db.query(GoalInvestment).filter(GoalInvestment.goal_id == goal_id).delete()
        
        investments = db.query(Investment).filter(Investment.id.in_(investment_ids)).all()
        
        # Re-implementing the loop to track total allocated
        current_goal_allocation = 0
        
        for inv in investments:
            # Calculate how much of this investment is already used by OTHER goals
            used_amount = db.query(func.sum(GoalInvestment.allocated_amount))\
                .filter(GoalInvestment.investment_id == inv.id)\
                .filter(GoalInvestment.goal_id != goal_id)\
                .scalar() or 0
            
            current_val = float(inv.current_value or 0)
            used_val = float(used_amount)
            available_for_inv = current_val - used_val
            
            if available_for_inv > 0.01:
                allocation = available_for_inv
                
                # Cap at goal target if it exists
                if goal.target_amount and goal.target_amount > 0:
                    needed = float(goal.target_amount) - current_goal_allocation
                    if needed < 0:
                        needed = 0
                    
                    # We only take what is needed, or what is available, whichever is lower
                    allocation = min(available_for_inv, needed)
                
                if allocation > 0:
                    assoc = GoalInvestment(
                        goal_id=goal.id,
                        investment_id=inv.id,
                        allocated_amount=allocation
                    )
                    db.add(assoc)
                    current_goal_allocation += allocation
        
        db.commit()
        db.refresh(goal)
        return goal

goal = CRUDGoal(Goal)
