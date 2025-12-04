import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllUsers, getFollowing, followUser, unfollowUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const USERS_PER_PAGE = 20;

export function ExplorePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const paginatedUsers = users.slice(startIndex, startIndex + USERS_PER_PAGE);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return <p className="text-white p-4">Loading users...</p>;
  }

  if (users.length === 0) {
    return <p className="text-white p-4">No users found.</p>;
  }

  return (
    <div className="text-white space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Explore Users</h1>
        <p className="text-white/50 text-sm">
          {users.length} users · Page {currentPage} of {totalPages}
        </p>
      </div>

      {paginatedUsers.map((user) => (
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-white/10 border-white/20 hover:bg-white/20"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // Show first, last, current, and pages around current
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 2
                );
              })
              .map((page, idx, arr) => {
                // Add ellipsis if there's a gap
                const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                return (
                  <span key={page} className="flex items-center">
                    {showEllipsisBefore && (
                      <span className="px-2 text-white/50">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page)}
                      className={
                        currentPage === page
                          ? "bg-blue-500 hover:bg-blue-600"
                          : "bg-white/10 border-white/20 hover:bg-white/20"
                      }
                    >
                      {page}
                    </Button>
                  </span>
                );
              })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="bg-white/10 border-white/20 hover:bg-white/20"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default ExplorePage;
