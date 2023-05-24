import {Request, Response} from "express";
import * as users from '../models/user.server.model';
import Logger from "../../config/logger";
import {validate} from "../resources/validator";
import * as schemas from '../resources/schemas.json';

/**
 * Register new user
 *
 * @param req
 * @param res
 */
const register = async (req: Request, res: Response): Promise<void> => {
    // Validate register input
    const validation = await validate (
        schemas.user_register,
        req.body);
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
        const checkEmailUsers = await users.checkUserExists( email );
        if (checkEmailUsers.length !== 0) {
            res.statusMessage = "Forbidden: Email is already in use";
            res.status(403).send();
            return;
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }

    // Register the new user
    try {
        const result = await users.insertUser( email, firstname, lastname, filename, hash );
        res.statusMessage = "User successfully registered";
        res.status( 201 ).json({
            userId: result.insertId,
        });
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

/**
 * Login a user.
 *
 * @param req
 * @param res
 */
const login = async (req: Request, res: Response): Promise<void> => {
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
        result = await users.checkUserExists(email);
        if ( result.length === 0 ) {
            res.statusMessage = "Unauthorised: No account exists with this email";
            res.status(401 ).send();
            return;
        } else if (!bcrypt.compareSync(password, result[0].password)) {
            res.statusMessage = "Unauthorised: Incorrect password";
            res.status(401).send();
            return;
        }
    } catch (err) {
        res.status( 500 ).send( `ERROR reading user: ${ err }`);
        return;
    }

    // Login in the new user
    try{
        const authToken = require('rand-token').generate(16);
        await users.authUser(result[0].id, authToken);
        const authUser = await users.findUserByToken(authToken);
        res.statusMessage = "OK: User successfully logged in";
        res.status(200).json({
            token: authToken,
            userId: authUser[0].id,
        });
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

/**
 * Logout from the API
 *
 * @param req
 * @param res
 */
const logout = async (req: Request, res: Response): Promise<void> => {
    // Check there is an auth token in the header of the request
    let user;
    if (req.header('X-Authorization') !== undefined ) {
        const authToken = req.header('X-Authorization');
        try {
            user = await users.findUserByToken(authToken);
            if (user.length === 0) {
                res.statusMessage = 'Unauthorised: You need to be logged in in order to logout';
                res.status(401).send();
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

    // Remove the authorisation token from the logged-in user
    try{
        await users.unAuthUser(user[0].id);
        res.statusMessage = "OK: User successfully logged out";
        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

/**
 * View details of a specified user
 *
 * @param req
 * @param res
 */
const view = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    let authenticated = 0;

    // Check id is a number
    if (isNaN(parseInt(id, 10))) {
        res.statusMessage = "Bad Request: ID is not a number";
        res.status( 400 ).send();
        return;
    }

    // Check there is an auth token in the header of the request
    let user;
    if (req.header('X-Authorization') !== undefined ) {
        const authToken = req.header('X-Authorization');
        try {
            user = await users.findUserByToken(authToken);
            if( user.length === 0 ){
                res.statusMessage = "Not Found: No user with the specified ID";
                res.status( 404 ).send();
                return;
            }
            if (user[0].id === parseInt(id,10)) {
                authenticated = 1;
            }
        } catch (err) {
            Logger.error(err);
            res.status( 500 ).send( `ERROR reading user: ${ err }`)
            return;
        }
    }

    // Find the appropriate details of the requested user
    try{
        let result;
        result = await users.getOneUser( parseInt(id, 10), authenticated);
        res.statusMessage = "OK: User successfully retrieved from the database";
        res.status( 200 ).send( result[0] );
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const update = async (req: Request, res: Response): Promise<void> => {
    // Validate new input
    const validation = await validate (
        schemas.user_edit,
        req.body);
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }

    const id = req.params.id;

    // Check that the ID of the user being edited matches the ID of the user that is logged in
    let user;
    if (req.header('X-Authorization') !== undefined ) {
        const authToken = req.header('X-Authorization');
        try {
            if (parseInt(id, 10) === 0) {
                user = await users.findUserByToken(authToken);
            } else {
                user = await users.findUser(parseInt(id, 10));
            }
            if (user.length === 0) {
                res.statusMessage = "Not Found: User does not exist"
                res.status(404).send();
                return;
            }
            if (user[0].auth_token !== authToken) {
                res.statusMessage = "Forbidden: You are not logged in"
                res.status(403).send();
                return;
            }
        } catch (err) {
            Logger.error(err);
            res.status( 500 ).send( `ERROR reading user: ${ err }`)
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
    } else {
        firstname = user[0].firstName;
    }

    if (req.body.hasOwnProperty("lastName")) {
        lastname = req.body.lastName;
    } else {
        lastname = user[0].lastName;
    }

    // Check that the email given isn't already being used
    try {
        if (req.body.hasOwnProperty("email")) {
            email = req.body.email;
            const checkEmailUsers = await users.checkUserExists( email );
            if (checkEmailUsers.length !== 0) {
                res.statusMessage = "Forbidden: Email is already in use";
                res.status(403).send();
                return;
            }
        } else {
            email = user[0].email;
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }

    if (req.body.hasOwnProperty("imageFilename")) {
        filename = req.body.imageFilename;
    } else {
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
            } else if (!bcrypt.compareSync(currentPassword, user[0].password)) {
                res.statusMessage = "Unauthorised: Invalid current password";
                res.status(401).send();
                return;
            }
        } else {
            res.statusMessage = "Forbidden: Need to enter current password";
            res.status(403).send();
        }
    } else {
        hash = user[0].currentPassword;
    }

    // Update the user by committing the changed to the database
    try {
        await users.updateUser( parseInt(id,10), email, firstname, lastname, filename, hash );
        res.statusMessage = "OK: User successfully updated";
        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {register, login, logout, view, update}