import { count } from "node:console";

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
    const properties = await db
        .from("data")
        .leftJoin("ratings", "ratings.propertyId", "=", "data.id")
        .select("data.*")
        .avg("ratings.rating as averageRating")
        .count("ratings.rating as numRatings")
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

            if (searchData.sortOption) {
                queryBuilder.orderBy(searchData.sortOption, searchData.sortDir);
            }
        })
        .groupBy("data.id")
        .limit(10)
        .offset((searchData.pageNum - 1) * 10);

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
        .count("* as total")
        .first();

    return [properties, total.total];
}