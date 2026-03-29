"""One-time migration: add EditorJS blocks to all existing posts."""
import os
import pymongo
from dotenv import load_dotenv

load_dotenv()

from parser.posts import voice_to_editorjs_blocks

db = pymongo.MongoClient(os.getenv("MONGO", ""))[os.getenv("DB_NAME", "")]
coll_posts = db[os.getenv("COLLECTION_POSTS", "posts")]

migrated = 0
cursor = coll_posts.find({"blocks": {"$exists": False}})

for post in cursor:
    d = post.get("d", {})
    blocks = voice_to_editorjs_blocks(d)
    coll_posts.update_one(
        {"_id": post["_id"]},
        {"$set": {"blocks": blocks, "source": "blockchain", "editable": False}},
    )
    migrated += 1
    if migrated % 100 == 0:
        print(f"Migrated {migrated} posts...")

print(f"Done. Migrated {migrated} posts total.")
