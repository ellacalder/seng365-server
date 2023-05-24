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
exports.removeImage = exports.addImage = exports.getImageById = void 0;
const db_1 = require("../../config/db");
const getImageById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select image_filename as imageFilename from user where id = ?';
    const [result] = yield conn.query(query, [id]);
    yield conn.release();
    return result;
});
exports.getImageById = getImageById;
const addImage = (id, imageFilename) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'update user set image_filename = ? where id = ?';
    const [result] = yield conn.query(query, [imageFilename, id]);
    yield conn.release();
    return result;
});
exports.addImage = addImage;
const removeImage = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'update user set image_filename = NULL where id = ?';
    const [result] = yield conn.query(query, [id]);
    yield conn.release();
    return result;
});
exports.removeImage = removeImage;
//# sourceMappingURL=user.image.server.model.js.map