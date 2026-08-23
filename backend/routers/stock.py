import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path
from datetime import datetime

router = APIRouter()

SHOP_CREDS_PATH = Path.home() / ".hermes" / "firebase-credentials-shop.json"
_user_db = None
USER_DOC_ID = 'faridilhamarroyan@gmail.com'

def get_user_db():
    global _user_db
    if _user_db is not None:
        return _user_db
    try:
        if SHOP_CREDS_PATH.exists():
            cred = credentials.Certificate(str(SHOP_CREDS_PATH))
            firebase_admin.initialize_app(cred, name='shop')
            _user_db = firestore.client(app=firebase_admin.get_app('shop'))
            print("✅ Firebase shop initialized")
            return _user_db
    except Exception as e:
        print(f"Firebase init error: {e}")
    return None

class AddAccount(BaseModel):
    # Basic Info
    email: str
    namaPenjual: str
    game: str = 'Free Fire'
    password: str
    loginVia: str = 'Google'
    
    # Pricing
    hargaBeli: int
    targetJual: int
    hargaJual: int = 0
    
    # Details
    spec: str = ''
    device: str = ''
    rank: str = 'Heroic'
    catatan: str = ''
    
    # Dates
    tanggalMasuk: str = ''
    bulanMasuk: str = ''
    tanggalJual: str = ''
    
    # Status
    status: str = 'Ready'
    pembeli: str = ''
    riwayatCicilan: List[dict] = []
    totalDibayar: int = 0

@router.get("/")
async def get_all_accounts():
    db = get_user_db()
    if not db:
        return {"items": [], "count": 0, "error": "Firebase not initialized"}
    try:
        user_doc = db.collection('users').document(USER_DOC_ID).get()
        if not user_doc.exists:
            return {"items": [], "count": 0}
        accounts = user_doc.to_dict().get('accounts', [])
        return {"items": accounts, "count": len(accounts)}
    except Exception as e:
        return {"items": [], "count": 0, "error": str(e)}

@router.post("/")
async def add_account(item: AddAccount):
    """Add new account to user's accounts array"""
    db = get_user_db()
    if not db:
        raise HTTPException(500, "Firebase not initialized")
    
    try:
        # Get current user document
        user_ref = db.collection('users').document(USER_DOC_ID)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            # Create new document
            new_account = item.model_dump()
            new_account['id'] = f"FF-{datetime.now().strftime('%d')}-{len([])+1:03d}"
            accounts = [new_account]
            user_ref.set({'accounts': accounts, 'email': USER_DOC_ID})
        else:
            # Add to existing accounts
            current_data = user_doc.to_dict()
            accounts = current_data.get('accounts', [])
            
            # Generate ID
            ff_count = sum(1 for a in accounts if a.get('game') == 'Free Fire')
            new_id = f"FF-{datetime.now().strftime('%d')}-{ff_count+1:03d}"
            
            new_account = item.model_dump()
            new_account['id'] = new_id
            accounts.append(new_account)
            
            # Update document
            user_ref.update({'accounts': accounts})
        
        return {"success": True, "id": new_account.get('id'), "message": "Account added successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.put("/{account_id}")
async def update_account(account_id: str, item: AddAccount):
    """Update existing account"""
    db = get_user_db()
    if not db:
        raise HTTPException(500, "Firebase not initialized")
    
    try:
        user_ref = db.collection('users').document(USER_DOC_ID)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(404, "User not found")
        
        accounts = user_doc.to_dict().get('accounts', [])
        
        # Find and update account
        updated = False
        for i, acc in enumerate(accounts):
            if acc.get('id') == account_id:
                accounts[i].update(item.model_dump())
                updated = True
                break
        
        if not updated:
            raise HTTPException(404, "Account not found")
        
        user_ref.update({'accounts': accounts})
        return {"success": True, "id": account_id}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.delete("/{account_id}")
async def delete_account(account_id: str):
    """Delete account from user's accounts"""
    db = get_user_db()
    if not db:
        raise HTTPException(500, "Firebase not initialized")
    
    try:
        user_ref = db.collection('users').document(USER_DOC_ID)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(404, "User not found")
        
        accounts = user_doc.to_dict().get('accounts', [])
        accounts = [a for a in accounts if a.get('id') != account_id]
        
        user_ref.update({'accounts': accounts})
        return {"success": True, "id": account_id}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/summary")
async def get_stock_summary():
    db = get_user_db()
    if not db:
        return {"error": "Firebase not initialized"}
    
    try:
        user_doc = db.collection('users').document(USER_DOC_ID).get()
        if not user_doc.exists:
            return {"error": "User not found"}
        
        accounts = user_doc.to_dict().get('accounts', [])
        
        ff_count = sum(1 for a in accounts if a.get('game') == 'Free Fire')
        ml_count = sum(1 for a in accounts if a.get('game') == 'Mobile Legends')
        
        ready_count = sum(1 for a in accounts if a.get('status') == 'Ready')
        terjual_count = sum(1 for a in accounts if a.get('status') == 'Terjual')
        cicilan_count = sum(1 for a in accounts if a.get('status') == 'Cicilan')
        
        total_modal = sum(a.get('hargaBeli', 0) for a in accounts)
        total_target = sum(a.get('targetJual', 0) for a in accounts)
        total_jual = sum(a.get('hargaJual', 0) for a in accounts if a.get('hargaJual', 0) > 0)
        
        return {
            "total_items": len(accounts),
            "ff_count": ff_count,
            "ml_count": ml_count,
            "ready_count": ready_count,
            "terjual_count": terjual_count,
            "cicilan_count": cicilan_count,
            "total_modal": total_modal,
            "total_target": total_target,
            "total_jual": total_jual,
            "potential_profit": total_target - total_modal,
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/games/{game}")
async def get_game_accounts(game: str):
    db = get_user_db()
    if not db:
        return {"items": [], "count": 0}
    
    try:
        user_doc = db.collection('users').document(USER_DOC_ID).get()
        accounts = user_doc.to_dict().get('accounts', [])
        
        if game.lower() == 'ff':
            filtered = [a for a in accounts if a.get('game') == 'Free Fire']
        else:
            filtered = [a for a in accounts if a.get('game') == 'Mobile Legends']
        
        return {"game": game, "items": filtered, "count": len(filtered)}
    except Exception as e:
        return {"items": [], "count": 0, "error": str(e)}

@router.get("/status/{status}")
async def get_status_accounts(status: str):
    db = get_user_db()
    if not db:
        return {"items": [], "count": 0}
    
    try:
        user_doc = db.collection('users').document(USER_DOC_ID).get()
        accounts = user_doc.to_dict().get('accounts', [])
        filtered = [a for a in accounts if a.get('status') == status]
        return {"status": status, "items": filtered, "count": len(filtered)}
    except Exception as e:
        return {"items": [], "count": 0, "error": str(e)}
