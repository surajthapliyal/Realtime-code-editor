import React, { useState } from 'react'
import { v4 as uuidV4 } from "uuid";
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

const Home = () => {
    const [roomId, setRoomId] = useState("");
    const [username, setUsername] = useState("");
    const navigate = useNavigate();

    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuidV4();
        setRoomId(id);
        toast.success("Created a new room!")
    }

    const joinRoom = () => {
        if (!roomId || !username) {
            toast.error("Incomplete Information!");
            return;
        }
        navigate(`/editor/${roomId}`, {
            //to pass state data from one route to another
            state: { username }
        })
    }

    const handleInputEnter = (e) => {
        // console.log("Event", e.code);
        if (e.code !== 'Enter') return;
        joinRoom();
    }

    return (
        <div className="homePageWrapper">
            <div className="formWrapper">
                <img src="/code-sync.png" alt="code-sync-logo" className="homePageLogo" />
                <h4 className="mainLabel">Paste invitation ROOM ID</h4>
                <div className="inputGroup">
                    <input
                        type="text"
                        required
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="inputBox"
                        placeholder="ROOM ID"
                        onKeyUp={handleInputEnter}
                    />
                    <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="inputBox"
                        placeholder="USERNAME"
                        onKeyUp={handleInputEnter}
                    />
                    <button className="btn joinBtn" onClick={joinRoom}>Join</button>
                    <span className="createInfo">If you don't have an invite then create &nbsp;
                        <a onClick={createNewRoom} href="" className="createNewBtn">new room</a>
                    </span>
                </div>
            </div>
            <footer>
                <h4>Built with 💛 by &nbsp; <a href="https://github.com/surajthapliyal">Suraj Thapliyal</a></h4>
            </footer>
        </div>
    )
}

export default Home