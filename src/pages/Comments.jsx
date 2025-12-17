import { useState, useMemo, useEffect } from "react";
import NavBar from "../components/NavBar";
import { supabase } from "../supabaseClient"; // Adjust path to your supabase client
import "./Comments.css";
import { TranslatedText } from "../components/TranslatedText";

export default function Comments({ session, gameId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch comments when component mounts or gameId changes
  useEffect(() => {
    if (!gameId) return;
    fetchComments();
  }, [gameId]);

  async function fetchComments() {
    setLoading(true);
    const { data, error } = await supabase
      .from("game_comments")
      .select("id, comment_text, created_at, user_id")
      .eq("game_id", gameId)
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching comments:", error);
    else setComments(data || []);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newComment.trim() || !session) return;

    const { user } = session;
    const { error } = await supabase.from("game_comments").insert([
      {
        user_id: user.id,
        game_id: gameId,
        comment_text: newComment.trim(),
      },
    ]);

    if (error) {
      console.error("Error posting comment:", error);
    } else {
      setNewComment("");
      fetchComments(); // Refresh comments after posting
    }
  }

  return (
    <div className="comments-section">
      <h2>Comments</h2>

      {loading ? (
        <p>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p>No comments yet. Be the first to comment!</p>
      ) : (
        <ul>
          {comments.map((c) => (
            <li key={c.id}>
              <span className="comment-user">{c.user_id.slice(0, 8)}...</span>
              <span className="comment-text">{c.comment_text}</span>
              <small className="comment-date">
                {new Date(c.created_at).toLocaleString()}
              </small>
            </li>
          ))}
        </ul>
      )}

      {session && (
        <form onSubmit={handleSubmit} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
          ></textarea>
          <button type="submit" disabled={!newComment.trim()}>
            Post Comment
          </button>
        </form>
      )}
    </div>
  );
}
