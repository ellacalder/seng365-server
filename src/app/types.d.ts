type User = {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    imageFilename: string;
    currentPassword: string;
    password: string;
    auth_token: string;
}

type Film = {
    id: number;
    title: string;
    description: string;
    genreId: number;
    releaseDate: string;
    imageFilename: string;
    directorId: number;
    directorFirstName: number;
    directorLastName: number;
    ageRating: number;
    runtime: number;
    numReviews: number;
}

type SearchResult = {
    filmId: number;
    title: string;
    genreId: number;
    directorId: number;
    directorFirstName: number;
    directorLastName: number;
    releaseDate: string;
    ageRating: number;
    rating: number;
}

type Genre = {
    genreId: number;
    name: string;
}

type FilmReview = {
    id: number;
    film_id: number;
    user_id: number;
    rating: number;
    review: string;
    timestamp: string;
}