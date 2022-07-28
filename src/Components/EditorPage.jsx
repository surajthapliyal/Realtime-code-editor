import React, { useEffect, useRef, useState } from 'react'
import Client from "./Client"
import ACTIONS from "../Actions"
import { initSocket } from './../socket';
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom"
import { toast } from 'react-hot-toast';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/theme/midnight.css';
import 'codemirror/theme/yonce.css';
import 'codemirror/theme/the-matrix.css';
import 'codemirror/theme/eclipse.css';
import 'codemirror/theme/neo.css';
import 'codemirror/theme/paraiso-dark.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import axios from 'axios';

const EditorPage = () => {
    const socketRef = useRef();
    const codeRef = useRef();
    const location = useLocation();
    const editorRef = useRef()
    const reactNavigator = useNavigate();
    const params = useParams();
    const roomId = params.roomId;
    const [clients, setClients] = useState([]);
    const [input, setInput] = useState("input goes here...")
    const [output, setOutput] = useState("output goes here...")
    const [lang, setLang] = useState("c");
    const [loading, setLoading] = useState(false)
    const [config, setConfig] = useState({
        mode: { name: "javascript", json: true },
        theme: "dracula",
        autoCloseTags: true,
        autoCloseBrackets: true,
        lineNumbers: true,
        matchBrackets: true
    })

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


    useEffect(() => {
        async function init() {
            editorRef.current = Codemirror.fromTextArea(document.getElementById("realtimeEditor"), {
                mode: { name: "javascript", json: true },
                theme: "dracula",
                autoCloseTags: true,
                autoCloseBrackets: true,
                lineNumbers: true,
                matchBrackets: true
            })

            //Listening for Code change event of codemirror
            editorRef.current.on("change", (editorInstance, changes) => {
                // console.log("changes = ", changes)
                const { origin } = changes
                const code = editorInstance.getValue()
                codeRef.current = code;
                if (origin !== "setValue") {
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code
                    })
                }
            })
            // editor.setValue("console.log('Hello');")
        }
        init();
    }, []);


    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                if (code !== null) {
                    editorRef.current.setValue(code)
                }
            })
            socketRef.current.on(ACTIONS.CHANGE_INPUT, (data) => {
                setInput(data);
            })

            socketRef.current.on(ACTIONS.CHANGE_OUTPUT, (data) => {
                setOutput(data);
            })
        }
        return () => {
            socketRef.current.off(ACTIONS.CODE_CHANGE);
            socketRef.current.off(ACTIONS.CHANGE_INPUT);
            socketRef.current.off(ACTIONS.CHANGE_OUTPUT);
        }

    }, [socketRef.current])


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

    const handleCodeSubmit = (e) => {
        e.preventDefault();
        const code = codeRef.current
        console.log("from frontend", { code, lang, input })
        if (!code || !lang) {
            return;
        }
        setLoading((prev) => !prev);
        setOutput("running...");
        socketRef.current.emit(ACTIONS.CHANGE_OUTPUT, { roomId, data: "running..." });
        const data = { code, lang, input };

        //hitting post request to compile the code and saving output to output hook

        axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/code/submit`, data)
            .then(res => {
                console.log(res.data)
                const data = res.data
                if (data.err) {
                    // Error in user code
                    setOutput(data.error)
                    socketRef.current.emit(ACTIONS.CHANGE_OUTPUT, { roomId, data: data.error });
                } else {
                    setOutput(data.output)
                    socketRef.current.emit(ACTIONS.CHANGE_OUTPUT, { roomId, data: data.output });
                }
            })
            .catch(err => console.log(err))

        setLoading((prev) => !prev);

    }

    if (!location.state) {
        return <Navigate to="/" />
    }

    return (
        <div className="mainWrap" style={{ display: "flex" }}>
            <div className="aside">
                <div className="asideInner">
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map(client => <Client key={client.socketId} username={client.username} />)}
                    </div>
                </div>
                <select name="modeSelect" className="btn themeSelect" onChange={(e) => {
                    editorRef.current.setOption("theme", e.target.value)
                }}>
                    <option value="dracula">Dracula</option>
                    <option value="monokai">Monokai</option>
                    <option value="neo">Neo</option>
                    <option value="the-matrix">Matrix</option>
                    <option value="yonce">Yonce</option>
                    <option value="eclipse">Eclipse</option>
                    <option value="midnight">Midnight</option>
                    <option value="paraiso-dark">Paraiso</option>
                </select>
                <select name="modeSelect" className="btn modeSelect" onChange={(e) => setLang(e.target.value)}>
                    <option value="c">C</option>
                    <option value="java">Java</option>
                    <option value="python">Python</option>
                </select>
                <button className="btn copyBtn" onClick={copyRoomId}>Copy ROOM ID</button>
                <button className="btn leaveBtn" onClick={leaveRoom}>Leave</button>
            </div>
            <div className="editorWrap" style={{ minWidth: "60%" }}>
                <textarea id="realtimeEditor"></textarea>
            </div>
            <div className="ioBox" style={{ display: "flex", width: "100%", flexDirection: "column" }}>
                <textarea name="" id="" style={{ width: "100%", height: "50%", outline: "none", fontSize: "20px" }} value={input} onChange={(e) => {
                    setInput(e.target.value)
                    socketRef.current.emit(ACTIONS.CHANGE_INPUT, { roomId, data: e.target.value });
                }}>{input}</textarea>
                <button className="btn" style={{ padding: "5px", fontSize: "15px" }} onClick={handleCodeSubmit} disabled={loading}>RUN</button>
                <textarea name="" id="" style={{ width: "100%", height: "50%", outline: "none", color: "black", fontWeight: "bold", fontSize: "20px" }} value={output} onChange={(e) => setOutput(e.target.value)} disabled={true}>{output}</textarea>
            </div>
        </div >
    )
}

export default EditorPage