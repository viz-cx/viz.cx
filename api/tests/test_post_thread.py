"""Tests for the BFS comment thread builder (replaces recursive N+1)."""
from helpers import mongo
from helpers.db_client import get_db


def _insert_post(author: str, block: int, reply_to: str | None = None):
    doc = {
        "author": author,
        "block": block,
        "d": {"t": f"post {block}"},
        "comments": 0,
    }
    if reply_to:
        doc["d"]["r"] = reply_to
    coll_posts = get_db()["posts"]
    coll_posts.insert_one(doc)


def test_get_post_thread_nests_replies():
    _insert_post("alice", 100)
    _insert_post("bob", 101, reply_to="viz://@alice/100")
    _insert_post("carol", 102, reply_to="viz://@alice/100")
    _insert_post("dave", 103, reply_to="viz://@bob/101")
    _insert_post("eve", 104, reply_to="viz://@dave/103")

    tree = mongo.get_post_thread("alice", 100)
    assert {n["author"] for n in tree} == {"bob", "carol"}

    bob_node = next(n for n in tree if n["author"] == "bob")
    assert {r["author"] for r in bob_node["replies"]} == {"dave"}

    dave_node = bob_node["replies"][0]
    assert {r["author"] for r in dave_node["replies"]} == {"eve"}


def test_get_post_thread_handles_no_replies():
    _insert_post("alice", 200)
    assert mongo.get_post_thread("alice", 200) == []


def test_get_post_thread_query_count_is_one_per_level(monkeypatch):
    _insert_post("a", 1)
    _insert_post("b", 2, reply_to="viz://@a/1")
    _insert_post("c", 3, reply_to="viz://@a/1")
    _insert_post("d", 4, reply_to="viz://@b/2")
    _insert_post("e", 5, reply_to="viz://@c/3")

    db = get_db()
    coll_posts = db["posts"]
    original_find = coll_posts.find
    call_count = [0]

    def counting_find(*args, **kwargs):
        call_count[0] += 1
        return original_find(*args, **kwargs)

    monkeypatch.setattr(coll_posts, "find", counting_find)
    monkeypatch.setattr(
        mongo, "coll_posts", coll_posts, raising=False
    )

    tree = mongo.get_post_thread("a", 1)
    assert len(tree) == 2
    # Three levels (root → b/c → d/e), should be ~3 queries, not 5+ (one per node).
    assert call_count[0] <= 4, f"expected ≤4 queries, got {call_count[0]}"
