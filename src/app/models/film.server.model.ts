import {getPool} from "../../config/db";
import {ResultSetHeader} from "mysql2";
import Logger from "../../config/logger";

const getOneFilm = async (id : number) : Promise<Film[]> => {
    const conn = await getPool().getConnection();
    const query = 'select film.id as filmId, title, description, genre_id as genreId, director_id as directorId, first_name as directorFirstName, last_name as directorLastName, release_date as releaseDate, age_rating as ageRating, runtime,  cast(coalesce(reverse(round(reverse(avg(rating)),1)), 0) as float) rating, COUNT(rating) as numReviews from film join user on director_id = user.id left join film_review on film.id = film_id where film.id = ? group by film.id';
    const [ rows ] = await conn.query( query, [ id ] );
    await conn.release();
    return rows;
}

const getFilmById = async (id : number) : Promise<Film[]> => {
    const conn = await getPool().getConnection();
    const query = 'select id, title, description, release_date as releaseDate, image_filename as imageFilename, runtime, director_id as directorId, genre_id as genreId, age_rating as ageRating from film where id = ?';
    const [ rows ] = await conn.query( query, [ id ] );
    await conn.release();
    return rows;
}

const checkFilmTitle = async (title : string) : Promise<Film[]> => {
    const conn = await getPool().getConnection();
    const query = 'select * from film where title = ?';
    const [ rows ] = await conn.query( query, [ title ] );
    await conn.release();
    return rows;
}

const checkGenreExists = async (genreId : number) : Promise<Genre[]> => {
    const conn = await getPool().getConnection();
    const query = 'select * from genre where id = ?';
    const [ rows ] = await conn.query( query, [ genreId ] );
    await conn.release();
    return rows;
}

const addFilm = async (title : string, description : string, releaseDate : string, imageFilename : string, runtime : number, director : number, genre : number, ageRating : string ) : Promise<ResultSetHeader> => {
    const conn = await getPool().getConnection();
    const query = 'insert into film (title, description, release_date, image_filename, runtime, director_id, genre_id, age_rating) values (?, ?, ?, ?, ?, ?, ?, ?)';
    const [ rows ] = await conn.query( query, [ title, description, releaseDate, imageFilename, runtime, director, genre, ageRating ] );
    await conn.release();
    return rows;
}

const getReviewsById = async (filmId : number) : Promise<FilmReview[]> => {
    const conn = await getPool().getConnection();
    const query = 'select * from film_review where film_id = ?';
    const [ rows ] = await conn.query( query, [ filmId ] );
    await conn.release();
    return rows;
}

const updateFilm = async (filmId : number, title : string, description : string, releaseDate : string, imageFilename : string, runtime : number, genre : number, ageRating : string ) : Promise<Film[]> => {
    const conn = await getPool().getConnection();
    const query = 'update film set title = ?, description = ?, release_date = ?, image_filename = ?, runtime = ?, genre_id = ?, age_rating = ? where id = ?';
    await conn.query( query, [ title, description, releaseDate, imageFilename, runtime, genre, ageRating, filmId ] );
    const query2 = 'select * from film where id = ?';
    const [ rows ] = await conn.query( query2, [ filmId ]);
    await conn.release();
    return rows;
}

const getAllGenres = async () : Promise<Genre[]> => {
    const conn = await getPool().getConnection();
    const query = 'select id as genreId, name from genre';
    const [ rows ] = await conn.query( query );
    await conn.release();
    return rows;
}

const deleteFilm = async (filmId : number) : Promise<ResultSetHeader> => {
    const conn = await getPool().getConnection();
    const reviewQuery = 'delete from film_review where film_id = ?'
    const filmQuery = 'delete from film where id = ?';
    await conn.query( reviewQuery, [ filmId ] );
    const rows = conn.query( filmQuery, [ filmId ] );
    await conn.release();
    return rows;
}

const viewFilms = async (q : string, genreId : number[], ageRating : string[], directorId : number, reviewerId : number, sortBy : string) : Promise<SearchResult[]> => {
    const conn = await getPool().getConnection();
    const values: any[] = [];
    let searchString = 'select film.id as filmId, title, genre_id as genreId, director_id as directorId, first_name as directorFirstName, last_name as directorLastName, release_date as releaseDate, age_rating as ageRating, cast(coalesce(reverse(round(reverse(avg(rating)),2)), 0) as float) rating from film left join film_review on film.id = film_id join user on user.id = director_id where';
    if (q !== null) {
        searchString += ' (title like "%' + q + '%" or description like "%' + q + '%")'
    } else {
        searchString += ' (title like "%%" or description like "%%")'
    }
    if (genreId !== null) {
        searchString += ' and (genre_id = ?';
        values.push(genreId[0]);
        for (let i = 1; i < genreId.length; i++) {
            searchString += ' or genre_id = ?';
            values.push(genreId[i]);
        }
        searchString += ')';
    } else {
        searchString += ' and genre_id = genre_id'
    }
    if (ageRating !== null) {
        searchString += ' and (age_rating = ?';
        values.push(ageRating[0]);
        for (let i = 1; i < ageRating.length; i++) {
            searchString += ' or age_rating = ?';
            values.push(ageRating[i]);
        }
        searchString += ')';
    } else {
        searchString += ' and age_rating = age_rating'
    }
    if (directorId !== null) {
        searchString += ' and director_id = ?';
        values.push(directorId);
    } else {
        searchString += ' and director_id = director_id'
    }
    if (reviewerId !== null) {
        searchString += ' and film.id in (select film_id from film_review where user_id = ?)';
        values.push(reviewerId);
    } else {
        searchString += ' and film.id in (select film.id from film)';
    }
    searchString += ' group by film.id';
    if (sortBy === 'ALPHABETICAL_ASC') {
        searchString += ' order by title asc';
    } else if ( sortBy === 'ALPHABETICAL_DESC') {
        searchString += ' order by title desc';
    }
    if ( sortBy === 'RELEASED_ASC') {
        searchString += ' order by release_date asc';
    } else if ( sortBy === 'RELEASED_DESC') {
        searchString += ' order by release_date desc';
    }
    if ( sortBy === 'RATING_ASC') {
        searchString += ' order by rating asc';
    } else if ( sortBy === 'RATING_DESC') {
        searchString += ' order by rating desc';
    }
    searchString += ', film.id asc';
    const [ filteredFilms ] = await conn.query( searchString, values );
    await conn.release();
    return filteredFilms;
}



export { getOneFilm, getFilmById, checkFilmTitle, checkGenreExists, addFilm, getReviewsById, updateFilm, getAllGenres, deleteFilm, viewFilms }