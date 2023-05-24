import {getPool} from "../../config/db";
import {ResultSetHeader} from "mysql2";
import {remove} from "winston";
import Logger from "../../config/logger";

const getReviews = async (filmId : number) : Promise<FilmReview[]> => {
    const conn = await getPool().getConnection();
    const query = 'select user_id as reviewerId, rating, review, user.first_name as reviewerFirstName, user.last_name as reviewerLastName, timestamp from film_review join user on user.id = user_id where film_id = ? order by timestamp desc';
    const [ rows ] = await conn.query( query, [ filmId ] );
    await conn.release();
    return rows;
}

const addReview = async (filmId : number, userId : number, rating : number, review : string, timestamp : string) : Promise<FilmReview[]> => {
    const conn = await getPool().getConnection();
    const query = 'insert into film_review (film_id, user_id, rating, review, timestamp) values ( ?, ?, ?, ?, ? )';
    const [ rows ] = await conn.query( query, [ filmId, userId, rating, review, timestamp ] );
    await conn.release();
    return rows;
}

export { getReviews, addReview };