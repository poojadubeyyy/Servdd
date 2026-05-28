"use server";

const MEALDB_BASE = "https://www.themealdb.com/api/json/v1/1";

function uniqueByName(items, key) {
  return Array.from(
    new Map((items || []).map((item) => [item[key], item])).values()
  );
}

// Get random recipe of the day
export async function getRecipeOfTheDay() {
  try {
    const response = await fetch(`${MEALDB_BASE}/random.php`, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      throw new Error("Failed to fetch recipe of the day");
    }

    const data = await response.json();
    return {
      success: true,
      recipe: data.meals[0],
    };
  } catch (error) {
    console.error("Error fetching recipe of the day:", error);
    throw new Error(error.message || "Failed to load recipe");
  }
}

// Get all categories
export async function getCategories() {
  try {
    const response = await fetch(`${MEALDB_BASE}/list.php?c=list`, {
      next: { revalidate: 604800 }, // Cache for 1 week (categories rarely change)
    });

    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }

    const data = await response.json();
    return {
      success: true,
      categories: data.meals || [],
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error(error.message || "Failed to load categories");
  }
}

// Get all areas/cuisines
export async function getAreas() {
  try {
    const response = await fetch(`${MEALDB_BASE}/list.php?a=list`, {
      next: { revalidate: 604800 }, // Cache for 1 week
    });

    if (!response.ok) {
      throw new Error("Failed to fetch areas");
    }

    const data = await response.json();
    const areas = uniqueByName(data.meals, "strArea");

    return {
      success: true,
      areas,
    };
  } catch (error) {
    console.error("Error fetching areas:", error);
    throw new Error(error.message || "Failed to load areas");
  }
}

// Get all areas/cuisines with one representative meal image for dashboard cards
export async function getAreasWithImages() {
  try {
    const areasData = await getAreas();
    const areas = areasData.areas || [];

    const areasWithImages = await Promise.all(
      areas.map(async (area) => {
        try {
          const response = await fetch(
            `${MEALDB_BASE}/filter.php?a=${encodeURIComponent(area.strArea)}`,
            {
              next: { revalidate: 604800 },
            }
          );

          if (!response.ok) {
            return null;
          }

          const data = await response.json();
          const previewMeal = data.meals?.[0];

          if (!previewMeal?.strMealThumb) {
            return null;
          }

          return {
            ...area,
            previewMeal: previewMeal?.strMeal,
            previewImage: previewMeal?.strMealThumb,
          };
        } catch {
          return null;
        }
      })
    );

    return {
      success: true,
      areas: areasWithImages.filter(Boolean),
    };
  } catch (error) {
    console.error("Error fetching areas with images:", error);
    throw new Error(error.message || "Failed to load cuisines");
  }
}

// Get meals by category
export async function getMealsByCategory(category) {
  try {
    const response = await fetch(
      `${MEALDB_BASE}/filter.php?c=${encodeURIComponent(category)}`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch meals");
    }

    const data = await response.json();
    return {
      success: true,
      meals: data.meals || [],
      category,
    };
  } catch (error) {
    console.error("Error fetching meals by category:", error);
    throw new Error(error.message || "Failed to load meals");
  }
}

// Get meals by area
export async function getMealsByArea(area) {
  try {
    const response = await fetch(
      `${MEALDB_BASE}/filter.php?a=${encodeURIComponent(area)}`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch meals");
    }

    const data = await response.json();
    return {
      success: true,
      meals: data.meals || [],
      area,
    };
  } catch (error) {
    console.error("Error fetching meals by area:", error);
    throw new Error(error.message || "Failed to load meals");
  }
}
