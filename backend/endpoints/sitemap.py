from fastapi import APIRouter
from helpers.mongo import get_saved_posts, get_voice_posts


router = APIRouter(
    prefix="/sitemap",
    tags=["Sitemaps"],
    responses={404: {"description": "Not found"}},
)


@router.get("/posts")
def show_posts_urls():
    baseUrl = "https://viz.cx"
    page = 0
    result = []
    while True:
        newPosts = get_saved_posts(page=page, limit=1000, isReplies=None)
        page += 1
        if not newPosts:
            break
        for post in newPosts:
            result.append(
                {
                    "loc": baseUrl + "/@{}/{}".format(post["author"], post["block"]),
                    "lastmod": post["timestamp"],
                    "priority": "0.8",
                    "changefreq": "weekly",
                }
            )
    return result
