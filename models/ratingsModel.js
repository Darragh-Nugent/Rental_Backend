export async function GetAllRatingsFromId(db, propertyId) {
    return await db
        .from("ratings")
        .select("rating")
        .where("propertyId", '=', propertyId);
};

export async function GetAllUserRatingsForProperty(db, userId, propertyId) {
    return await db
    .from("ratings")
    .select("*")
    .where("propertyId", "=", propertyId, "and", "userId", '=', userId);
}

export async function DeleteAllRatings(db) {
    return await db
    .from("ratings")
    .del();
}

export async function GetRatingsFromUserEmail(db, email, page) {
    return await db
    .from('ratings')
    .join('users', 'ratings.userId', '=', 'users.userId')
    .select("ratings.propertyId", "ratings.rating", "ratings.comment", "ratings.dateTime")
    .where("users.email", '=', email)
    .limit(20)
    .offset((page - 1) * 10);  
}

export async function GetNumRatingsFromEmail(db, email) {
    return await db
    .from('ratings')
    .join('users', 'ratings.userId', '=', 'users.userId')
    .where('users.email', '=', email)
    .count('ratings.propertyId as count')
    .first();
}

export async function GetRatingsFromUserIdAndPropertyId(db, userId, propertyId) {
    return await db
    .from("ratings")
    .select("*")
    .where('userId', '=', userId, 'and', 'propertyId', '=', propertyId);
}

export async function UpsertRating(db, rating) {
    return await db
    .from('ratings')   
    .insert(rating)
    .onConflict()
    .merge();
}