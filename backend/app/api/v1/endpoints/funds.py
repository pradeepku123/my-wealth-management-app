from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.factsheet_analyzer import analyze_factsheet_pdf
from app.schemas.factsheet import FactSheetAnalysis
from app.schemas.response import APIResponse

router = APIRouter()

import logging

logger = logging.getLogger("uvicorn")

@router.post("/analyze/factsheet", response_model=APIResponse[FactSheetAnalysis])
async def analyze_factsheet(file: UploadFile = File(...)):
    logger.info(f"Received file upload: {file.filename}, content_type: {file.content_type}")
    
    if not file.filename.lower().endswith(".pdf"):
        logger.warning("File is not a PDF")
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        content = await file.read()
        logger.info(f"Read file content, size: {len(content)} bytes")
        
        analysis = analyze_factsheet_pdf(content)
        logger.info(f"Analysis complete for fund: {analysis.fund_name}")
        
        return APIResponse(
            success=True,
            data=analysis, 
            message="Fact sheet analyzed successfully"
        )
    except ValueError as ve:
        logger.error(f"Validation error analyzing factsheet: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error analyzing factsheet: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
