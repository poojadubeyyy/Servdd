import { auth, currentUser } from "@clerk/nextjs/server";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    console.error("No Clerk user session found");
    return null;
  }

  const { has } = await auth();
  const subscriptionTier = has({ plan: "pro" }) ? "pro" : "free";

  return {
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
  };
};
