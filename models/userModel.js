
export async function getUserFromEmail(db, email) {
    return await db.from("users").select("*").where("email", "=", email);
}

export async function registerUser(db, user) {
    const { email, hash } = user;
    return await db.from("users").insert({
        "email": email,
        "hash": hash
    });
}

export async function putUserProfile(db, userProfile) {
    const {email, firstName, lastName, dob, address} = userProfile;
    return await db
        .from("users")
        .update({
            firstName,
            lastName,
            dob,
            address
        })
        .where("email", "=", email);
}