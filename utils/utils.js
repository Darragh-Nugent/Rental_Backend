const calculateAverageRating = (ratings) => {
    return ratings.reduce((accumulator, current) => accumulator + current) / ratings.len;
};