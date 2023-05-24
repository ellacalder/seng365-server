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
exports.addReview = exports.getReviews = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const films = __importStar(require("../models/film.server.model"));
const reviews = __importStar(require("../models/flim.review.server.model"));
const validator_1 = require("../resources/validator");
const schemas = __importStar(require("../resources/schemas.json"));
const users = __importStar(require("../models/user.server.model"));
const getReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    if (isNaN(parseInt(id, 10))) {
        res.statusMessage = "Bad Request: ID is not a number";
        res.status(400).send();
        return;
    }
    try {
        const validFilms = yield films.getOneFilm(parseInt(id, 10));
        if (validFilms.length === 0) {
            res.statusMessage = "Not Found: No such film exists with the given idea";
            res.status(404).send();
            return;
        }
    }
    catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
    try {
        const filmReviews = yield reviews.getReviews(parseInt(id, 10));
        res.statusMessage = "OK: Reviews successfully retrieved";
        res.status(200).send(filmReviews);
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getReviews = getReviews;
const addReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate film entries
    const validation = yield (0, validator_1.validate)(schemas.film_review_post, req.body);
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
        res.status(400).send();
        return;
    }
    // Get specified film
    let film;
    try {
        film = yield films.getOneFilm(parseInt(id, 10));
        if (film.length === 0) {
            res.statusMessage = "Not Found: No such film exists with the given idea";
            res.status(404).send();
            return;
        }
    }
    catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
    // Get current user
    let user;
    if (req.header('X-Authorization') !== undefined) {
        const authToken = req.header('X-Authorization');
        try {
            user = yield users.findUserByToken(authToken);
            if (user.length === 0 || user[0].id === film[0].directorId) {
                res.statusMessage = 'Forbidden: Cannot review your own film';
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
    // Check release date is in the future
    const releaseDate = new Date(film[0].releaseDate);
    const now = new Date();
    if (releaseDate > now) {
        res.statusMessage = "Forbidden: Cannot review a film that has not yet been released";
        res.status(403).send();
        return;
    }
    try {
        yield reviews.addReview(parseInt(id, 10), user[0].id, rating, review, now.toISOString().slice(0, 19).replace('T', ' '));
        res.statusMessage = "Created: New review successfully added";
        res.status(201).send();
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.addReview = addReview;
//# sourceMappingURL=film.review.server.controller.js.map