
export async function GetStates(db) {
    return await db.from("data").distinct("state").orderBy("state");
};

export async function GetPropertyTypes(db) {
    return await db.from("data").distinct("propertyType").orderBy("propertyType");
};

export async function GetProperty(db, propertyId) {
    return await db.from("data").select('*').where("id", "=", propertyId);
};

export async function GetRentalCount(db) {
    return await db.from("data").count("id as count");
}

export async function SearchProperties(db, searchData) {
    console.log(searchData.rangeConditions);
    return await db
        .from("data")
        .select("*")
        .count("id as total")
        .where(searchData.searchConditions)
        .modify((queryBuilder) => {
            console.log(searchData.rangeConditions);
            searchData.rangeConditions.forEach(range => {
                console.log(range);
                queryBuilder.whereBetween(range.field, range.range);
            });
            if (searchData.sortOption) {
                queryBuilder.orderBy(searchData.sortOption, searchData.sortDir);
            }
        }).limit(10)
        .offset((searchData.pageNum - 1) * 10);
};