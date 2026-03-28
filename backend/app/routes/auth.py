from fastapi import APIRouter, HTTPException, status, Depends
from app.models.user import UserCreate, UserLogin
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.database import get_database

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    db = get_database()
    
    existing_user = await db["users"].find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    hashed_password = get_password_hash(user_data.password)
    new_user = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": hashed_password,
        "profile_completed": False
    }
    
    result = await db["users"].insert_one(new_user)
    created_user = await db["users"].find_one({"_id": result.inserted_id})
    
    access_token = create_access_token(subject=str(created_user["_id"]))
    
    return {
        "status": "success",
        "data": {
            "email": created_user["email"],
            "full_name": created_user["full_name"],
            "profile_completed": created_user["profile_completed"]
        },
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/login")
async def login(user_data: UserLogin):
    db = get_database()
    
    email_clean = user_data.email.strip()
    print(f"DEBUG: Login attempt for email '{email_clean}'")
    
    user = await db["users"].find_one({"email": email_clean})
    if not user:
        print(f"DEBUG: User not found in MongoDB for email '{email_clean}'")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
        
    if not verify_password(user_data.password, user["hashed_password"]):
        print(f"DEBUG: Password verification failed for '{email_clean}' (wrong password)")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
        
    access_token = create_access_token(subject=str(user["_id"]))
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
