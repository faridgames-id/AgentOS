import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
from collections import defaultdict

router = APIRouter()

# Initialize Firebase
FIREBASE_CREDS = os.path.expanduser("~/.hermes/firebase-credentials.json")
if os.path.exists(FIREBASE_CREDS):
    cred = credentials.Certificate(FIREBASE_CREDS)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.Client()
    UID = "nNK0Dh9LJQcvBULiY83DP4hu8CH3"
else:
    db = None
    UID = None

class TransactionRequest(BaseModel):
    amount: float
    category: str
    description: Optional[str] = ""

@router.get("/summary")
async def get_summary():
    """Get total finance summary from Firebase"""
    if not db or not UID:
        return {
            "total_income": 0,
            "total_expense": 0,
            "net_profit": 0,
            "income_count": 0,
            "expense_count": 0,
        }
    
    try:
        docs = list(db.collection('users').document(UID).collection('income').stream())
        
        income = sum(d.to_dict().get('amount', 0) for d in docs if d.to_dict().get('type') == 'income')
        expense = sum(d.to_dict().get('amount', 0) for d in docs if d.to_dict().get('type') == 'expense')
        
        return {
            "total_income": income,
            "total_expense": expense,
            "net_profit": income - expense,
            "income_count": sum(1 for d in docs if d.to_dict().get('type') == 'income'),
            "expense_count": sum(1 for d in docs if d.to_dict().get('type') == 'expense'),
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/monthly-summary")
async def get_monthly_summary():
    """Get monthly breakdown of income and expense"""
    if not db or not UID:
        return []
    
    try:
        monthly = defaultdict(lambda: {"income": 0, "expense": 0, "income_count": 0, "expense_count": 0})
        
        # Get income collection
        docs = db.collection('users').document(UID).collection('income').stream()
        for doc in docs:
            data = doc.to_dict()
            amt = data.get('amount', 0)
            t = data.get('type', 'income')
            date = data.get('date', '')
            
            if date:
                month = date[:7] if len(date) >= 7 else 'unknown'
            else:
                month = 'unknown'
            
            if t == 'income':
                monthly[month]['income'] += amt
                monthly[month]['income_count'] += 1
            elif t == 'expense':
                monthly[month]['expense'] += amt
                monthly[month]['expense_count'] += 1
        
        # Get expense collection
        docs = db.collection('users').document(UID).collection('expense').stream()
        for doc in docs:
            data = doc.to_dict()
            amt = data.get('amount', 0)
            date = data.get('date', '')
            
            if date:
                month = date[:7] if len(date) >= 7 else 'unknown'
            else:
                month = 'unknown'
            
            monthly[month]['expense'] += amt
            monthly[month]['expense_count'] += 1
        
        # Format results
        result = []
        month_names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
        
        for month in sorted(monthly.keys()):
            data = monthly[month]
            net = data['income'] - data['expense']
            
            if month == 'unknown':
                month_name = 'Unknown'
            else:
                year, mon = month.split('-')
                month_name = f"{month_names[int(mon)]} {year}"
            
            result.append({
                "month": month,
                "month_name": month_name,
                "income": data['income'],
                "expense": data['expense'],
                "net_profit": net,
                "income_count": data['income_count'],
                "expense_count": data['expense_count']
            })
        
        return result
    except Exception as e:
        return [{"error": str(e)}]

@router.get("/transactions")
async def get_transactions(month: Optional[str] = None):
    """Get transactions, optionally filtered by month"""
    if not db or not UID:
        return {"transactions": [], "count": 0}
    
    try:
        transactions = []
        
        # Income
        docs = db.collection('users').document(UID).collection('income').stream()
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            if month and not data.get('date', '').startswith(month):
                continue
            transactions.append(data)
        
        # Expense
        docs = db.collection('users').document(UID).collection('expense').stream()
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            data['type'] = 'expense'
            if month and not data.get('date', '').startswith(month):
                continue
            transactions.append(data)
        
        # Sort by date
        transactions.sort(key=lambda x: x.get('date', ''), reverse=True)
        
        return {"transactions": transactions, "count": len(transactions)}
    except Exception as e:
        return {"transactions": [], "count": 0, "error": str(e)}

@router.post("/add-income")
async def add_income(tx: TransactionRequest):
    """Add income transaction"""
    if not db or not UID:
        raise HTTPException(500, "Database not initialized")
    
    try:
        import datetime
        doc_ref = db.collection('users').document(UID).collection('income').add({
            'amount': tx.amount,
            'type': 'income',
            'category': tx.category,
            'description': tx.description,
            'date': datetime.date.today().isoformat(),
            'created_at': firestore.SERVER_TIMESTAMP
        })
        return {"success": True, "id": doc_ref[1].id}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/add-expense")
async def add_expense(tx: TransactionRequest):
    """Add expense transaction"""
    if not db or not UID:
        raise HTTPException(500, "Database not initialized")
    
    try:
        import datetime
        doc_ref = db.collection('users').document(UID).collection('income').add({
            'amount': tx.amount,
            'type': 'expense',
            'category': tx.category,
            'description': tx.description,
            'date': datetime.date.today().isoformat(),
            'created_at': firestore.SERVER_TIMESTAMP
        })
        return {"success": True, "id": doc_ref[1].id}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.delete("/transaction/{tx_id}")
async def delete_transaction(tx_id: str):
    """Delete transaction"""
    if not db or not UID:
        raise HTTPException(500, "Database not initialized")
    
    try:
        db.collection('users').document(UID).collection('income').document(tx_id).delete()
        return {"success": True}
    except Exception as e:
        raise HTTPException(500, str(e))
