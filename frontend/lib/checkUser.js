import { auth, currentUser } from "@clerk/nextjs/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

async function fetchStrapiUserByClerkId(clerkId) {
  if (!STRAPI_API_TOKEN) return null;

  const response = await fetch(
    `${STRAPI_URL}/api/users?filters[clerkId][$eq]=${encodeURIComponent(clerkId)}`,
    {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    console.error("❌ Error fetching Strapi user by clerkId:", await response.text());
    return null;
  }

  const data = await response.json();
  return data?.[0] ?? null;
}

async function fetchStrapiUserByEmail(email) {
  if (!STRAPI_API_TOKEN) return null;

  const response = await fetch(
    `${STRAPI_URL}/api/users?filters[email][$eq]=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    console.error("❌ Error fetching Strapi user by email:", await response.text());
    return null;
  }

  const data = await response.json();
  return data?.[0] ?? null;
}

async function createStrapiUser(clerkUser, subscriptionTier) {
  const email = clerkUser.emailAddresses?.[0]?.emailAddress;
  const username =
    clerkUser.username ||
    email?.split("@")[0] ||
    `clerk-${clerkUser.id}`;

  if (email) {
    const existingUser = await fetchStrapiUserByEmail(email);
    if (existingUser) {
      console.log("⚠️ Existing Strapi user found by email before create:", {
        clerkId: clerkUser.id,
        email,
        existingUserId: existingUser.id,
      });
      return existingUser;
    }
  }

  const rolesResponse = await fetch(`${STRAPI_URL}/api/users-permissions/roles`, {
    headers: {
      Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    },
    cache: "no-store",
  });

  if (!rolesResponse.ok) {
    const errorText = await rolesResponse.text();
    throw new Error(`Failed to load Strapi roles: ${errorText}`);
  }

  const rolesData = await rolesResponse.json();
  const authenticatedRole = rolesData.roles.find((role) => role.type === "authenticated");

  if (!authenticatedRole) {
    throw new Error("Authenticated role not found in Strapi");
  }

  const userData = {
    username,
    email,
    password: `clerk_managed_${clerkUser.id}_${Date.now()}`,
    confirmed: true,
    blocked: false,
    role: authenticatedRole.id,
    clerkId: clerkUser.id,
    firstName: clerkUser.firstName || "",
    lastName: clerkUser.lastName || "",
    imageUrl: clerkUser.imageUrl || "",
    subscriptionTier,
  };

  const newUserResponse = await fetch(`${STRAPI_URL}/api/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    },
    body: JSON.stringify(userData),
  });

  if (!newUserResponse.ok) {
    const errorText = await newUserResponse.text();
    throw new Error(`Failed to create Strapi user: ${errorText}`);
  }

  const newUser = await newUserResponse.json();
  return newUser?.data ?? null;
}

async function updateStrapiUser(strapiId, updateData) {
  const response = await fetch(`${STRAPI_URL}/api/users/${strapiId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Error updating Strapi user:", errorText);
    return null;
  }

  const data = await response.json();
  return data?.data ?? null;
}

async function getOrCreateStrapiUser(clerkUser, subscriptionTier) {
  if (!STRAPI_API_TOKEN) return null;

  const email = clerkUser.emailAddresses?.[0]?.emailAddress;
  console.log("🔍 Searching Strapi user:", {
    clerkId: clerkUser.id,
    email,
  });

  let strapiUser = await fetchStrapiUserByClerkId(clerkUser.id);
  if (strapiUser) {
    console.log("📦 Found by clerkId:", strapiUser);
    if (
      strapiUser.attributes?.subscriptionTier !== subscriptionTier ||
      strapiUser.attributes?.clerkId !== clerkUser.id
    ) {
      const updated = await updateStrapiUser(strapiUser.id, {
        clerkId: clerkUser.id,
        subscriptionTier,
      });
      return updated ?? strapiUser;
    }

    return strapiUser;
  }

  if (email) {
    strapiUser = await fetchStrapiUserByEmail(email);
    if (strapiUser) {
      console.log("📦 Found by email:", strapiUser);
      const updated = await updateStrapiUser(strapiUser.id, {
        clerkId: clerkUser.id,
        subscriptionTier,
      });
      return updated ?? strapiUser;
    }
  }

  return await createStrapiUser(clerkUser, subscriptionTier);
}

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    console.error("No Clerk user session found");
    return null;
  }

  const { has } = await auth();
  const subscriptionTier = has({ plan: "pro" }) ? "pro" : "free";

  const baseUser = {
    id: user.id,
    clerkId: user.id,
    email: user.emailAddresses?.[0]?.emailAddress || "",
    username:
      user.username ||
      user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
      `clerk-${user.id}`,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    imageUrl: user.imageUrl || "",
    subscriptionTier,
    strapiId: null,
  };

  if (!STRAPI_API_TOKEN) {
    console.warn("⚠️ STRAPI_API_TOKEN not set. Skipping Strapi user sync.");
    return baseUser;
  }

  try {
    const strapiUser = await getOrCreateStrapiUser(user, subscriptionTier);

    console.log("USER DATA", {
      clerkId: user.id,
      strapiId: strapiUser?.id,
    });

    return {
      ...baseUser,
      strapiId: strapiUser?.id ?? null,
    };
  } catch (error) {
    console.error("❌ Error syncing user with Strapi:", error);
    return baseUser;
  }
};
