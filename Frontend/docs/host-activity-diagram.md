# Host Activity Diagram

![Host Activity Diagram](./host-activity-diagram.png)

This diagram is based on the current host flow implemented in:

- `Frontend/src/App.jsx`
- `Frontend/src/pages/Host.jsx`
- `Frontend/src/pages/Lobby.jsx`
- `Frontend/src/pages/FestivalMap.jsx`
- `Backend/controllers/room_controller.go`

```mermaid
flowchart TD
    A([Start]) --> B[Choose Host<br/>Enter name]
    B --> C[Set room options<br/>mode, players, booths<br/>privacy, prizes]
    C --> D{Create room success?}
    D -- No --> C
    D -- Yes --> E[Create room + host<br/>status = waiting]
    E --> F[Lobby<br/>load room + WebSocket]

    F --> G{Host action}
    G --> H[Edit prizes]
    H --> I{Save allowed?}
    I -- No --> F
    I -- Yes --> J[PATCH prizes]
    J --> F

    G --> K[Start game]
    K --> L{Start allowed?}
    L -- No --> F
    L -- Yes --> M[status = playing<br/>assign teams if needed<br/>unlock first booth]
    M --> N[Host Monitor<br/>track room + progress]
    N --> O{All players complete?}
    O -- No --> N
    O -- Yes --> P[Finalize]
    P --> Q{Finalize allowed?}
    Q -- No --> N
    Q -- Yes --> R[status = finished<br/>build summary]
    R --> S[Summary page]
    S --> T([Exit / timeout])
```

Notes:

- `Create room success?` covers both frontend validation and backend room creation.
- `Save allowed?` means the requester is the host and the room is still `waiting`.
- `Start allowed?` means the requester is the host and the room can move from `waiting` to `playing`.
- In `team` mode, the backend assigns teams before players start the booth sequence.
- `Finalize allowed?` means the requester is the host and every non-host player has completed every selected booth.
