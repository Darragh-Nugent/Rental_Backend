
export async function GetStates(db) {
    return await db.from("data").distinct("state").orderBy("state");
};

export async function GetPropertyTypes(db) {
    return await db.from("data").distinct("propertyType").orderBy("propertyType");
};

export async function GetProperty(db, propertyId) {
    return await db.from("data").select('*').where("id", "=", propertyId);
};

export async function SearchProperties(db, searchData) {
    return await db
        .from("data")
        .select("*")
        .where(searchData.searchConditions)
        .modify((queryBuilder) => {
            if (searchData.sortOption) {
                queryBuilder.orderBy(searchData.sortOption, searchData.sortDir);
            }
        }).limit(10)
        .offset((searchData.pageNum - 1) * 10);
};