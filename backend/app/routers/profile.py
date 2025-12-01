"""
Profile API endpoint.

Handles user profile retrieval.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_neo4j_service, get_current_user, ClerkUser
from app.models.user import ProfileResponse
from app.models.responses import ErrorResponse
from app.services.neo4j_service import Neo4jService


router = APIRouter(prefix="/api", tags=["profile"])


@router.get(
    "/profile/{user_id}",
    response_model=ProfileResponse,
    responses={
        404: {"model": ErrorResponse, "description": "Profile not found"},
        500: {"model": ErrorResponse, "description": "Server error"},
    },
)
async def get_profile(
    user_id: str,
    neo4j_service: Annotated[Neo4jService, Depends(get_neo4j_service)],
) -> ProfileResponse:
    """
    Get a user profile by user ID.
    
    Queries Neo4j for the user profile and returns it if found.
    """
    try:
        profile = await neo4j_service.get_user_by_id(user_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve profile"
        )
    
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return ProfileResponse(
        id=profile.id,
        name=profile.name,
        username=profile.username,
        email=profile.email,
        bio=profile.bio
    )
