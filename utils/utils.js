const calculateAverageRating = (ratings) => {
    return ratings.reduce((accumulator, current) => accumulator + current) / ratings.len;
};

export const errorResponse = (message) => {
    return {
        error: true,
        message: message
    };
}