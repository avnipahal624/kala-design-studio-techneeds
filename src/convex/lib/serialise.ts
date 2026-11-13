import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export function publicArtisan(profile: Doc<"artisanProfiles">) {
  const averageRating =
    profile.ratingCount > 0 ? Math.round((profile.ratingSum / profile.ratingCount) * 10) / 10 : null;
  return {
    id: profile.userId,
    displayName: profile.displayName,
    headline: profile.craftHeadline,
    city: profile.city,
    serviceRegion: profile.serviceRegion,
    state: profile.state ?? null,
    mode: profile.mode,
    yearsExperience: profile.yearsExperience,
    intro: profile.intro,
    languages: profile.languages,
    skills: [...profile.skills, ...(profile.customSkills ?? [])],
    products: profile.products,
    materials: profile.materials,
    minProjectValue: profile.minProjectValue,
    maxProjectValue: profile.maxProjectValue ?? null,
    availability: profile.availability,
    turnaroundDays: profile.turnaroundDays,
    shipsNationwide: profile.shipsNationwide,
    collaborates: profile.collaborates,
    verificationStatus: profile.verificationStatus,
    completedProjects: profile.completedProjects,
    averageRating,
    reviewCount: profile.ratingCount,
    sampleLabel: profile.sampleLabel ?? null,
  };
}

export async function portfolioWithUrls(ctx: Ctx, artisanId: Doc<"artisanProfiles">["userId"]) {
  const items = await ctx.db
    .query("portfolioItems")
    .withIndex("by_artisan_created", (q) => q.eq("artisanId", artisanId))
    .order("desc")
    .take(24);
  return await Promise.all(
    items.map(async (item) => ({
      ...item,
      url: item.image
        ? await ctx.storage.getUrl(item.image.storageId)
        : item.externalUrl ?? null,
    })),
  );
}
