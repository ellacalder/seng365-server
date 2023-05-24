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
exports.findUserByToken = exports.findUser = exports.updateUser = exports.unAuthUser = exports.authUser = exports.checkUserExists = exports.insertUser = exports.getOneUser = void 0;
const db_1 = require("../../config/db");
const getOneUser = (id, authenticated) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    let query;
    if (authenticated === 0) {
        query = 'select first_name as firstName, last_name as lastName from user where id = ?';
    }
    else {
        query = 'select first_name as firstName, last_name as lastName, email from user where id = ?';
    }
    const [rows] = yield conn.query(query, [id]);
    yield conn.release();
    return rows;
});
exports.getOneUser = getOneUser;
const insertUser = (email, firstname, lastname, filename, password) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'insert into user (email, first_name, last_name, image_filename, password) values ( ?, ?, ?, ?, ? )';
    const [result] = yield conn.query(query, [email, firstname, lastname, filename, password]);
    yield conn.release();
    return result;
});
exports.insertUser = insertUser;
const checkUserExists = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select * from user where email = ?';
    const [result] = yield conn.query(query, [email]);
    yield conn.release();
    return result;
});
exports.checkUserExists = checkUserExists;
const authUser = (id, authToken) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'update user set auth_token = ? where id = ?';
    const [result] = yield conn.query(query, [authToken, id]);
    yield conn.release();
    return result;
});
exports.authUser = authUser;
const unAuthUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'update user set auth_token = ? where id = ?';
    const [result] = yield conn.query(query, [null, id]);
    yield conn.release();
    return result;
});
exports.unAuthUser = unAuthUser;
const updateUser = (id, email, firstname, lastname, filename, password) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'update user set first_name = ?, last_name = ?, image_filename = ?, email = ?, password =  ? where id = ?';
    const [result] = yield conn.query(query, [firstname, lastname, filename, email, password, id]);
    yield conn.release();
    return result;
});
exports.updateUser = updateUser;
const findUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select first_name as firstName, last_name as lastName, email, id, image_filename as imageFilename, password, auth_token from user where id = ?';
    const [result] = yield conn.query(query, [id]);
    yield conn.release();
    return result;
});
exports.findUser = findUser;
const findUserByToken = (authToken) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select first_name as firstName, last_name as lastName, email, id, image_filename as imageFilename, password, auth_token from user where auth_token = ?';
    const [result] = yield conn.query(query, [authToken]);
    yield conn.release();
    return result;
});
exports.findUserByToken = findUserByToken;
//# sourceMappingURL=user.server.model.js.map