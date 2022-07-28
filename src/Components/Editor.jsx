import React, { useEffect, useRef } from 'react';
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
import ACTIONS from '../Actions';


const Editor = ({ socketRef, roomId, onCodeChange }) => {
    const editorRef = useRef()
    useEffect(() => {
        async function init() {
            console.log("render")
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
                onCodeChange(code)
                if (origin !== "setValue") {
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code
                    })
                }
            })

            // editorRef.current.setValue("console.log('Hello');")
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
        }

        return () => {
            socketRef.current.off(ACTIONS.CODE_CHANGE);
        }

    }, [socketRef.current])

    return <textarea id="realtimeEditor" ></textarea>;
}
export default Editor;




/*


    const [input, setInput] = useState("")
    const [output, setOutput] = useState("")
    const [lang, setLang] = useState("c");
    const [config, setConfig] = useState({
        mode: { name: "javascript", json: true },
        theme: "dracula",
        autoCloseTags: true,
        autoCloseBrackets: true,
        lineNumbers: true,
        matchBrackets: true
    })


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
                    <option value="cpp">Cpp</option>
                    <option value="java">Java</option>
                    <option value="python">Python</option>
                </select>
                <button className="btn copyBtn" onClick={copyRoomId}>Copy ROOM ID</button>
                <button className="btn leaveBtn" onClick={leaveRoom}>Leave</button>
            </div>
            <div className="editorWrap" style={{ minWidth: "60%" }}>
<textarea id="realtimeEditor"></textarea>
            </div >
    <div className="ioBox" style={{ display: "flex", width: "100%", flexDirection: "column" }}>
        <textarea name="" id="" placeholder="input goes here..." style={{ width: "100%", height: "50%", outline: "none" }} value={input} onChange={(e) => { setInput(e.target.value) }}>{input}</textarea>
        <button className="btn" style={{ padding: "5px", fontSize: "15px" }} onClick={handleCodeSubmit}>RUN</button>
        <textarea name="" id="" placeholder="output goes here..." style={{ width: "100%", height: "50%", outline: "none" }} value={output} onChange={(e) => setOutput(e.target.value)}>{output}</textarea>
    </div>
        </div >
    )



*/