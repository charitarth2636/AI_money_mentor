from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import os
import tempfile
from app.core.database import get_database
from app.core.security import get_current_user
from app.services.pdf_parser import extract_investments_from_pdf

router = APIRouter()

@router.post("/upload-statement")
async def upload_statement(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    db = get_database()
    
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    # Write incoming chunks to a temporarily isolated file resource
    fd, temp_path = tempfile.mkstemp(suffix=".pdf")
    with os.fdopen(fd, 'wb') as tmp:
         content = await file.read()
         tmp.write(content)
         
    try:
        investments = extract_investments_from_pdf(temp_path)
    except Exception as e:
        os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF contents: {str(e)}")
        
    os.remove(temp_path)
    
    if not investments:
        return {"status": "success", "message": "No specific active funds were matched inside the document logic.", "data": []}
        
    # Bind existing tracking investments onto their user ID document 
    await db["user_profiles"].update_one(
        {"user_id": user_id},
        {"$set": {"existing_investments": investments}},
        upsert=True
    )
    
    return {
        "status": "success",
        "data": investments,
        "message": f"Successfully parsed {len(investments)} line items from statement."
    }
