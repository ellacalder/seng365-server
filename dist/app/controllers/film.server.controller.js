"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGenres = exports.deleteOne = exports.editOne = exports.addOne = exports.getOne = exports.viewAll = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const films = __importStar(require("../models/film.server.model"));
const validator_1 = require("../resources/validator");
const schemas = __importStar(require("../resources/schemas.json"));
const users = __importStar(require("../models/user.server.model"));
const viewAll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let startIndex;
    let count;
    let q;
    let genreIds = [];
    let ageRatings;
    let directorId;
    let reviewerId;
    let sortBy;
    // Get URL params
    const url = new URL(req.url, 'http://localhost/api/v1/films');
    const urlParams = url.searchParams;
    // Check start index
    if (urlParams.has('startIndex')) {
        if (isNaN(parseInt(urlParams.get('startIndex'), 10))) {
            res.statusMessage = "Bad Request: Start index is not a number";
            res.status(400).send();
            return;
        }
        startIndex = parseInt(urlParams.get('startIndex'), 10);
    }
    else {
        startIndex = 0;
    }
    // Check count
    if (urlParams.has('count')) {
        if (isNaN(parseInt(urlParams.get('count'), 10))) {
            res.statusMessage = "Bad Request: Count is not a number";
            res.status(400).send();
            return;
        }
        count = parseInt(urlParams.get('count'), 10);
    }
    else {
        count = null;
    }
    // Check query
    if (urlParams.has('q')) {
        q = urlParams.get('q');
    }
    else {
        q = null;
    }
    // Check genres
    if (urlParams.has('genreIds')) {
        const genresAsStrings = urlParams.getAll('genreIds');
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < genresAsStrings.length; i++) {
            if (isNaN(parseInt(genresAsStrings[i], 10))) {
                res.statusMessage = "Bad Request: Genre ID is not a number";
                res.status(400).send();
                return;
            }
        }
        // tslint:disable-next-line:prefer-for-of
        for (let x = 0; x < genresAsStrings.length; x++) {
            try {
                const genres = yield films.checkGenreExists(parseInt((genresAsStrings[x]), 10));
                if (genres.length === 0) {
                    res.statusMessage = "Bad Request: Genre is invalid";
                    res.status(400).send();
                    return;
                }
                genreIds.push(parseInt((genresAsStrings[x]), 10));
            }
            catch (_a) {
                res.statusMessage = "Internal Server Error";
                res.status(500).send();
                return;
            }
        }
    }
    else {
        genreIds = null;
    }
    // Check age ratings
    const validAgeRatings = ['G', 'PG', 'M', 'R13', 'R16', 'R18', 'TBC'];
    if (urlParams.has('ageRatings')) {
        ageRatings = urlParams.getAll('ageRatings');
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < ageRatings.length; i++) {
            if (validAgeRatings.indexOf(ageRatings[i]) === -1) {
                res.statusMessage = "Bad Request: Invalid age rating";
                res.status(400).send();
                return;
            }
        }
    }
    else {
        ageRatings = null;
    }
    // Check director id
    if (urlParams.has('directorId')) {
        if (isNaN(parseInt(urlParams.get('directorId'), 10))) {
            res.statusMessage = "Bad Request: Director ID is not a number";
            res.status(400).send();
            return;
        }
        directorId = parseInt(urlParams.get('directorId'), 10);
    }
    else {
        directorId = null;
    }
    // Check reviewer id
    if (urlParams.has('reviewerId')) {
        if (isNaN(parseInt(urlParams.get('reviewerId'), 10))) {
            res.statusMessage = "Bad Request: Reviewer ID is not a number";
            res.status(400).send();
            return;
        }
        reviewerId = parseInt(urlParams.get('reviewerId'), 10);
    }
    else {
        reviewerId = null;
    }
    // Check sort by
    if (urlParams.has('sortBy')) {
        sortBy = urlParams.get('sortBy');
    }
    else {
        sortBy = 'RELEASED_ASC';
    }
    try {
        const filteredFilms = yield films.viewFilms(q, genreIds, ageRatings, directorId, reviewerId, sortBy);
        res.statusMessage = "OK: Filtered list of films successfully retrieved";
        if (count === null) {
            res.status(200).json({
                films: filteredFilms.slice(startIndex),
                count: filteredFilms.length
            });
        }
        else {
            res.status(200).json({
                films: filteredFilms.slice(startIndex, startIndex + count),
                count: filteredFilms.length
            });
        }
        return;
    }
    catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.viewAll = viewAll;
const getOne = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    try {
        const checkFilmExists = yield films.getFilmById(parseInt(id, 10));
        if (checkFilmExists.length === 0) {
            res.statusMessage = "Not Found: No film exists with that ID";
            res.status(404).send();
            return;
        }
        else {
            const film = yield films.getOneFilm(parseInt(id, 10));
            res.statusMessage = "OK: Film information successfully retrieved";
            res.status(200).send(film[0]);
            return;
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getOne = getOne;
const addOne = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate film entries
    const validation = yield (0, validator_1.validate)(schemas.film_post, req.body);
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }
    const title = req.body.title;
    const genreId = parseInt(req.body.genreId, 10);
    const description = req.body.description;
    // Check the film title is unique
    try {
        const titles = yield films.checkFilmTitle(title);
        if (titles.length !== 0) {
            res.statusMessage = "Forbidden: Film title is not unique";
            res.status(403).send();
            return;
        }
    }
    catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
    // Check the genre does exist
    try {
        const genre = yield films.checkGenreExists(genreId);
        if (genre.length === 0) {
            res.statusMessage = "Forbidden: Genre does not exist";
            res.status(403).send();
            return;
        }
    }
    catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
    // Check release date
    let releaseDate;
    const now = new Date();
    if (req.body.hasOwnProperty("releaseDate")) {
        const dateCheck = new Date(req.body.releaseDate);
        if (dateCheck < now) {
            res.statusMessage = "Forbidden: Cannot release a film in the past";
            res.status(403).send();
            return;
        }
        releaseDate = req.body.releaseDate;
    }
    else {
        releaseDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
    let imageFilename;
    if (req.body.hasOwnProperty("imageFilename")) {
        imageFilename = req.body.imageFilename;
    }
    else {
        imageFilename = null;
    }
    let ageRating;
    if (req.body.hasOwnProperty("ageRating")) {
        ageRating = req.body.ageRating;
    }
    else {
        ageRating = "TBC";
    }
    let runtime;
    if (req.body.hasOwnProperty("runtime")) {
        runtime = parseInt(req.body.runtime, 10);
    }
    else {
        runtime = null;
    }
    // Check that there is someone to be the director
    let director;
    if (req.header('X-Authorization') !== undefined) {
        const authToken = req.header('X-Authorization');
        try {
            director = yield users.findUserByToken(authToken);
        }
        catch (err) {
            logger_1.default.error(err);
            res.status(500).send(`ERROR reading user: ${err}`);
            return;
        }
    }
    else {
        res.statusMessage = 'Unauthorised: No auth token';
        res.status(401).send();
        return;
    }
    try {
        const film = yield films.addFilm(title, description, releaseDate, imageFilename, runtime, director[0].id, genreId, ageRating);
        res.statusMessage = "Created: Film successfully added to database";
        res.status(201).json({
            filmId: film.insertId,
        });
        return;
    }
    catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.addOne = addOne;
const editOne = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate film entries
    const validation = yield (0, validator_1.validate)(schemas.film_patch, req.body);
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }
    // Check ID is a number
    const id = req.params.id;
    if (isNaN(parseInt(id, 10))) {
        res.statusMessage = "Bad Request: ID is not a number";
        res.status(400).send();
        return;
    }
    // Check film exists
    let film;
    try {
        film = yield films.getFilmById(parseInt(id, 10));
        if (film.length === 0) {
            res.statusMessage = "Not Found: No film with specified ID";
            res.status(404).send();
            return;
        }
    }
    catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
    // Check logged-in user is the director of the film
    let user;
    if (req.header('X-Authorization') !== undefined) {
        const authToken = req.header('X-Authorization');
        try {
            user = yield users.findUserByToken(authToken);
            if (user.length === 0 || user[0].id !== film[0].directorId) {
                res.statusMessage = 'Forbidden: Only the director may delete this film';
                res.status(401).send();
                return;
            }
        }
        catch (err) {
            logger_1.default.error(err);
            res.status(500).send(`ERROR reading user: ${err}`);
            return;
        }
    }
    else {
        res.statusMessage = 'Unauthorised: No auth token';
        res.status(401).send();
        return;
    }
    let releaseDate;
    const now = new Date();
    if (req.body.hasOwnProperty("releaseDate")) {
        const dateCheck = new Date(req.body.releaseDate);
        if (dateCheck < now) {
            res.statusMessage = "Forbidden: Cannot release a film in the past";
            res.status(403).send();
            return;
        }
        if (new Date(film[0].releaseDate) < now) {
            res.statusMessage = "Forbidden: Cannot change the release date of a film that has already been released";
            res.status(403).send();
            return;
        }
        releaseDate = req.body.releaseDate;
    }
    else {
        releaseDate = film[0].releaseDate;
    }
    // Check the genre does exist if the director is updating it
    let genreId;
    if (req.body.hasOwnProperty("genreId")) {
        genreId = req.body.genreId;
        try {
            const genre = yield films.checkGenreExists(genreId);
            if (genre.length === 0) {
                res.statusMessage = "Forbidden: Genre does not exist";
                res.status(403).send();
                return;
            }
        }
        catch (err) {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }
    }
    else {
        genreId = film[0].genreId;
    }
    // Check the film title is unique
    let title;
    if (req.body.hasOwnProperty("title")) {
        title = req.body.title;
        try {
            const titles = yield films.checkFilmTitle(title);
            if (titles.length !== 0) {
                res.statusMessage = "Forbidden: Film title is not unique";
                res.status(403).send();
                return;
            }
        }
        catch (err) {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }
    }
    else {
        title = film[0].title;
    }
    // Check film has not already been reviewed
    try {
        const reviews = yield films.getReviewsById(parseInt(id, 10));
        if (reviews.length !== 0) {
            res.statusMessage = "Forbidden: Film cannot be edited when it has already been reviewed";
            res.status(403).send();
            return;
        }
    }
    catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
    let imageFilename;
    if (req.body.hasOwnProperty("imageFilename")) {
        imageFilename = req.body.imageFilename;
    }
    else {
        imageFilename = film[0].imageFilename;
    }
    let ageRating;
    if (req.body.hasOwnProperty("ageRating")) {
        ageRating = req.body.ageRating;
    }
    else {
        ageRating = film[0].ageRating;
    }
    let runtime;
    if (req.body.hasOwnProperty("runtime")) {
        runtime = parseInt(req.body.runtime, 10);
    }
    else {
        runtime = film[0].runtime;
    }
    let description;
    if (req.body.hasOwnProperty("description")) {
        description = req.body.description;
    }
    else {
        description = film[0].description;
    }
    try {
        const updatedFilm = yield films.updateFilm(film[0].id, title, description, releaseDate, imageFilename, runtime, genreId, ageRating);
        res.statusMessage = "OK: Film successfully updated";
        res.status(200).send(updatedFilm[0]);
        return;
    }
    catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.editOne = editOne;
const deleteOne = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Check ID is a number
    const id = req.params.id;
    if (isNaN(parseInt(id, 10))) {
        res.statusMessage = "Bad Request: ID is not a number";
        res.status(400).send();
        return;
    }
    // Check film exists
    let film;
    try {
        film = yield films.getFilmById(parseInt(id, 10));
        if (film.length === 0) {
            res.statusMessage = "Not Found: No film with specified ID";
            res.status(404).send();
            return;
        }
    }
    catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
    // Check logged-in user is the director of the film
    let user;
    if (req.header('X-Authorization') !== undefined) {
        const authToken = req.header('X-Authorization');
        try {
            user = yield users.findUserByToken(authToken);
            if (user.length === 0 || user[0].id !== film[0].directorId) {
                res.statusMessage = 'Forbidden: Only the director may delete this film';
                res.status(403).send();
                return;
            }
        }
        catch (err) {
            logger_1.default.error(err);
            res.status(500).send(`ERROR reading user: ${err}`);
            return;
        }
    }
    else {
        res.statusMessage = 'Unauthorised: No auth token';
        res.status(401).send();
        return;
    }
    // Delete the film
    try {
        yield films.deleteFilm(parseInt(id, 10));
        res.statusMessage = "OK: Film successfully deleted";
        res.status(200).send();
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.deleteOne = deleteOne;
const getGenres = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const genres = yield films.getAllGenres();
        res.statusMessage = "OK: All genres retrieved from database";
        res.status(200).send(genres);
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getGenres = getGenres;
//# sourceMappingURL=film.server.controller.js.map