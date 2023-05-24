import {ResultSetHeader} from "mysql2";
import {getPool} from "../../config/db";

const getImageById = async (id : number) : Promise<User[]> => {
    const conn = await getPool().getConnection();
    const query = 'select image_filename as imageFilename from film where id = ?';
    const [ result ] = await conn.query( query, [ id ] );
    await conn.release();
    return result;
}

const addImage = async (id : number, imageFilename : string) : Promise<ResultSetHeader> => {
    const conn = await getPool().getConnection();
    const query = 'update film set image_filename = ? where id = ?';
    const [ result ] = await conn.query( query, [ imageFilename, id ] );
    await conn.release();
    return result;
}

export { getImageById, addImage }