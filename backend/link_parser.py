import re
import requests

def extract_links(postText: str, device: str) -> list[str]:
    """
    Extracts links from a given post text.

    Args:
        postText (str): The text from which to extract links.

    Returns:
        list: A list of extracted links.
    """
    import re

    # Regular expression to match URLs
    url_pattern = r"https?://[^\s<>\"']+"
    all_links = re.findall(url_pattern, postText)
    match device:
        case "Mobile":
            bingo_links = [
                link for link in all_links
                if "playtika" in link
            ]
        case "Desktop":
            bingo_links = [
                link for link in all_links
                if "bingoblitz.com" in link
            ]
        case _:
            bingo_links = [
                link for link in all_links
                if "bingoblitz.com" in link
            ]
    # Filter out links that are not valid
    for link in bingo_links:
        if validate_links(link):
            continue
        else:
            bingo_links.remove(link)
    return bingo_links

def validate_links(link: str) -> bool:
    """
    Validates a link to ensure it is well-formed.

    Args:
        link (str): The link to validate.

    Returns:
        bool: True if the link is valid, False otherwise.
    """
    try:
        response = requests.head(link, allow_redirects=True, timeout=5)
        return response.status_code == 200
    except requests.RequestException as e:
        #log(f"❌ HEAD request failed for {link}: {e}")
        return False
