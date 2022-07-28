const express = require("express")
const app = express();
const cors = require("cors")
const http = require("http");
const bodyParser = require("body-parser")
const path = require("path");
const { Server } = require("socket.io")
const server = http.createServer(app);
const io = new Server(server)
const ACTIONS = require("../src/Actions")
const code = require("./api/code/code")

app.use(express.static("build"));
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }))
app.use("/api/code", code);

//global middleware (for any request in server we will serve this route first, this contains static build)

app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, "build", "index.html"))
})

const userSocketMap = {}

const getAllConnectedClients = (roomId) => {
    // console.log("All = ", io.sockets.adapter.rooms.get(roomId)) // Set of all socket clients connected to particular room
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(socketId => {
        return {
            socketId,
            username: userSocketMap[socketId]
        }
    })
}

io.on("connection", (socket) => {
    console.log("Socket Connection - ", socket.id)
    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username
        //adds newly created socket to the room (roomId) if exists otherwise firstly creates and then add
        socket.join(roomId)
        const clients = getAllConnectedClients(roomId)
        clients.forEach(({ socketId }) => {
            //notifying all connected clients on the room
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients, // all on room
                username, // username of who joined
                socketId: socket.id, // socketId of who joined
            })
        })
        // console.log(clients);
    })


    //when any socket changes the code, then other should have that reflected in their editor
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        //console.log(code);
        //emitting the same event from the server to all the clients connected to this particular room instead itself (socket which is emitting this event)
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code })
    })

    socket.on(ACTIONS.CHANGE_INPUT, ({ roomId, data }) => {
        socket.in(roomId).emit(ACTIONS.CHANGE_INPUT, data)
    })

    socket.on(ACTIONS.CHANGE_OUTPUT, ({ roomId, data }) => {
        socket.in(roomId).emit(ACTIONS.CHANGE_OUTPUT, data)
    })

    //existing code sync to the socket which get connected to any room
    socket.on(ACTIONS.SYNC_CODE, ({ code, socketId }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code })
    })

    //when this socket user is about to disconnect (through exits browser etc)
    socket.on("disconnecting", () => {
        // all rooms in which that particular socket is connected to
        const rooms = [...socket.rooms]
        rooms.forEach((roomId) => {
            //notifying that this particular user with socket.id and username is leaving this particular room
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id]
            })
        })
        delete userSocketMap[socket.id] // deleting its data from userSocketMap
        socket.leave(); // leaving this Socket IO Connection
    })
})


const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`Server listening on PORT ${PORT}`))

