import json
import uuid
from typing import Any

from fastapi import WebSocket


class PlayerConnection:
    def __init__(self, websocket: WebSocket, user_id: str, username: str):
        self.websocket = websocket
        self.user_id = user_id
        self.username = username


class Room:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.players: dict[str, PlayerConnection] = {}
        self.game_state: dict[str, Any] = {}

    @property
    def player_count(self) -> int:
        return len(self.players)

    def player_list(self) -> list[dict]:
        return [{"user_id": p.user_id, "username": p.username} for p in self.players.values()]


class MultiplayerService:
    def __init__(self):
        self.rooms: dict[str, Room] = {}
        self.user_connections: dict[str, WebSocket] = {}

    def get_room(self, session_id: str) -> Room:
        if session_id not in self.rooms:
            self.rooms[session_id] = Room(session_id)
        return self.rooms[session_id]

    async def connect(self, session_id: str, user_id: str, username: str, websocket: WebSocket) -> Room:
        await websocket.accept()
        room = self.get_room(session_id)
        room.players[user_id] = PlayerConnection(websocket, user_id, username)
        self.user_connections[user_id] = websocket

        await self.broadcast(session_id, {
            "type": "player_joined",
            "user_id": user_id,
            "username": username,
            "players": room.player_list(),
        })
        return room

    async def disconnect(self, session_id: str, user_id: str) -> None:
        room = self.get_room(session_id)
        if user_id in room.players:
            del room.players[user_id]
            self.user_connections.pop(user_id, None)

            await self.broadcast(session_id, {
                "type": "player_left",
                "user_id": user_id,
                "players": room.player_list(),
            })

        if room.player_count == 0:
            del self.rooms[session_id]

    async def broadcast(self, session_id: str, message: dict) -> None:
        room = self.get_room(session_id)
        data = json.dumps(message)
        disconnected = []
        for uid, player in room.players.items():
            try:
                await player.websocket.send_text(data)
            except Exception:
                disconnected.append(uid)

        for uid in disconnected:
            await self.disconnect(session_id, uid)

    async def send_to_user(self, user_id: str, message: dict) -> bool:
        ws = self.user_connections.get(user_id)
        if ws:
            try:
                await ws.send_text(json.dumps(message))
                return True
            except Exception:
                self.user_connections.pop(user_id, None)
        return False

    async def update_game_state(self, session_id: str, state: dict) -> None:
        room = self.get_room(session_id)
        room.game_state.update(state)
        await self.broadcast(session_id, {
            "type": "state_update",
            "state": room.game_state,
        })


multiplayer_service = MultiplayerService()


class ChatService:
    def __init__(self):
        self.room_connections: dict[str, dict[str, WebSocket]] = {}

    def get_room_connections(self, session_id: str) -> dict[str, WebSocket]:
        if session_id not in self.room_connections:
            self.room_connections[session_id] = {}
        return self.room_connections[session_id]

    async def connect(self, session_id: str, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        connections = self.get_room_connections(session_id)
        connections[user_id] = websocket

    async def disconnect(self, session_id: str, user_id: str) -> None:
        connections = self.get_room_connections(session_id)
        connections.pop(user_id, None)
        if not connections:
            del self.room_connections[session_id]

    async def broadcast(self, session_id: str, message: dict, exclude_user: str | None = None) -> None:
        connections = self.get_room_connections(session_id)
        data = json.dumps(message)
        disconnected = []
        for uid, ws in connections.items():
            if uid == exclude_user:
                continue
            try:
                await ws.send_text(data)
            except Exception:
                disconnected.append(uid)

        for uid in disconnected:
            await self.disconnect(session_id, uid)


chat_service = ChatService()


class PresenceService:
    def __init__(self):
        self.online_users: dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.online_users[user_id] = websocket

    async def disconnect(self, user_id: str) -> None:
        self.online_users.pop(user_id, None)

    async def broadcast(self, message: dict, exclude_user: str | None = None) -> None:
        data = json.dumps(message)
        disconnected = []
        for uid, ws in self.online_users.items():
            if uid == exclude_user:
                continue
            try:
                await ws.send_text(data)
            except Exception:
                disconnected.append(uid)

        for uid in disconnected:
            await self.disconnect(uid)

    def is_online(self, user_id: str) -> bool:
        return user_id in self.online_users

    def get_online_users(self) -> list[str]:
        return list(self.online_users.keys())


presence_service = PresenceService()
