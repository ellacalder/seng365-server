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
exports.addReview = exports.getReviews = void 0;
const db_1 = require("../../config/db");
const getReviews = (filmId) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select user_id as reviewerId, rating, review, user.first_name as reviewerFirstName, user.last_name as reviewerLastName, timestamp from film_review join user on user.id = user_id where film_id = ? order by timestamp desc';
    const [rows] = yield conn.query(query, [filmId]);
    yield conn.release();
    return rows;
});
exports.getReviews = getReviews;
const addReview = (filmId, userId, rating, review, timestamp) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'insert into film_review (film_id, user_id, rating, review, timestamp) values ( ?, ?, ?, ?, ? )';
    const [rows] = yield conn.query(query, [filmId, userId, rating, review, timestamp]);
    yield conn.release();
    return rows;
});
exports.addReview = addReview;
//# sourceMappingURL=flim.review.server.model.js.map