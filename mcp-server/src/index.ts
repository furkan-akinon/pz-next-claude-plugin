import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

const log = (level: string, msg: string) => {
  process.stderr.write(
    JSON.stringify({ ts: new Date().toISOString(), level, msg }) + '\n'
  );
};

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();

  process.on('SIGINT', async () => {
    log('info', 'Shutting down (SIGINT)');
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    log('info', 'Shutting down (SIGTERM)');
    await server.close();
    process.exit(0);
  });

  await server.connect(transport);
  log('info', 'pz-next-registry MCP server started');
}

main().catch((error) => {
  log('error', `Fatal: ${error}`);
  process.exit(1);
});
