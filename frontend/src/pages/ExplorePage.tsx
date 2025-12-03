import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllUsers, getFollowing, followUser, unfollowUser } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function ExplorePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch all users except yourself
        const allUsers = await getAllUsers();

        // Fetch list of users you're following
        const followingList = await getFollowing();

        setUsers(allUsers);
        setFollowing(followingList.map((u) => u.id));
      } catch (err) {
        console.error("Failed to load explore data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleFollow = async (targetId: string) => {
    await followUser(targetId);
    setFollowing([...following, targetId]);
  };

  const handleUnfollow = async (targetId: string) => {
    await unfollowUser(targetId);
    setFollowing(following.filter((id) => id !== targetId));
  };

  if (loading) {
    return <p className="text-white p-4">Loading users...</p>;
  }

  if (users.length === 0) {
    return <p className="text-white p-4">No users found.</p>;
  }

  return (
    <div className="text-white space-y-4">
      <h1 className="text-2xl font-semibold mb-4">Explore Users</h1>

      {users.map((user) => (
        <div
          key={user.id}
          className="bg-white/10 p-4 rounded-xl flex items-center justify-between border border-white/10"
        >
          <Link to={`/profile/${user.username}`} className="flex-1">
            <p className="text-lg font-medium">{user.name}</p>
            <p className="text-white/50">@{user.username}</p>
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
