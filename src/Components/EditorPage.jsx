import React, { useEffect, useRef, useState } from 'react'
import Client from "./Client"
import Editor from "./Editor"
import ACTIONS from "../Actions"
import { initSocket } from './../socket';
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom"
import { toast } from 'react-hot-toast';

const EditorPage = () => {

    const socketRef = useRef();
    const codeRef = useRef();
    const location = useLocation();
    const reactNavigator = useNavigate();
    const params = useParams();
    // console.log(params)
    const roomId = params.roomId;
    const [clients, setClients] = useState([]);

    useEffect(() => {
        const init = async () => {
            //immediately connection established
            socketRef.current = await initSocket()
            socketRef.current.on("connect_error", (err) => handleErrors(err))
            socketRef.current.on("connect_failed", (err) => handleErrors(err))

            const handleErrors = (err) => {
                console.log("Socket error = ", err)
                toast.error("Socket connection failed, Try again!")
                reactNavigator("/")
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                //username is being send via route state through home component
                username: location.state?.username
            })

            //Listening for joined event
            socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
                // for other clients UI
                if (username !== location.state?.username) {
                    toast.success(`${username} joined the room!`)
                    console.log(`${username} joined`)
                }
                setClients(clients)
                socketRef.current.emit(ACTIONS.SYNC_CODE, {
                    code: codeRef.current,
                    socketId
                })
            })

            //Listening for disconnect event
            socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
                toast.success(`${username} left the room!`)
                setClients((prev) => {
                    return prev.filter(client => client.socketId !== socketId)
                })
            })

        }
        init();

        //componentWillUnmount to clean all the socket listeners to prevent memory leak
        return () => {
            socketRef.current.off(ACTIONS.JOINED)
            socketRef.current.off(ACTIONS.DISCONNECTED)
            socketRef.current.disconnect()
        }
    }, []);

    const copyRoomId = async () => {
        try {
            //inbuilt browser API available globally via window object
            await navigator.clipboard.writeText(roomId)
            toast.success("Room ID has been copied to your clipboard!")
        } catch (err) {
            toast.error("Could not copy Room ID!")
            console.log(err)
        }
    }

    const leaveRoom = () => {
        reactNavigator("/")
    }

    if (!location.state) {
        return <Navigate to="/" />
    }

    return (
        <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img src="/code-sync.png" alt="logo" className="logoImage" />
                    </div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map(client => <Client key={client.socketId} username={client.username} />)}
                    </div>
                </div>
                <button className="btn copyBtn" onClick={copyRoomId}>Copy ROOM ID</button>
                <button className="btn leaveBtn" onClick={leaveRoom}>Leave</button>
            </div>
            <div className="editorWrap">
                <Editor socketRef={socketRef} roomId={roomId} onCodeChange={(code) => { codeRef.current = code }} />
            </div>
        </div>
    )
}

export default EditorPage