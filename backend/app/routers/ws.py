import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.multiplayer import chat_service, multiplayer_service, presence_service

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/game/{session_id}")
async def game_websocket(websocket: WebSocket, session_id: str, user_id: str = "", username: str = ""):
    room = await multiplayer_service.connect(session_id, user_id, username, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                msg_type = message.get("type", "")

                if msg_type == "state_update":
                    await multiplayer_service.update_game_state(session_id, message.get("state", {}))
                elif msg_type == "chat":
                    await multiplayer_service.broadcast(session_id, {
                        "type": "chat",
                        "user_id": user_id,
                        "username": username,
                        "text": message.get("text", ""),
                    })
                else:
                    await multiplayer_service.broadcast(session_id, {
                        "type": "player_action",
                        "user_id": user_id,
                        "username": username,
                        "action": message,
                    })
            except json.JSONDecodeError:
                await multiplayer_service.broadcast(session_id, {
                    "type": "player_action",
                    "user_id": user_id,
                    "username": username,
                    "action": {"raw": data},
                })
    except WebSocketDisconnect:
        await multiplayer_service.disconnect(session_id, user_id)


@router.websocket("/ws/chat/{session_id}")
async def chat_websocket(websocket: WebSocket, session_id: str, user_id: str = "", username: str = ""):
    await chat_service.connect(session_id, user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
            except json.JSONDecodeError:
                message = {"text": data}

            await chat_service.broadcast(
                session_id,
                {
                    "type": "chat_message",
                    "user_id": user_id,
                    "username": username,
                    "text": message.get("text", ""),
                    "voice_url": message.get("voice_url"),
                },
                exclude_user=user_id,
            )
    except WebSocketDisconnect:
        await chat_service.disconnect(session_id, user_id)


@router.websocket("/ws/presence")
async def presence_websocket(websocket: WebSocket, user_id: str = "", username: str = ""):
    await presence_service.connect(user_id, websocket)
    await presence_service.broadcast(
        {"type": "user_online", "user_id": user_id, "username": username},
        exclude_user=user_id,
    )
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                msg_type = message.get("type", "")
                if msg_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                elif msg_type == "get_online":
                    await websocket.send_text(json.dumps({
                        "type": "online_users",
                        "users": presence_service.get_online_users(),
                    }))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        await presence_service.disconnect(user_id)
        await presence_service.broadcast(
            {"type": "user_offline", "user_id": user_id},
        )
