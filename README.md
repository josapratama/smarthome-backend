# Smart Home Backend (Bun + Hono + Prisma)

Backend untuk **Smart Home berbasis IoT + AI** dengan:

- **REST API** (Android ⇄ Backend) + **Swagger UI (OpenAPI)**
- Kontrak **MQTT topics** (IoT ⇄ Backend) via **AsyncAPI**
- Database **PostgreSQL** via **Prisma**
- **Docker Compose** untuk menjalankan service dev
- Landing page sederhana pakai **Tailwind** (biar stack kamu kepakai dan siap untuk admin panel ke depan)

---

## Tech Stack

- Runtime: **Bun**
- Web framework: **Hono**
- REST schema: **@hono/zod-openapi** (Zod + OpenAPI)
- Swagger UI: **@hono/swagger-ui**
- DB: **PostgreSQL**
- ORM: **Prisma**
- Docs MQTT: **AsyncAPI** (YAML)
- Container: **Docker + Docker Compose**
- UI (landing/admin starter): **Tailwind CSS**

---

## Fitur yang sudah ada

### 1) REST API (v1)

#### Auth (basic)

> Catatan: Saat ini auth masih basic (register/login + login history). JWT/session bisa ditambahkan pada tahap berikutnya.

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

#### Homes

- `GET /api/v1/homes?ownerId=...&ownerEmail=...`
- `POST /api/v1/homes`
- `GET /api/v1/homes/{homeId}`

#### Devices

- `GET /api/v1/homes/{homeId}/devices`
- `POST /api/v1/homes/{homeId}/devices`
- `GET /api/v1/devices/{deviceId}`
- `PATCH /api/v1/devices/{deviceId}`

#### Sensor Data (tabel: `sensor_data`)

- `POST /api/v1/devices/{deviceId}/telemetry`  
  (HTTP ingest snapshot: current/gas_ppm/flame/bin_level)
- `GET /api/v1/devices/{deviceId}/telemetry/latest`
- `GET /api/v1/devices/{deviceId}/telemetry?from=...&to=...&limit=...`

#### Commands (tabel: `command`)

- `POST /api/v1/devices/{deviceId}/commands`
- `GET /api/v1/commands/{commandId}`

#### Events/Alarms (tabel: `alarm_event`)

- `GET /api/v1/homes/{homeId}/events?from=...&to=...&limit=...`
- `POST /api/v1/homes/{homeId}/events`

#### AI (tabel: `energy_prediction`, `anomaly_result`)

- `POST /api/v1/devices/{deviceId}/energy-predictions`
- `GET /api/v1/devices/{deviceId}/energy-predictions`
- `POST /api/v1/predictions/{predictionId}/anomalies`
- `GET /api/v1/predictions/{predictionId}/anomalies`

#### Notification Endpoint (pengganti push token)

> Ini **tidak wajib FCM**. Bisa MQTT/WS/SSE/Webhook/Custom.  
> Catatan Android: notifikasi “tetap masuk saat app mati” paling stabil tetap FCM.

- `GET /api/v1/users/{userId}/notification-endpoints`
- `POST /api/v1/users/{userId}/notification-endpoints`

### Dokumentasi

- Swagger UI: `GET /docs`
- OpenAPI JSON: `GET /openapi.json`
- AsyncAPI MQTT (YAML): `GET /docs/asyncapi.yaml`

### Layanan dev via Docker Compose

- PostgreSQL: `db`
- MQTT broker (Mosquitto): `mqtt`
- Backend API: `api`

---

## Struktur Folder

```
.
├─ src/
│  ├─ app.ts              # Hono app + Swagger + static
│  ├─ index.ts            # Bun.serve
│  ├─ input.css           # Tailwind input
│  ├─ routes/v1.ts         # REST API v1 (Zod + OpenAPI)
│  └─ lib/
│     ├─ env.ts           # load + validate env
│     └─ prisma.ts        # PrismaClient singleton
├─ prisma/
│  └─ schema.prisma
├─ docs/
│  └─ asyncapi.yaml
├─ public/
│  └─ index.html          # landing page (Tailwind)
├─ docker-compose.yml
├─ Dockerfile
└─ README.md
```

---

## Prasyarat

- Bun terpasang
- Docker + Docker Compose
- Git

---

## Quickstart (Local Dev)

1. **Clone repo & install dependencies**

```bash
git clone <https://github.com/josapratama/smarthome-backend.git>
cd smarthome-backend
bun install
```

2. **Siapkan env**

```bash
cp .env.example .env
```

> Untuk dev dengan Postgres di Docker (port 5432), biarkan `DATABASE_URL` default.

3. **Jalankan Postgres + MQTT**

```bash
docker compose up -d db mqtt
```

4. **Migrasi DB (buat tabel)**

```bash
bunx prisma migrate dev --name init
```

> Perintah ini akan membuat folder `prisma/migrations` dan mengaplikasikan schema.

5. **Generate Tailwind CSS**

```bash
bun run tailwind:build
```

6. **Jalankan server**

```bash
bun run dev
# atau sekaligus watch Tailwind:
# bun run dev:ui
```

7. **Buka**

- Landing: `http://localhost:3000/`
- Swagger: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`
- AsyncAPI YAML: `http://localhost:3000/docs/asyncapi.yaml`

---

## Quickstart (Full Docker)

> Catatan: `api` image akan built dari Dockerfile. Pastikan kamu sudah punya migrations (`bunx prisma migrate dev`) dan sudah di-commit.

```bash
docker compose up --build
```

Jika butuh mengaplikasikan migrasi ke DB (misalnya di server):

```bash
docker compose exec api bunx prisma migrate deploy
```

---

## Ringkasan Database

Tabel inti:

- user_account : akun user (username/email/password/role)

- login_history : audit login (user_id, login_time, ip_address)

- home : grouping rumah/lokasi

- device_status : device IoT (device_name, room, status, last_seen_at, user_id, home_id)

- sensor_data : snapshot data sensor (current, gas_ppm, flame, bin_level, timestamp)

- alarm_event : event/alarm (type, message, severity, source, triggered_at) terhubung ke sensor_data & device

- energy_prediction : prediksi energi (predicted_energy, actual_energy, window, model_version)

- anomaly_result : hasil anomali (is_anomaly, score, metric, details)

- command : perintah ke device (type, payload, status, acked_at)

- notification_endpoint : endpoint notifikasi (channel + value)

---

## Contoh Request (cURL)

### 1) Register

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"temanakun","email":"temanakun293@gmail.com","password":"secret","name":"Temanakun"}'
```

### 2) Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"temanakun293@gmail.com","password":"secret"}'
```

### 3) Create Home

```bash
curl -X POST http://localhost:3000/api/v1/homes \
  -H 'Content-Type: application/json' \
  -d '{"name":"Rumah Utama","ownerEmail":"temanakun293@gmail.com","ownerName":"Temanakun"}'
```

### 4) Create Device

```bash
curl -X POST http://localhost:3000/api/v1/homes/<HOME_ID>/devices \
  -H 'Content-Type: application/json' \
  -d '{"deviceName":"ESP32-LivingRoom","room":"Living Room","userId":1}'
```

### 5) Ingest Telemetry (SensorData snapshot)

```bash
curl -X POST http://localhost:3000/api/v1/devices/<DEVICE_ID>/telemetry \
  -H 'Content-Type: application/json' \
  -d '{"current":0.72,"gasPpm":650,"flame":false,"binLevel":32.5,"timestamp":"2026-02-07T10:00:00.000Z"}'
```

### 6) Create Command (relay)

```bash
curl -X POST http://localhost:3000/api/v1/devices/<DEVICE_ID>/commands \
  -H 'Content-Type: application/json' \
  -d '{"type":"relay_set","payload":{"relay":1,"state":"ON"}}'
```

### 7) Create Alarm/Event

```bash
curl -X POST http://localhost:3000/api/v1/homes/<HOME_ID>/events \
  -H 'Content-Type: application/json' \
  -d '{"deviceId":<DEVICE_ID>,"type":"gas_leak","message":"Gas ppm tinggi","severity":"HIGH","source":"DEVICE"}'
```

---

## Kontrak MQTT (AsyncAPI)

File: `docs/asyncapi.yaml`

Topik utama (ringkas):

- Telemetry publish dari device

- Command subscribe di device (.../cmd/relays/set)

- Ack publish dari device (.../cmd/ack)

- Availability + heartbeat

- Events publish (smarthome/v1/homes/{homeId}/events)

`Implementasi MQTT consumer/publisher akan kita kerjakan pada tahap berikutnya (streaming → simpan DB + trigger event + update ACK command).`

---

## Workflow Git (Commit & Push setiap perubahan)

Aku tidak bisa melakukan `git push` dari sisi aku langsung ke GitHub kamu, tapi aku bisa **pandu langkah dan command-nya**.

### Setup repo pertama kali

1. Buat repo kosong di GitHub (tanpa README) → copy URL repo-nya.
2. Di folder project:

```bash
git init
git add .
git commit -m "chore: bootstrap bun + hono + prisma"

git branch -M main
git remote add origin <REPO_URL>
git push -u origin main
```

### Setelah ada perubahan

Setiap kamu selesai 1 perubahan kecil:

```bash
git add -A
git commit -m "<pesan commit>"
git push
```

Rekomendasi pola pesan commit (Conventional Commits):

- `feat: ...` untuk fitur baru
- `fix: ...` untuk bug
- `docs: ...` untuk dokumentasi
- `chore: ...` untuk tooling/konfigurasi

---

## Roadmap berikutnya (yang biasanya kita kerjakan setelah template ini)

1. **Auth** (JWT / session) dan pemisahan multi-user yang proper
2. MQTT consumer service: subscribe telemetry → simpan ke Postgres → trigger event/anomaly
3. Command publisher: REST create command → publish ke MQTT → update status via ACK
4. AI pipeline sederhana: rule + anomaly detection, lalu emit `events` + `ai/*`
5. Push notification (FCM) untuk Android

---

## License

MIT (atau sesuaikan kebutuhanmu)
