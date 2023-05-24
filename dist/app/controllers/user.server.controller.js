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
exports.update = exports.view = exports.logout = exports.login = exports.register = void 0;
const users = __importStar(require("../models/user.server.model"));
const logger_1 = __importDefault(require("../../config/logger"));
const validator_1 = require("../resources/validator");
const schemas = __importStar(require("../resources/schemas.json"));
/**
 * Register new user
 *
 * @param req
 * @param res
 */
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate register input
    const validation = yield (0, validator_1.validate)(schemas.user_register, req.body);
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }
    const email = req.body.email;
    const firstname = req.body.firstName;
    const lastname = req.body.lastName;
    const filename = req.body.imageFilename;
    // hash password
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
    // Check that the email given isn't already being used
    try {
        const checkEmailUsers = yield users.checkUserExists(email);
        if (checkEmailUsers.length !== 0) {
            res.statusMessage = "Forbidden: Email is already in use";
            res.status(403).send();
            return;
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
    // Register the new user
    try {
        const result = yield users.insertUser(email, firstname, lastname, filename, hash);
        res.statusMessage = "User successfully registered";
        res.status(201).json({
            userId: result.insertId,
        });
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.register = register;
/**
 * Login a user.
 *
 * @param req
 * @param res
 */
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body.hasOwnProperty("email")) {
        res.statusMessage = `Bad Request: Email is a required field`;
        res.status(400).send();
        return;
    }
    if (!req.body.hasOwnProperty("password")) {
        res.statusMessage = `Bad Request: Password is a required field`;
        res.status(400).send();
        return;
    }
    const email = req.body.email;
    const password = req.body.password;
    const bcrypt = require('bcryptjs');
    let result;
    // Check email and password are correct
    try {
        result = yield users.checkUserExists(email);
        if (result.length === 0) {
            res.statusMessage = "Unauthorised: No account exists with this email";
            res.status(401).send();
            return;
        }
        else if (!bcrypt.compareSync(password, result[0].password)) {
            res.statusMessage = "Unauthorised: Incorrect password";
            res.status(401).send();
            return;
        }
    }
    catch (err) {
        res.status(500).send(`ERROR reading user: ${err}`);
        return;
    }
    // Login in the new user
    try {
        const authToken = require('rand-token').generate(16);
        yield users.authUser(result[0].id, authToken);
        const authUser = yield users.findUserByToken(authToken);
        res.statusMessage = "OK: User successfully logged in";
        res.status(200).json({
            token: authToken,
            userId: authUser[0].id,
        });
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.login = login;
/**
 * Logout from the API
 *
 * @param req
 * @param res
 */
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Check there is an auth token in the header of the request
    let user;
    if (req.header('X-Authorization') !== undefined) {
        const authToken = req.header('X-Authorization');
        try {
            user = yield users.findUserByToken(authToken);
            if (user.length === 0) {
                res.statusMessage = 'Unauthorised: You need to be logged in in order to logout';
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
    // Remove the authorisation token from the logged-in user
    try {
        yield users.unAuthUser(user[0].id);
        res.statusMessage = "OK: User successfully logged out";
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
exports.logout = logout;
/**
 * View details of a specified user
 *
 * @param req
 * @param res
 */
const view = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    let authenticated = 0;
    // Check id is a number
    if (isNaN(parseInt(id, 10))) {
        res.statusMessage = "Bad Request: ID is not a number";
        res.status(400).send();
        return;
    }
    // Check there is an auth token in the header of the request
    let user;
    if (req.header('X-Authorization') !== undefined) {
        const authToken = req.header('X-Authorization');
        try {
            user = yield users.findUserByToken(authToken);
            if (user.length === 0) {
                res.statusMessage = "Not Found: No user with the specified ID";
                res.status(404).send();
                return;
            }
            if (user[0].id === parseInt(id, 10)) {
                authenticated = 1;
            }
        }
        catch (err) {
            logger_1.default.error(err);
            res.status(500).send(`ERROR reading user: ${err}`);
            return;
        }
    }
    // Find the appropriate details of the requested user
    try {
        let result;
        result = yield users.getOneUser(parseInt(id, 10), authenticated);
        res.statusMessage = "OK: User successfully retrieved from the database";
        res.status(200).send(result[0]);
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.view = view;
const update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate new input
    const validation = yield (0, validator_1.validate)(schemas.user_edit, req.body);
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }
    const id = req.params.id;
    // Check that the ID of the user being edited matches the ID of the user that is logged in
    let user;
    if (req.header('X-Authorization') !== undefined) {
        const authToken = req.header('X-Authorization');
        try {
            if (parseInt(id, 10) === 0) {
                user = yield users.findUserByToken(authToken);
            }
            else {
                user = yield users.findUser(parseInt(id, 10));
            }
            if (user.length === 0) {
                res.statusMessage = "Not Found: User does not exist";
                res.status(404).send();
                return;
            }
            if (user[0].auth_token !== authToken) {
                res.statusMessage = "Forbidden: You are not logged in";
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
    const bcrypt = require('bcryptjs');
    let firstname;
    let lastname;
    let email;
    let filename;
    let currentPassword;
    let password;
    let hash;
    // Check what values are being updated
    if (req.body.hasOwnProperty("firstName")) {
        firstname = req.body.firstName;
    }
    else {
        firstname = user[0].firstName;
    }
    if (req.body.hasOwnProperty("lastName")) {
        lastname = req.body.lastName;
    }
    else {
        lastname = user[0].lastName;
    }
    // Check that the email given isn't already being used
    try {
        if (req.body.hasOwnProperty("email")) {
            email = req.body.email;
            const checkEmailUsers = yield users.checkUserExists(email);
            if (checkEmailUsers.length !== 0) {
                res.statusMessage = "Forbidden: Email is already in use";
                res.status(403).send();
                return;
            }
        }
        else {
            email = user[0].email;
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
    if (req.body.hasOwnProperty("imageFilename")) {
        filename = req.body.imageFilename;
    }
    else {
        filename = user[0].imageFilename;
    }
    // Check passwords are different and the current password matches the one stored in the database
    if (req.body.hasOwnProperty("password")) {
        password = req.body.password;
        hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
        if (req.body.hasOwnProperty("currentPassword")) {
            currentPassword = req.body.currentPassword;
            if (currentPassword === password) {
                res.statusMessage = "Forbidden: Identical current password and new password";
                res.status(403).send();
                return;
            }
            else if (!bcrypt.compareSync(currentPassword, user[0].password)) {
                res.statusMessage = "Unauthorised: Invalid current password";
                res.status(401).send();
                return;
            }
        }
        else {
            res.statusMessage = "Forbidden: Need to enter current password";
            res.status(403).send();
        }
    }
    else {
        hash = user[0].currentPassword;
    }
    // Update the user by committing the changed to the database
    try {
        yield users.updateUser(parseInt(id, 10), email, firstname, lastname, filename, hash);
        res.statusMessage = "OK: User successfully updated";
        res.status(200).send();
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.update = update;
//# sourceMappingURL=user.server.controller.js.map