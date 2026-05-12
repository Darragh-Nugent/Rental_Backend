
export async function GetRatings(db, propertyId) {
    return await db
        .from("ratings")
        .select("rating")
        .where("propertyId", '=', propertyId);
};