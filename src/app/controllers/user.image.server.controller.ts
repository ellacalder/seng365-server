import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as users from '../models/user.server.model';
import * as userImages from '../models/user.image.server.model'
import path from "path";
import fs from "mz/fs";


const getImage = async (req: Request, res: Response): Promise<void> => {
    // Check id is a number
    const id = req.params.id;
    if (isNaN(parseInt(id, 10))) {
        res.statusMessage = "Bad Request: ID is not a number";
        res.status( 400 ).send();
        return;
    }

    try{
        const user = await userImages.getImageById(parseInt(id, 10));
        if (user.length === 0) {
            res.statusMessage = "Not Found: No user with specified ID";
            res.status(404).send();
            return;
        }
        if (user[0].imageFilename === null) {
            res.statusMessage = "Not Found: User does not have an image";
            res.status(404).send();
            return;
        }
        const startPath = '../../../storage/images';
        const fullPath = path.join(startPath, user[0].imageFilename)
        res.statusMessage = "OK: Image successfully received";
        res.header("Content-Type", "image/"+user[0].imageFilename.split('.')[1])
        res.status(200).sendFile(path.join(__dirname, fullPath));
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const setImage = async (req: Request, res: Response): Promise<void> => {
    // Check id is a number
    const id = req.params.id;
    if (isNaN(parseInt(id, 10))) {
        res.statusMessage = "Bad Request: ID is not a number";
        res.status( 400 ).send();
        return;
    }

    Logger.info(`${req.header('Content-Type')}`);

    // Check permissions
    let user;
    if (req.header('X-Authorization') !== undefined ) {
        const authToken = req.header('X-Authorization');
        try {
            user = await users.findUserByToken(authToken);
            if (user.length === 0) {
                res.statusMessage = "Not Found: User does not exist"
                res.status(404).send();
                return;
            }
            if (user[0].auth_token !== authToken) {
                res.statusMessage = "Forbidden: Can not delete another user's profile photo"
                res.status(403).send();
                return;
            }
        } catch (err) {
            Logger.error(err);
            res.status( 500 ).send( `ERROR reading user: ${ err }`)
            return;
        }
    } else {
        res.statusMessage = "Unauthorised"
        res.status(401).send();
        return;
    }

    let newImage = 0;
    try{
        const image = await userImages.getImageById(parseInt(id, 10));
        if (image.length === 0) {
            res.statusMessage = "Not Found: No user with specified ID";
            res.status(404).send();
            return;
        }
        if (image[0].imageFilename === null) {
            newImage = 1;
        }
    } catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }

    // Check the content type
    let extension;
    if (req.header('Content-Type') !== undefined) {
        const imageType = req.header('Content-Type');
        if (imageType === 'image/png') {
            extension = '.png';
        } else if (imageType === 'image/jpeg') {
            extension = '.jpeg';
        } else if (imageType === 'image/gif') {
            extension = '.gif'
        } else {
            res.statusMessage = "Bad Request: Invalid image supplied";
            res.status(400).send();
            return;
        }
    } else {
        res.statusMessage = "Bad Request: Content Type is required"
        res.status(400).send();
        return;
    }

    try{
        await userImages.addImage(parseInt(id, 10), 'user_'+id+extension);
        const picture = req.body;
        const startPath = '../../../storage/images';
        const fullPath = path.join(startPath, 'user_'+id+extension);
        const pathname = path.join(__dirname, fullPath)
        fs.writeFileSync(pathname, picture);
        if (newImage === 1) {
            res.statusMessage = "Created: New image created";
            res.status(201).send();
            return;
        }
        res.statusMessage = "OK: Image updated";
        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const deleteImage = async (req: Request, res: Response): Promise<void> => {
    // Check id is a number
    const id = req.params.id;
    if (isNaN(parseInt(id, 10))) {
        res.statusMessage = "Bad Request: ID is not a number";
        res.status( 400 ).send();
        return;
    }

    // Check permissions
    let user;
    if (req.header('X-Authorization') !== undefined ) {
        const authToken = req.header('X-Authorization');
        try {
            user = await users.findUserByToken(authToken);
            if (user.length === 0) {
                res.statusMessage = "Not Found: User does not exist"
                res.status(404).send();
                return;
            }
            if (user[0].auth_token !== authToken) {
                res.statusMessage = "Forbidden: Can not delete another user's profile photo"
                res.status(403).send();
                return;
            }
        } catch (err) {
            Logger.error(err);
            res.status( 500 ).send( `ERROR reading user: ${ err }`)
            return;
        }
    } else {
        res.statusMessage = "Unauthorised"
        res.status(401).send();
        return;
    }

    try{
        await userImages.removeImage(parseInt(id, 10));
        res.statusMessage = "OK: Image successfully removed";
        res.status(200).send();
        return;
    } catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export { getImage, setImage, deleteImage }