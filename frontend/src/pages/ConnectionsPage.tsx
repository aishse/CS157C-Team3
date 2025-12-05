import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFollowers, getFollowing, getSuggestedUsers } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function ConnectionsPage() {
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConnections() {
      try {
        const f1 = await getFollowers();
        const f2 = await getFollowing();
        const s = await getSuggestedUsers();

        setFollowers(f1);
        setFollowing(f2);
        setSuggestions(s);
      } catch (err) {
        console.error("Failed to load connections:", err);
      } finally {
        setLoading(false);
      }
    }

    loadConnections();
  }, []);

  if (loading) {
    return <p className="text-white p-4">Loading connections...</p>;
  }

  return (
    <div className="text-white space-y-6">
      <h1 className="text-2xl font-semibold">Connections</h1>

      {/* Following Section */}
      <section>
        <h2 className="text-xl font-semibold mb-2">You Follow</h2>

        {following.length === 0 ? (
          <p className="text-white/60">You're not following anyone.</p>
        ) : (
          <div className="space-y-3">
            {following.map((u) => (
              <div
                key={u.id}
                className="bg-white/10 p-4 rounded-xl flex items-center justify-between border border-white/10"
              >
                <Link to={`/profile/${u.username}`} className="flex-1">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-white/50 text-sm">@{u.username}</p>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Followers Section */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Followers</h2>

        {followers.length === 0 ? (
          <p className="text-white/60">You don't have any followers yet.</p>
        ) : (
          <div className="space-y-3">
            {followers.map((u) => (
              <div
                key={u.id}
                className="bg-white/10 p-4 rounded-xl flex items-center justify-between border border-white/10"
              >
                <Link to={`/profile/${u.username}`} className="flex-1">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-white/50 text-sm">@{u.username}</p>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
      {/* Suggested Accounts Section */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Suggested Accounts</h2>
        {/* Add suggested accounts content here */}
        {suggestions.length === 0 ? (
          <p className="text-white/60">No suggestions available. Try following more people! </p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((u) => (
              <div
                key={u.id}
                className="bg-white/10 p-4 rounded-xl flex items-center justify-between border border-white/10"
              >
                <Link to={`/profile/${u.username}`} className="flex-1">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-white/50 text-sm">@{u.username}</p>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ConnectionsPage;
