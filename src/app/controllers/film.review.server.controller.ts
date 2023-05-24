import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as films from '../models/film.server.model';
import * as reviews from '../models/flim.review.server.model';
import {validate} from "../resources/validator";
import * as schemas from "../resources/schemas.json";
import * as users from "../models/user.server.model";


const getReviews = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    if (isNaN(parseInt(id, 10))) {
        res.statusMessage = "Bad Request: ID is not a number";
        res.status( 400 ).send();
        return;
    }

    try {
        const validFilms = await films.getOneFilm(parseInt(id, 10));
        if (validFilms.length === 0) {
            res.statusMessage = "Not Found: No such film exists with the given idea";
            res.status( 404 ).send();
            return;
        }
    } catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }

    try{
        const filmReviews = await reviews.getReviews(parseInt(id, 10));
        res.statusMessage = "OK: Reviews successfully retrieved";
        res.status(200).send(filmReviews);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const addReview = async (req: Request, res: Response): Promise<void> => {
    // Validate film entries
    const validation = await validate (
        schemas.film_review_post,
        req.body);
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }

    const rating = parseInt(req.body.rating, 10);
    const review = req.body.review;

    // Check id is an integer
    const id = req.params.id;
    if (isNaN(parseInt(id, 10))) {
        res.statusMessage = "Bad Request: ID is not a number";
        res.status( 400 ).send();
        return;
    }

    // Get specified film
    let film;
    try {
        film = await films.getOneFilm(parseInt(id, 10));
        if (film.length === 0) {
            res.statusMessage = "Not Found: No such film exists with the given idea";
            res.status( 404 ).send();
            return;
        }
    } catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }

    // Get current user
    let user;
    if (req.header('X-Authorization') !== undefined ) {
        const authToken = req.header('X-Authorization');
        try {
            user = await users.findUserByToken(authToken);
            if (user.length === 0 || user[0].id === film[0].directorId) {
                res.statusMessage = 'Forbidden: Cannot review your own film';
                res.status(403).send();
                return;
            }
        } catch (err) {
            Logger.error(err);
            res.status( 500 ).send( `ERROR reading user: ${ err }`)
            return;
        }
    } else {
        res.statusMessage = 'Unauthorised: No auth token';
        res.status(401).send();
        return;
    }

    // Check release date is in the future
    const releaseDate = new Date(film[0].releaseDate);
    const now = new Date();
    if (releaseDate > now) {
        res.statusMessage = "Forbidden: Cannot review a film that has not yet been released";
        res.status(403).send();
        return;
    }

    try{
        await reviews.addReview(parseInt(id, 10), user[0].id, rating, review, now.toISOString().slice(0, 19).replace('T', ' '));
        res.statusMessage = "Created: New review successfully added";
        res.status(201).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getReviews, addReview}