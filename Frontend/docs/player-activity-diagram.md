# Player Activity Diagram

![Player Activity Diagram](./player-activity-diagram.png)

This diagram is based on the current player flow implemented in:

- `Frontend/src/App.jsx`
- `Frontend/src/pages/RoomList.jsx`
- `Frontend/src/pages/Lobby.jsx`
- `Frontend/src/pages/FestivalMap.jsx`
- `Frontend/src/pages/SummaryPage.jsx`
- `Backend/controllers/room_controller.go`

```mermaid
flowchart TD
    A([Start]) --> B[Choose Player<br/>Enter name]
    B --> C[Room List<br/>GET rooms + global WebSocket]
    C --> D[Select room<br/>and Join]
    D --> E{Join allowed?}
    E -- No --> C
    E -- Yes --> F[Join success<br/>receive player id]

    F --> G[Lobby<br/>load room + WebSocket]
    G --> H{Host started?}
    H -- No --> G
    H -- Yes --> I[Festival Map<br/>show unlocked booths]

    I --> J[Play unlocked booth]
    J --> K[POST complete]
    K --> L{Submit success?}
    L -- No --> I
    L -- Yes --> M[Save score<br/>unlock next booth]

    M --> N{All booths done?}
    N -- No --> I
    N -- Yes --> O[Wait for host finalize]
    O --> P{Room finished?}
    P -- No --> O
    P -- Yes --> Q[GET summary]
    Q --> R[Summary page]
    R --> S([Exit / timeout])
```

Notes:

- `Join allowed?` covers room availability, duplicate-name checks, and password checks for private rooms.
- A player can only enter booths that are currently unlocked by the progress system.
- `Submit success?` means the room is active and the selected booth is currently unlocked for that player.
- After each successful submission, the backend saves score and unlocks the next booth in the selected sequence.
- Even after the player finishes every booth, the summary appears only after the host finalizes the room.
