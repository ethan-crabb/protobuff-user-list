const fs = require("fs")
const Schema = require("./user_data_pb")
const axios = require("axios")
const protobuf = require("protobufjs");

const USER_LIST_ID = "USER_LIST_ID"
const YOUR_GOOGLE_NETWORK_ID = "YOUR_GOOGLE_NETWORK_ID"

fs.readFile("./userIDs.txt", async (err, data) => {
    if (err) { throw err }
    const filteredArrayOfUserIDs = new Array()
    data.toString().split("\n").forEach(val => filteredArrayOfUserIDs.push(val.replace("\r", ""))) // Split the user IDs assuming they are seperated by a new line. Then push each userID to a filtered list, removing any trailing "\r"s

    const users = new Schema.Request();

    for (let i = 0; i < filteredArrayOfUserIDs.length; i++) {
        const user = new Schema.ops() // Creates a new User as defined by user_data.proto
        user.setUserId(filteredArrayOfUserIDs[i])
        user.setUserListId(USER_LIST_ID)

        users.addUpdateusersdatarequest(user) // Adds user to collection of users

        if (i + 1 === filteredArrayOfUserIDs.length) {
            const bytes = users.serializeBinary() // Converts to protobuf binary

            await axios.post(`https://cm.g.doubleclick.net/upload?nid=${YOUR_GOOGLE_NETWORK_ID}`, bytes, {
                headers: {
                    'content-type': 'application/x-protobuf'
                }
            }) // Sends binary data to requested URL
                .then((res) => {
                    const byteArray = users.serializeBinary(res.data) // Converts protobuf binary into Uint8Array 
                    protobuf.load("user_data.proto", (err, root) => { // Loads the response data schema
                        if (err) { throw err }
                        try { // If it con't find a 'UpdateUsersDataResponse' message it will look for a 'Request' message insted
                            const Message = root.lookupType("UpdateUsersDataResponse") // Look up responce message in schema
                            console.log(Message.decode(byteArray))
                        } catch {
                            const Message = root.lookupType("Request")
                            console.log(Message.decode(byteArray))
                        }
                    })
                })
                .catch((err) => {
                    console.log(err.message)
                })
        }
    }
})