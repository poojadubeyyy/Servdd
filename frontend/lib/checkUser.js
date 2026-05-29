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

    const rolesResponse = await fetch(
      `${STRAPI_URL}/api/users-permissions/roles`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
        cache: "no-store",
      }
    );

    if (!rolesResponse.ok) {
      const errorText = await rolesResponse.text();
      console.error("❌ Strapi /api/users-permissions/roles failed:", errorText);
      return null;
    }

    const rolesData = await rolesResponse.json();
    const authenticatedRole = rolesData.roles?.find(
      (role) => role.type === "authenticated"
    );

    if (!authenticatedRole) {
      console.error("❌ Authenticated role not found");
      return null;
    }

    const userData = {
      username:
        user.username || user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
        `clerk-${user.id}`,
      email: user.emailAddresses?.[0]?.emailAddress || "",
      password: `clerk_managed_${user.id}_${Date.now()}`,
      confirmed: true,
      blocked: false,
      role: authenticatedRole.id,
      clerkId: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      imageUrl: user.imageUrl || "",
      subscriptionTier,
    };

    const newUserResponse = await fetch(`${STRAPI_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({ data: userData }),
    });

    if (!newUserResponse.ok) {
      const errorText = await newUserResponse.text();
      console.error("❌ Strapi user creation failed:", errorText);
      return null;
    }

    const newUserJson = await newUserResponse.json();
    const createdUser = normalizeStrapiUser(newUserJson.data);

    return createdUser;
  } catch (error) {
    console.error("❌ Error in checkUser:", error);
    return null;
  }
};
