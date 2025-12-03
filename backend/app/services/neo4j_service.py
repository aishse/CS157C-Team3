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
    Schema: bio, email, id, name, username, avatar
    """
    id: str
    name: str
    username: str
    email: str
    bio: str = ""
    avatar: str = "avatar_1"


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
            bio: $bio,
            avatar: $avatar
        })
        """
        await self._session.run(
            query,
            id=profile.id,
            name=profile.name,
            username=profile.username,
            email=profile.email,
            bio=profile.bio,
            avatar=profile.avatar
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
            bio=node.get("bio", ""),
            avatar=node.get("avatar", "avatar_1")
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

    async def is_username_available_for_user(
        self,
        username: str,
        current_user_id: str
    ) -> bool:
        """
        Check if a username is available, excluding the current user.
        
        Allows a user to keep their own username during profile updates.
        Performs a case-insensitive check to ensure username uniqueness.
        
        Args:
            username: The username to check for availability.
            current_user_id: The ID of the user making the update.
            
        Returns:
            True if the username is available (or belongs to current user),
            False if already taken by another user.
            
        Requirements: 3.3, 3.4
        """
        query = """
        MATCH (u:User)
        WHERE toLower(u.username) = toLower($username)
          AND u.id <> $current_user_id
        RETURN count(u) as count
        """
        result = await self._session.run(
            query,
            username=username,
            current_user_id=current_user_id
        )
        record = await result.single()
        
        return record["count"] == 0

    async def update_user(
        self,
        user_id: str,
        name: str,
        username: str,
        bio: str,
        avatar: str
    ) -> UserProfile:
        """
        Update user profile in Neo4j.
        
        Updates the user's name, username, bio, and avatar fields.
        The username uniqueness should be verified before calling this method.
        
        Args:
            user_id: The user identifier.
            name: The new display name.
            username: The new username.
            bio: The new bio.
            avatar: The new avatar identifier.
            
        Returns:
            Updated UserProfile.
            
        Raises:
            ValueError: If user not found.
            
        Requirements: 2.3, 3.5, 4.3, 5.3
        """
        query = """
        MATCH (u:User {id: $user_id})
        SET u.name = $name,
            u.username = $username,
            u.bio = $bio,
            u.avatar = $avatar
        RETURN u
        """
        result = await self._session.run(
            query,
            user_id=user_id,
            name=name,
            username=username,
            bio=bio,
            avatar=avatar
        )
        record = await result.single()
        
        if record is None:
            raise ValueError("User not found")
        
        node = record["u"]
        return UserProfile(
            id=node["id"],
            name=node["name"],
            username=node["username"],
            email=node["email"],
            bio=node["bio"],
            avatar=node["avatar"]
        )

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
