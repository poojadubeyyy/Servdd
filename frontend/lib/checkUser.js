import { auth, currentUser } from "@clerk/nextjs/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

const normalizeStrapiUser = (entry) => {
  if (!entry) {
    return null;
  }

  const attrs = entry.attributes || {};
  return {
    id: entry.id,
    clerkId: attrs.clerkId,
    email: attrs.email,
    username: attrs.username,
    firstName: attrs.firstName,
    lastName: attrs.lastName,
    imageUrl: attrs.imageUrl,
    subscriptionTier: attrs.subscriptionTier || "free",
  };
};

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    console.error("❌ No Clerk user session found. Are cookies enabled?");
    return null;
  }

  if (!STRAPI_API_TOKEN) {
    console.error("❌ STRAPI_API_TOKEN is missing in environment");
    return null;
  }

  const { has } = await auth();
  const subscriptionTier = has({ plan: "pro" }) ? "pro" : "free";

  try {
    const existingUserResponse = await fetch(
      `${STRAPI_URL}/api/users?filters[clerkId][$eq]=${user.id}`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
        cache: "no-store",
      }
    );

    if (!existingUserResponse.ok) {
      const errorText = await existingUserResponse.text();
      console.error("❌ Strapi /api/users query failed:", errorText);
      return null;
    }

    const existingUserJson = await existingUserResponse.json();
    const existingUsers = existingUserJson.data || [];

    if (existingUsers.length > 0) {
      const existingUser = normalizeStrapiUser(existingUsers[0]);

      if (existingUser.subscriptionTier !== subscriptionTier) {
        await fetch(`${STRAPI_URL}/api/users/${existingUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          },
          body: JSON.stringify({ data: { subscriptionTier } }),
        });
      }

      return { ...existingUser, subscriptionTier };
    }

    // User doesn't exist in Strapi yet.
    // Since Clerk handles auth, we don't need to create auth users in Strapi.
    // Strapi is used as a CMS/database only for recipes, pantry items, etc.
    // Return Clerk user data with subscription tier.
    console.log("ℹ️ User not found in Strapi. Using Clerk user data.");

    return {
      id: null, // No Strapi ID yet
      clerkId: user.id,
      email: user.emailAddresses?.[0]?.emailAddress || "",
      username:
        user.username || user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
        `clerk-${user.id}`,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      imageUrl: user.imageUrl || "",
      subscriptionTier,
    };
  } catch (error) {
    console.error("❌ Error in checkUser:", error);
    return null;
  }
};
