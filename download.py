

import instaloader
import os
import requests
from urllib.parse import urlparse
import sys
import json

def extract_shortcode(reel_url: str) -> str:
    path = urlparse(reel_url).path.strip("/")
    parts = [p for p in path.split("/") if p]
    if len(parts) >= 2 and parts[0] in {"reel", "p"}:
        return parts[1]
    return parts[-1] if parts else ""

def download_reel_with_audio(reel_url: str, download_dir: str = "downloads") -> dict:
    try:
        L = instaloader.Instaloader(
            download_videos=True,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            compress_json=False,
            max_connection_attempts=3,
        )

        shortcode = extract_shortcode(reel_url)
        post = instaloader.Post.from_shortcode(L.context, shortcode)

        video_url = post.video_url
        if not video_url and post.typename == "GraphSidecar":
            for node in post.get_sidecar_nodes():
                if node.is_video:
                    video_url = node.video_url
                    break

        if not video_url:
            raise Exception("No video URL found")

        # Get thumbnail URL
        thumbnail_url = post.url

        os.makedirs(download_dir, exist_ok=True)
        filepath = os.path.join(download_dir, f"reel_{shortcode}.mp4")

        # Download video
        r = requests.get(video_url, stream=True)
        with open(filepath, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)

        return {
            "filepath": filepath,
            "video_url": video_url,
            "thumbnail_url": thumbnail_url
        }

    except Exception as e:
        raise Exception(f"Download failed: {str(e)}")

if __name__ == "__main__":
    try:
        reel_url = sys.argv[1]
        result = download_reel_with_audio(reel_url)
        output = {"status": "success", "data": result}
    except Exception as e:
        output = {"status": "error", "message": str(e)}

    print(json.dumps(output, indent=4))
