const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_BASE = "https://api.apify.com/v2";

export interface ApifyInstagramPost {
  id: string;
  shortCode: string;
  caption: string;
  commentsCount: number;
  likesCount: number;
  timestamp: string;
  type: string;
  url: string;
  displayUrl: string;
  videoViewCount?: number;
  hashtags: string[];
  ownerUsername: string;
}

export interface ApifyInstagramProfile {
  username: string;
  fullName: string;
  biography: string;
  followersCount: number;
  followsCount: number;
  postsCount: number;
  profilePicUrl: string;
  isVerified: boolean;
}

export async function scrapeInstagramPosts(
  handle: string,
  limit: number = 30
): Promise<{
  profile: ApifyInstagramProfile | null;
  posts: ApifyInstagramPost[];
}> {
  if (!APIFY_TOKEN) {
    throw new Error("APIFY_API_TOKEN not configured");
  }

  const cleanHandle = handle.replace("@", "").trim();

  const response = await fetch(
    `${APIFY_BASE}/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        directUrls: [`https://www.instagram.com/${cleanHandle}/`],
        resultsLimit: limit,
        resultsType: "posts",
        addParentData: true,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Apify error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  if (!data || !Array.isArray(data) || data.length === 0) {
    throw new Error(`No se encontraron posts para @${cleanHandle}`);
  }

  const firstPost = data[0];
  const profile: ApifyInstagramProfile | null = firstPost
    ? {
        username: cleanHandle,
        fullName: firstPost.ownerFullName || cleanHandle,
        biography: firstPost.ownerBiography || "",
        followersCount: firstPost.ownerFollowersCount || 0,
        followsCount: firstPost.ownerFollowsCount || 0,
        postsCount: firstPost.ownerPostsCount || 0,
        profilePicUrl: firstPost.ownerProfilePicUrl || "",
        isVerified: firstPost.ownerIsVerified || false,
      }
    : null;

  const posts: ApifyInstagramPost[] = data.map(
    (item: Record<string, unknown>) => ({
      id: (item.id as string) || (item.shortCode as string) || "",
      shortCode: (item.shortCode as string) || "",
      caption: (item.caption as string) || "",
      commentsCount: (item.commentsCount as number) || 0,
      likesCount: (item.likesCount as number) || 0,
      timestamp:
        (item.timestamp as string) ||
        (item.takenAtTimestamp as string) ||
        new Date().toISOString(),
      type: (item.type as string) || "Image",
      url:
        (item.url as string) ||
        `https://www.instagram.com/p/${item.shortCode}/`,
      displayUrl: (item.displayUrl as string) || "",
      videoViewCount: (item.videoViewCount as number) || 0,
      hashtags: (item.hashtags as string[]) || [],
      ownerUsername: cleanHandle,
    })
  );

  return { profile, posts };
}
