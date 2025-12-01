import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { useAuth } from '@/providers/AuthContext';
import { useApiClient } from '@/hooks/use-api';
import { useAppStore } from '@/lib/store';
import { Post } from '@/components/feed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { ProfileResponse } from '@/lib/api';

interface ProfileUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  joinedDate?: string;
}

/**
 * ProfilePage component for displaying user profiles.
 * Requirements: 6.1, 6.3, 6.4, 6.5
 */
export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const api = useApiClient();
  const { posts } = useAppStore();
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from backend
  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const profile = await api.get<ProfileResponse>(`/api/profile/${user.id}`);
        setProfileUser({
          id: profile.id,
          name: profile.name,
          username: profile.username,
          avatar: user.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
          bio: profile.bio,
          joinedDate: 'recently',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback to auth user data if profile not found
        if (user) {
          setProfileUser({
            id: user.id,
            name: user.displayName || 'User',
            username: username || 'user',
            avatar: user.profileImageUrl || '',
            bio: '',
            joinedDate: 'recently',
          });
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user, username, api]);

  const isCurrentUser = profileUser?.username === username;
  const userPosts = posts.filter((post) => post.author.username === username);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!profileUser) return <div className="p-4">User not found</div>;

  return (
    <>
      <header className="sticky top-0 z-10 bg-black/20 backdrop-blur-md border-b border-white/10 px-4 py-1 flex items-center gap-6">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-white/10"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">{profileUser.name}</h1>
          <span className="text-sm text-white/50">{userPosts.length} posts</span>
        </div>
      </header>

      <div className="relative">
        <div className="h-48 bg-white/10" /> {/* Banner */}
        <div className="absolute -bottom-16 left-4">
          <Avatar className="w-32 h-32 border-4 border-black">
            <AvatarImage src={profileUser.avatar} />
            <AvatarFallback>{profileUser.name?.[0] || '?'}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="flex justify-end px-4 py-3">
        {isCurrentUser ? (
          <Button
            variant="outline"
            className="rounded-full font-bold border-white/30 hover:bg-white/10"
          >
            Edit profile
          </Button>
        ) : (
          <Button className="rounded-full font-bold bg-white text-black hover:bg-white/90">
            Follow
          </Button>
        )}
      </div>

      <div className="px-4 mt-4 flex flex-col gap-3">
        <div>
          <h2 className="text-xl font-bold">{profileUser.name}</h2>
          <span className="text-white/50">@{profileUser.username}</span>
        </div>

        {profileUser.bio && <p>{profileUser.bio}</p>}

        <div className="flex items-center gap-2 text-white/50 text-sm">
          <CalendarDays className="w-4 h-4" />
          <span>Joined {profileUser.joinedDate || 'recently'}</span>
        </div>

        <div className="flex gap-4 text-sm">
          <div className="hover:underline cursor-pointer">
            <span className="font-bold text-white">142</span>{' '}
            <span className="text-white/50">Following</span>
          </div>
          <div className="hover:underline cursor-pointer">
            <span className="font-bold text-white">3.5K</span>{' '}
            <span className="text-white/50">Followers</span>
          </div>
        </div>
      </div>

      <div className="flex border-b border-white/10 mt-4">
        <div className="flex-1 hover:bg-white/10 transition-colors cursor-pointer py-4 flex justify-center relative">
          <span className="font-bold">Posts</span>
          <div className="absolute bottom-0 w-14 h-1 bg-sky-500 rounded-full" />
        </div>
        <div className="flex-1 hover:bg-white/10 transition-colors cursor-pointer py-4 flex justify-center text-white/50">
          <span>Replies</span>
        </div>
        <div className="flex-1 hover:bg-white/10 transition-colors cursor-pointer py-4 flex justify-center text-white/50">
          <span>Highlights</span>
        </div>
        <div className="flex-1 hover:bg-white/10 transition-colors cursor-pointer py-4 flex justify-center text-white/50">
          <span>Media</span>
        </div>
        <div className="flex-1 hover:bg-white/10 transition-colors cursor-pointer py-4 flex justify-center text-white/50">
          <span>Likes</span>
        </div>
      </div>

      <div className="flex flex-col">
        {userPosts.map((post) => (
          <Post key={post.id} post={post} />
        ))}
      </div>
    </>
  );
}

export default ProfilePage;
