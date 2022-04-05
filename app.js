const fs = require("fs")
const Schema = require("./user_data_pb")
const axios = require("axios")

const USER_LIST_ID = "u-l-id"
const YOUR_GOOGLE_NETWORK_ID = "YOUR_GOOGLE_NETWORK_ID"

fs.readFile("./userIDs.txt", async (err, data) => {
    if (err) { throw err }
    const filteredArrayOfUserIDs = new Array()
    data.toString().split("\n").forEach(val => filteredArrayOfUserIDs.push(val.replace("\r", ""))) // Split the user IDs assuming they are seperated by a new line. Then push each userID to a filtered list, removing any trailing "\r"s

    const users = new Schema.UpdateUsersDataRequest();

    for (let i = 0; i < filteredArrayOfUserIDs.length; i++) {
        const user = new Schema.User() // Creates a new User as defined by user_data.proto
        user.setUserId(filteredArrayOfUserIDs[i])
        user.setUserListId(USER_LIST_ID)

        users.addOps(user) // Adds user to collection of users

        if (i + 1 === filteredArrayOfUserIDs.length) {
            const bytes = users.serializeBinary() // Converts to protobuf binary

            await axios.post(`https://cm.g.doubleclick.net/upload?nid=${YOUR_GOOGLE_NETWORK_ID}`, bytes, {
                headers: {
                    'content-type': 'application/x-protobuf'
                }
            }) // Sends binary data to requested URL
                .then((res) => {
                    console.log(res.data)
                })
                .catch((err) => {
                    console.log(err.message)
                })
        }
    }
})