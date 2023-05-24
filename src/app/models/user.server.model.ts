import { getPool } from '../../config/db';
import { ResultSetHeader } from 'mysql2';

const getOneUser = async (id : number, authenticated : number) : Promise<User[]> => {
    const conn = await getPool().getConnection();
    let query;
    if (authenticated === 0) {
        query = 'select first_name as firstName, last_name as lastName from user where id = ?';
    } else {
        query = 'select first_name as firstName, last_name as lastName, email from user where id = ?';
    }
    const [ rows ] = await conn.query( query, [ id ] );
    await conn.release();
    return rows;
}

const insertUser = async (email : string, firstname : string, lastname : string, filename : string, password : string): Promise<ResultSetHeader> => {
    const conn = await getPool().getConnection();
    const query = 'insert into user (email, first_name, last_name, image_filename, password) values ( ?, ?, ?, ?, ? )';
    const [ result ] = await conn.query( query, [ email, firstname, lastname, filename, password ] );
    await conn.release();
    return result;
}

const checkUserExists = async (email : string) : Promise<User[]> => {
    const conn = await getPool().getConnection();
    const query = 'select * from user where email = ?';
    const [ result ] = await conn.query( query, [ email ] );
    await conn.release();
    return result;
}

const authUser = async (id : number, authToken : string) : Promise<ResultSetHeader> => {
    const conn = await getPool().getConnection();
    const query = 'update user set auth_token = ? where id = ?';
    const [ result ] = await conn.query( query, [ authToken, id ] );
    await conn.release();
    return result;
}

const unAuthUser = async (id : number) : Promise<ResultSetHeader> => {
    const conn = await getPool().getConnection();
    const query = 'update user set auth_token = ? where id = ?';
    const [ result ] = await conn.query( query, [ null, id ] );
    await conn.release();
    return result;
}

const updateUser = async (id : number, email : string, firstname : string, lastname : string, filename : string, password : string): Promise<ResultSetHeader> => {
    const conn = await getPool().getConnection();
    const query = 'update user set first_name = ?, last_name = ?, image_filename = ?, email = ?, password =  ? where id = ?';
    const [ result ] = await conn.query( query, [ firstname, lastname, filename, email, password, id ] );
    await conn.release();
    return result;
}

const findUser = async (id : number) : Promise<User[]> => {
    const conn = await getPool().getConnection();
    const query = 'select first_name as firstName, last_name as lastName, email, id, image_filename as imageFilename, password, auth_token from user where id = ?';
    const [ result ] = await conn.query( query, [ id ] );
    await conn.release();
    return result;
}
const findUserByToken = async (authToken : string) : Promise<User[]> => {
    const conn = await getPool().getConnection();
    const query = 'select first_name as firstName, last_name as lastName, email, id, image_filename as imageFilename, password, auth_token from user where auth_token = ?';
    const [ result ] = await conn.query( query, [ authToken ] );
    await conn.release();
    return result;
}



export { getOneUser, insertUser, checkUserExists, authUser, unAuthUser, updateUser, findUser, findUserByToken }