"""
Neo4j service layer for user operations.

This service provides methods for interacting with the Neo4j database
for user-related operations including creation, retrieval, and validation.
"""

from typing import Optional

from neo4j import AsyncSession
from pydantic import BaseModel


class UserProfile(BaseModel):
    """User profile data model for Neo4j operations.
    Schema: bio, email, id, name, username
    """
    id: str
    name: str
    username: str
    email: str
    bio: str


class FeedPostAuthor(BaseModel):
    """Author information for a feed post."""
    id: str
    name: str
    username: str


class FeedPost(BaseModel):
    """Feed post data model for displaying posts from followed users.
    
    Contains post content and author information needed for feed display.
    """
    id: str
    content: str
    createdAt: str
    author: FeedPostAuthor


class Neo4jService:
    """
    Service class for Neo4j database operations.
    
    Provides methods for:
    - Creating users
    - Retrieving users by Clerk user ID
    - Checking username availability
    """
    
    def __init__(self, session: AsyncSession):
        """
        Initialize the Neo4j service with a database session.
        
        Args:
            session: An async Neo4j session for database operations.
        """
        self._session = session
    
    async def create_user(self, profile: UserProfile) -> None:
        """
        Create a new user node in Neo4j.
        
        Creates a User node with all profile fields. The username should
        be verified as available before calling this method.
        
        Args:
            profile: UserProfile containing all user data to store.
        """
        query = """
        CREATE (u:User {
            id: $id,
            name: $name,
            username: $username,
            email: $email,
            bio: $bio
        })
        """
        await self._session.run(
            query,
            id=profile.id,
            name=profile.name,
            username=profile.username,
            email=profile.email,
            bio=profile.bio
        )
    
    async def get_user_by_id(
        self, 
        user_id: str
    ) -> Optional[UserProfile]:
        """
        Retrieve a user profile from Neo4j by their ID.
        
        Args:
            user_id: The user identifier.
            
        Returns:
            UserProfile if found, None otherwise.
        """
        query = """
        MATCH (u:User {id: $user_id})
        RETURN u
        """
        result = await self._session.run(query, user_id=user_id)
        record = await result.single()
        
        if record is None:
            return None
        
        node = record["u"]
        return UserProfile(
            id=node["id"],
            name=node["name"],
            username=node["username"],
            email=node["email"],
            bio=node["bio"]
        )
    
    async def is_username_available(self, username: str) -> bool:
        """
        Check if a username is available (not already taken).
        
        Performs a case-insensitive check to ensure username uniqueness.
        
        Args:
            username: The username to check for availability.
            
        Returns:
            True if the username is available, False if already taken.
        """
        query = """
        MATCH (u:User)
        WHERE toLower(u.username) = toLower($username)
        RETURN count(u) as count
        """
        result = await self._session.run(query, username=username)
        record = await result.single()
        
        return record["count"] == 0

    async def get_feed_posts(self, user_id: str) -> list[FeedPost]:
        """
        Retrieve posts from users that the given user follows.
        
        Queries the Neo4j database for all posts created by users that
        the specified user follows, ordered by creation date descending.
        
        Args:
            user_id: The ID of the user whose feed to retrieve.
            
        Returns:
            List of FeedPost objects ordered by creation date (newest first).
        """
        query = """
        MATCH (me:User {id: $userId})-[:FOLLOWS]->(followed:User)-[:POSTED]->(post:Post)
        RETURN post, followed
        ORDER BY post.createdAt DESC
        """
        result = await self._session.run(query, userId=user_id)
        records = await result.data()
        
        feed_posts = []
        for record in records:
            post = record["post"]
            followed = record["followed"]
            feed_posts.append(FeedPost(
                id=post["id"],
                content=post["content"],
                createdAt=post["createdAt"],
                author=FeedPostAuthor(
                    id=followed["id"],
                    name=followed["name"],
                    username=followed["username"]
                )
            ))
        
        return feed_posts
