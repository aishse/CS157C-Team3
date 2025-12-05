import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllUsers, getFollowing, followUser, unfollowUser, searchUsers, getPopularUsers } from "@/lib/api";
import type { ProfileResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ExplorePage() {
  const [users, setUsers] = useState<ProfileResponse[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch popular users
        const popularUsers = await getPopularUsers();

        // Fetch list of users you're following
        const followingList = await getFollowing();

        setUsers(popularUsers);
        setFollowing(followingList.map((u) => u.id));
      } catch (err) {
        console.error("Failed to load explore data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    async function performSearch() {
      if (!searchTerm.trim()) {
        // If search is empty, load all users
        try {
          const popularUsers = await getPopularUsers();
          setUsers(popularUsers);
          setIsSearching(false);
        } catch (err) {
          console.error("Failed to load users:", err);
          setIsSearching(false);
        }
        return;
      }

      setIsSearching(true);
      try {
        const searchResults = await searchUsers(searchTerm);
        setUsers(searchResults);
      } catch (err) {
        console.error("Failed to search users:", err);
      } finally {
        setIsSearching(false);
      }
    }

    // Debounce search
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleFollow = async (targetId: string) => {
    try {
      await followUser(targetId);
      setFollowing([...following, targetId]);
  ;
    } catch (err) {
      console.error("Failed to follow user:", err);
    }
  };

  const handleUnfollow = async (targetId: string) => {
    try {
      await unfollowUser(targetId);
      setFollowing(following.filter((id) => id !== targetId));
     
    } catch (err) {
      console.error("Failed to unfollow user:", err);
    }
  };

  return (
    <div className="text-white space-y-4">
      <h1 className="text-2xl font-semibold mb-4">Explore Users</h1>

      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search users by name or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/50"
        />
      </div>

      {loading && (
        <p className="text-white/50 p-4">Loading users...</p>
      )}

      {!loading && isSearching && (
        <p className="text-white/50 p-4">Searching...</p>
      )}

      {!loading && !isSearching && users.length === 0 && (
        <p className="text-white/50 p-4">
          {searchTerm.trim() ? "No users found matching your search." : "No users found."}
        </p>
      )}
        {!loading && !isSearching && !searchTerm.trim() && users.length > 0 && (
        <h2 className="text-lg font-semibold mt-6">Popular Users</h2>
      )}
      {!loading && !isSearching && users.map((user) => (
        <div
          key={user.id}
          className="bg-white/10 p-4 rounded-xl flex items-center justify-between border border-white/10"
        >
          <Link to={`/profile/${user.username}`} className="flex-1">
            <p className="text-lg font-medium">{user.name}</p>
            <p className="text-white/50">@{user.username}</p>
            <p className="text-sm text-white/40 mt-1">{user.followers_count} followers</p>
          </Link>

          {following.includes(user.id) ? (
            <Button
              className="bg-red-500 hover:bg-red-600"
              onClick={() => handleUnfollow(user.id)}
            >
              Unfollow
            </Button>
          ) : (
            <Button
              className="bg-blue-500 hover:bg-blue-600"
              onClick={() => handleFollow(user.id)}
            >
              Follow
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

export default ExplorePage;
