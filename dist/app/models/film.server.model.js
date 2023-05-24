"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewFilms = exports.deleteFilm = exports.getAllGenres = exports.updateFilm = exports.getReviewsById = exports.addFilm = exports.checkGenreExists = exports.checkFilmTitle = exports.getFilmById = exports.getOneFilm = void 0;
const db_1 = require("../../config/db");
const getOneFilm = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select film.id as filmId, title, description, genre_id as genreId, director_id as directorId, first_name as directorFirstName, last_name as directorLastName, release_date as releaseDate, age_rating as ageRating, runtime,  cast(coalesce(reverse(round(reverse(avg(rating)),1)), 0) as float) rating, COUNT(rating) as numReviews from film join user on director_id = user.id left join film_review on film.id = film_id where film.id = ? group by film.id';
    const [rows] = yield conn.query(query, [id]);
    yield conn.release();
    return rows;
});
exports.getOneFilm = getOneFilm;
const getFilmById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select id, title, description, release_date as releaseDate, image_filename as imageFilename, runtime, director_id as directorId, genre_id as genreId, age_rating as ageRating from film where id = ?';
    const [rows] = yield conn.query(query, [id]);
    yield conn.release();
    return rows;
});
exports.getFilmById = getFilmById;
const checkFilmTitle = (title) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select * from film where title = ?';
    const [rows] = yield conn.query(query, [title]);
    yield conn.release();
    return rows;
});
exports.checkFilmTitle = checkFilmTitle;
const checkGenreExists = (genreId) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select * from genre where id = ?';
    const [rows] = yield conn.query(query, [genreId]);
    yield conn.release();
    return rows;
});
exports.checkGenreExists = checkGenreExists;
const addFilm = (title, description, releaseDate, imageFilename, runtime, director, genre, ageRating) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'insert into film (title, description, release_date, image_filename, runtime, director_id, genre_id, age_rating) values (?, ?, ?, ?, ?, ?, ?, ?)';
    const [rows] = yield conn.query(query, [title, description, releaseDate, imageFilename, runtime, director, genre, ageRating]);
    yield conn.release();
    return rows;
});
exports.addFilm = addFilm;
const getReviewsById = (filmId) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select * from film_review where film_id = ?';
    const [rows] = yield conn.query(query, [filmId]);
    yield conn.release();
    return rows;
});
exports.getReviewsById = getReviewsById;
const updateFilm = (filmId, title, description, releaseDate, imageFilename, runtime, genre, ageRating) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'update film set title = ?, description = ?, release_date = ?, image_filename = ?, runtime = ?, genre_id = ?, age_rating = ? where id = ?';
    yield conn.query(query, [title, description, releaseDate, imageFilename, runtime, genre, ageRating, filmId]);
    const query2 = 'select * from film where id = ?';
    const [rows] = yield conn.query(query2, [filmId]);
    yield conn.release();
    return rows;
});
exports.updateFilm = updateFilm;
const getAllGenres = () => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select id as genreId, name from genre';
    const [rows] = yield conn.query(query);
    yield conn.release();
    return rows;
});
exports.getAllGenres = getAllGenres;
const deleteFilm = (filmId) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const reviewQuery = 'delete from film_review where film_id = ?';
    const filmQuery = 'delete from film where id = ?';
    yield conn.query(reviewQuery, [filmId]);
    const rows = conn.query(filmQuery, [filmId]);
    yield conn.release();
    return rows;
});
exports.deleteFilm = deleteFilm;
const viewFilms = (q, genreId, ageRating, directorId, reviewerId, sortBy) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const values = [];
    let searchString = 'select film.id as filmId, title, genre_id as genreId, director_id as directorId, first_name as directorFirstName, last_name as directorLastName, release_date as releaseDate, age_rating as ageRating, cast(coalesce(reverse(round(reverse(avg(rating)),2)), 0) as float) rating from film left join film_review on film.id = film_id join user on user.id = director_id where';
    if (q !== null) {
        searchString += ' (title like "%' + q + '%" or description like "%' + q + '%")';
    }
    else {
        searchString += ' (title like "%%" or description like "%%")';
    }
    if (genreId !== null) {
        searchString += ' and (genre_id = ?';
        values.push(genreId[0]);
        for (let i = 1; i < genreId.length; i++) {
            searchString += ' or genre_id = ?';
            values.push(genreId[i]);
        }
        searchString += ')';
    }
    else {
        searchString += ' and genre_id = genre_id';
    }
    if (ageRating !== null) {
        searchString += ' and (age_rating = ?';
        values.push(ageRating[0]);
        for (let i = 1; i < ageRating.length; i++) {
            searchString += ' or age_rating = ?';
            values.push(ageRating[i]);
        }
        searchString += ')';
    }
    else {
        searchString += ' and age_rating = age_rating';
    }
    if (directorId !== null) {
        searchString += ' and director_id = ?';
        values.push(directorId);
    }
    else {
        searchString += ' and director_id = director_id';
    }
    if (reviewerId !== null) {
        searchString += ' and film.id in (select film_id from film_review where user_id = ?)';
        values.push(reviewerId);
    }
    else {
        searchString += ' and film.id in (select film.id from film)';
    }
    searchString += ' group by film.id';
    if (sortBy === 'ALPHABETICAL_ASC') {
        searchString += ' order by title asc';
    }
    else if (sortBy === 'ALPHABETICAL_DESC') {
        searchString += ' order by title desc';
    }
    if (sortBy === 'RELEASED_ASC') {
        searchString += ' order by release_date asc';
    }
    else if (sortBy === 'RELEASED_DESC') {
        searchString += ' order by release_date desc';
    }
    if (sortBy === 'RATING_ASC') {
        searchString += ' order by rating asc';
    }
    else if (sortBy === 'RATING_DESC') {
        searchString += ' order by rating desc';
    }
    searchString += ', film.id asc';
    const [filteredFilms] = yield conn.query(searchString, values);
    yield conn.release();
    return filteredFilms;
});
exports.viewFilms = viewFilms;
//# sourceMappingURL=film.server.model.js.map