# Building Blue Lake

Follow these instructions to build and package Blue Lake for production.

## Environment Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ghostintheprompt/blue-lake.git
   cd blue-lake
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure API Key**:
   Ensure `GEMINI_API_KEY` is available in your environment or a `.env` file.

## Build Commands

To build the static frontend assets and prepare the production server:

```bash
npm run build
```

The output will be generated in the `dist/` directory.

## First-Launch Instructions

1. Start the production server:
   ```bash
   NODE_ENV=production npm run dev
   ```
2. Access the interface at `http://localhost:3000`.

## Troubleshooting

- **Port Conflict**: If port 3000 is in use, modify the `PORT` constant in `server.ts`.
- **API Errors**: Ensure your `GEMINI_API_KEY` is valid and has sufficient quota.
- **Node Version**: This project requires Node.js v18 or higher.
