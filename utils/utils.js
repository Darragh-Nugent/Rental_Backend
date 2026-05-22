export const calculateAverageRating = (ratings) => {
    return ratings.reduce((accumulator, current) => accumulator + current) / ratings.length;
};

export const errorResponse = (message) => {
    return {
        error: true,
        message: message
    };
}