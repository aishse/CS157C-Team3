import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Bell, User, LogOut, Plus } from 'lucide-react';
import { useAuth } from '@/providers/AuthContext';
import { useApiClient } from '@/hooks/use-api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { ProfileResponse } from '@/lib/api';

interface DockUser {
  name: string;
  username: string;
  avatar: string;
}

/**
 * FloatingDock component for navigation on authenticated pages.
 * Requirements: 9.4
 */
export function FloatingDock() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const api = useApiClient();
  const [dockUser, setDockUser] = useState<DockUser | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      try {
        const profile = await api.get<ProfileResponse>(`/api/profile/${user.id}`);
        setDockUser({
          name: profile.name,
          username: profile.username,
          avatar: user.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        setDockUser({
          name: user.displayName || 'User',
          username: user.email?.split('@')[0] || 'user',
          avatar: user.profileImageUrl || '',
        });
      }
    }

    fetchProfile();
  }, [user, api]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user || !dockUser) return null;

  const links = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/explore', label: 'Explore', icon: Search },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: `/profile/${dockUser.username}`, label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 px-4 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                'p-3 rounded-full transition-all duration-300 hover:bg-white/10 relative group',
                isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {link.label}
              </span>
            </Link>
          );
        })}

        <div className="w-px h-8 bg-white/10 mx-2" />

        <Button
          size="icon"
          className="rounded-full bg-sky-500 hover:bg-sky-600 w-12 h-12 shadow-lg hover:scale-110 transition-transform"
        >
          <Plus className="w-6 h-6 text-white" />
        </Button>

        <div className="w-px h-8 bg-white/10 mx-2" />

        <div className="relative group">
          <Avatar className="w-10 h-10 border-2 border-white/10 cursor-pointer hover:border-white/30 transition-colors">
            <AvatarImage src={dockUser.avatar} />
            <AvatarFallback>{dockUser.name?.[0] || '?'}</AvatarFallback>
          </Avatar>

          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-12 left-1/2 -translate-x-1/2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default FloatingDock;
