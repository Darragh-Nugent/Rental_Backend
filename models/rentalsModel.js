import { count } from "node:console";

export async function GetStates(db) {
    return await db
    .from("data")
    .distinct("state")
    .orderBy("state");
};

export async function GetPropertyTypes(db) {
    return await db
    .from("data")
    .distinct("propertyType")
    .orderBy("propertyType");
};

export async function GetProperty(db, propertyId) {
    return await db
    .from("data")
    .select('*')
    .where("id", "=", propertyId);
};

export async function SearchProperties(db, searchData) {
    // Get first 10 properties
    const properties = await db
        .from("data")
        // Left join so properties without ratings are also retrieved
        .leftJoin("ratings", "ratings.propertyId", "=", "data.id") 
        .select("data.*")
        .avg("ratings.rating as averageRating")
        .count("ratings.rating as numRatings")
        .where(searchData.searchConditions)
        .modify((queryBuilder) => {
            // Add the set condtions for WHERE _ IN _
            searchData.setConditions.forEach(set => {
                queryBuilder.whereIn(set.field, set.set)
            });

            // Add the range conditions for WHERE _ BETWEEN _ AND _
            searchData.rangeConditions.forEach(range => {
                // Check for averageRating field as it must be in a HAVING statement
                if (range.field === "averageRating") {
                    queryBuilder.havingBetween(
                        "averageRating",
                        range.range
                    );
                } else {
                    queryBuilder.whereBetween(
                        range.field,
                        range.range
                    );
                }
            });

            // Sort
            if (searchData.sortOption) {
                queryBuilder.orderBy(searchData.sortOption, searchData.sortDir);
            }
        })
        // Choose what to group by for the averageRating count
        .groupBy("data.id")
        .limit(10)
        .offset((searchData.pageNum - 1) * 10);

    // Get the number of properties using the same search parameters
    const total = await db
        .from(function () {
            this.from("data")
                .leftJoin("ratings", "ratings.propertyId", "=", "data.id")
                .select("data.id")
                .avg("ratings.rating as averageRating")
                .where(searchData.searchConditions)
                .modify((queryBuilder) => {
                    searchData.setConditions.forEach(set => {
                        queryBuilder.whereIn(set.field, set.set)
                    });

                    searchData.rangeConditions.forEach(range => {
                        if (range.field === "averageRating") {
                            queryBuilder.havingBetween(
                                "averageRating",
                                range.range
                            );
                        } else {
                            queryBuilder.whereBetween(
                                range.field,
                                range.range
                            );
                        }
                    });
                })
                .groupBy("data.id")
                .as("subquery")
        })
        // Count the total rows
        .count("* as total")
        .first();

    return [properties, total.total];
}