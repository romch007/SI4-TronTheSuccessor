const http = require("http");
const userDatabase = require("./js/userDatabase.js");
const {getRequestBody, sendResponse} = require("./js/utils.js");
const {
    handleGetFriends,
    handleGetUser,
    handleRemoveFriend,
    handleAddFriend
} = require("./js/social.js");
const {HTTP_STATUS} = require("./js/utils.js");
const {getAuthorizationToken} = require("./js/utils.js");

http.createServer(async (request, response) => {
    const filePath = request.url.split("/").filter(elem => elem !== "..");

    try {
        if (filePath.length < 4) {
            sendResponse(response, HTTP_STATUS.NOT_FOUND);
        }
        switch (filePath[3]) {
            case "sign-up":
                await handleSignUp(request, response);
                break;
            case "sign-in":
                await handleSignIn(request, response);
                break;
            case "renew-access-token":
                await handleRenewToken(request, response);
                break;
            case "security-questions":
                await handleSecurityQuestions(request, response);
                break;
            case "verify-answers":
                await handleVerifyAnswers(request, response);
                break;
            case "reset-password":
                await handleResetPassword(request, response);
                break;
            case "check":
                if (request.method === "GET")
                    await handleGetUser(request, response, filePath[4]);
                break;
            case "friends":
                if (request.method === "GET")
                    await handleGetFriends(request, response);
                else if (request.method === "POST")
                    await handleAddFriend(request, response, filePath[4]);
                else if (request.method === "DELETE")
                    await handleRemoveFriend(request, response, filePath[4]);
                break;
            default:
                sendResponse(response, HTTP_STATUS.NOT_FOUND);
        }
    } catch (error) {
        console.warn(error);
        sendResponse(response, HTTP_STATUS.INTERNAL_SERVER_ERROR, {error: "Invalid request"});
    }
}).listen(8004);

async function handleSignUp(request, response) {
    const body = await getRequestBody(request);
    const parsedBody = JSON.parse(body);
    const result = await userDatabase.addUser(parsedBody.username, parsedBody.password, parsedBody.securityQuestions);
    sendResponse(response, result.error ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.CREATED, result);
}

async function handleSignIn(request, response) {
    const body = await getRequestBody(request);
    const parsedBody = JSON.parse(body);
    const result = await userDatabase.loginUser(parsedBody.username, parsedBody.password);
    sendResponse(response, result.error ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.OK, result);
}

async function handleRenewToken(request, response) {
    const refreshToken = getAuthorizationToken(request);
    const result = await userDatabase.renewToken(refreshToken);
    sendResponse(response, result.error ? HTTP_STATUS.UNAUTHORIZED : HTTP_STATUS.OK, result);
}

async function handleSecurityQuestions(request, response) {
    const body = await getRequestBody(request);
    const parsedBody = (body && JSON.parse(body)) || {};
    const result = await userDatabase.getSecurityQuestions(parsedBody.username);
    sendResponse(response, result.error ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.OK, result);
}

async function handleVerifyAnswers(request, response) {
    const body = await getRequestBody(request);
    const parsedBody = JSON.parse(body);
    const result = await userDatabase.verifyAnswers(parsedBody.username, parsedBody.answers);
    sendResponse(response, result.error ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.OK, result);
}

async function handleResetPassword(request, response) {
    const body = await getRequestBody(request);
    const parsedBody = JSON.parse(body);
    let resetPasswordToken;
    try {
        resetPasswordToken = request.headers["authorization"].split("Bearer ")[1];
    } catch (error) {
        resetPasswordToken = "";
    }
    const result = await userDatabase.resetPassword(parsedBody.newPassword, resetPasswordToken);
    sendResponse(response, result.error ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.OK, result);
}
