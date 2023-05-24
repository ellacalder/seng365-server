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
exports.deleteImage = exports.setImage = exports.getImage = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const users = __importStar(require("../models/user.server.model"));
const userImages = __importStar(require("../models/user.image.server.model"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("mz/fs"));
const getImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Check id is a number
    const id = req.params.id;
    if (isNaN(parseInt(id, 10))) {
        res.statusMessage = "Bad Request: ID is not a number";
        res.status(400).send();
        return;
    }
    try {
        const user = yield userImages.getImageById(parseInt(id, 10));
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
        const fullPath = path_1.default.join(startPath, user[0].imageFilename);
        res.statusMessage = "OK: Image successfully received";
        res.header("Content-Type", "image/" + user[0].imageFilename.split('.')[1]);
        res.status(200).sendFile(path_1.default.join(__dirname, fullPath));
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getImage = getImage;
const setImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Check id is a number
    const id = req.params.id;
    if (isNaN(parseInt(id, 10))) {
        res.statusMessage = "Bad Request: ID is not a number";
        res.status(400).send();
        return;
    }
    logger_1.default.info(`${req.header('Content-Type')}`);
    // Check permissions
    let user;
    if (req.header('X-Authorization') !== undefined) {
        const authToken = req.header('X-Authorization');
        try {
            user = yield users.findUserByToken(authToken);
            if (user.length === 0) {
                res.statusMessage = "Not Found: User does not exist";
                res.status(404).send();
                return;
            }
            if (user[0].auth_token !== authToken) {
                res.statusMessage = "Forbidden: Can not delete another user's profile photo";
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
        res.statusMessage = "Unauthorised";
        res.status(401).send();
        return;
    }
    let newImage = 0;
    try {
        const image = yield userImages.getImageById(parseInt(id, 10));
        if (image.length === 0) {
            res.statusMessage = "Not Found: No user with specified ID";
            res.status(404).send();
            return;
        }
        if (image[0].imageFilename === null) {
            newImage = 1;
        }
    }
    catch (err) {
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
        }
        else if (imageType === 'image/jpeg') {
            extension = '.jpeg';
        }
        else if (imageType === 'image/gif') {
            extension = '.gif';
        }
        else {
            res.statusMessage = "Bad Request: Invalid image supplied";
            res.status(400).send();
            return;
        }
    }
    else {
        res.statusMessage = "Bad Request: Content Type is required";
        res.status(400).send();
        return;
    }
    try {
        yield userImages.addImage(parseInt(id, 10), 'user_' + id + extension);
        const picture = req.body;
        const startPath = '../../../storage/images';
        const fullPath = path_1.default.join(startPath, 'user_' + id + extension);
        const pathname = path_1.default.join(__dirname, fullPath);
        fs_1.default.writeFileSync(pathname, picture);
        if (newImage === 1) {
            res.statusMessage = "Created: New image created";
            res.status(201).send();
            return;
        }
        res.statusMessage = "OK: Image updated";
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
exports.setImage = setImage;
const deleteImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Check id is a number
    const id = req.params.id;
    if (isNaN(parseInt(id, 10))) {
        res.statusMessage = "Bad Request: ID is not a number";
        res.status(400).send();
        return;
    }
    // Check permissions
    let user;
    if (req.header('X-Authorization') !== undefined) {
        const authToken = req.header('X-Authorization');
        try {
            user = yield users.findUserByToken(authToken);
            if (user.length === 0) {
                res.statusMessage = "Not Found: User does not exist";
                res.status(404).send();
                return;
            }
            if (user[0].auth_token !== authToken) {
                res.statusMessage = "Forbidden: Can not delete another user's profile photo";
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
        res.statusMessage = "Unauthorised";
        res.status(401).send();
        return;
    }
    try {
        yield userImages.removeImage(parseInt(id, 10));
        res.statusMessage = "OK: Image successfully removed";
        res.status(200).send();
        return;
    }
    catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.deleteImage = deleteImage;
//# sourceMappingURL=user.image.server.controller.js.map